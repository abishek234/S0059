const WasteSubmission = require('../models/WasteSubmission');
const aiService = require('../services/aiService');

// @desc    Submit waste data and generate AI recommendations
// @route   POST /api/waste/submit
// @access  Private
exports.submitWaste = async (req, res) => {
    try {
        const { material, quantity, properties, industry } = req.body;

        // Validation
        if (!material || !quantity || !industry) {
            return res.status(400).json({
                message: "Please provide material, quantity, and industry"
            });
        }

        // Check for existing processing submissions for this user
        const existingProcessing = await WasteSubmission.findOne({
            userId: req.user.id,
            status: 'processing'
        });

        if (existingProcessing) {
            return res.status(429).json({
                message: "You have a submission currently being processed. Please wait for it to complete.",
                submissionId: existingProcessing._id
            });
        }

        // Check for exact duplicate completed submissions in last 5 minutes
        // This prevents accidental re-submissions while allowing legitimate re-analysis
        // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const exactDuplicate = await WasteSubmission.findOne({
            userId: req.user.id,
            material: material.trim(),
            quantity: quantity.trim(),
            industry: industry.trim(),
            status: 'completed',
        });

        if (exactDuplicate) {
            return res.status(409).json({
                message: "You just analyzed this exact waste data. Please view existing results or wait a few minutes before re-analyzing.",
                existingSubmissionId: exactDuplicate._id,
                existingSubmission: {
                    material: exactDuplicate.material,
                    quantity: exactDuplicate.quantity,
                    status: exactDuplicate.status,
                    createdAt: exactDuplicate.createdAt
                }
            });
        }

        // Create initial submission
        const submission = new WasteSubmission({
            userId: req.user.id,
            material,
            quantity,
            properties: properties || [],
            industry,
            status: 'processing'
        });

        await submission.save();

        // Send immediate response with submission ID
        res.status(202).json({
            message: "Processing your waste data. This may take 30-60 seconds...",
            submissionId: submission._id,
            status: 'processing'
        });

        // Process AI generation asynchronously (continues after response sent)
        (async () => {
            try {
                console.log(`Starting AI processing for submission ${submission._id}`);

                // Step 1: Generate product ideas with Groq
                const ideas = await aiService.generateProductIdeas({
                    material,
                    quantity,
                    properties: properties || [],
                    industry
                });

                console.log(`Generated ${ideas.length} product ideas`);

                // Step 2: Generate images with rate limit handling
                const imageUrls = await aiService.generateProductImagesWithRetry(ideas);

                // Step 3: Calculate impact metrics per idea with product-specific factors
                const processedIdeas = ideas.map((idea, index) => {
                    const impact = aiService.calculateImpact({ quantity, material }, idea.name);

                    return {
                        name: idea.name,
                        description: idea.description,
                        targetMarket: idea.targetMarket,
                        researchQuestions: idea.researchQuestions,
                        successFactors: idea.successFactors,
                        imageUrl: imageUrls[index],
                        ...impact
                    };
                });

                // Step 4: Update submission with results
                submission.productIdeas = processedIdeas;
                submission.status = 'completed';
                await submission.save();

                console.log(`Submission ${submission._id} completed successfully`);

            } catch (aiError) {
                console.error("AI Processing Error:", aiError);
                submission.status = 'failed';
                submission.errorMessage = aiError.message;
                await submission.save();
            }
        })();

    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({
            message: "Server error during submission",
            error: error.message
        });
    }
};

// @desc    Check processing status of a submission
// @route   GET /api/waste/status/:id
// @access  Private
exports.getSubmissionStatus = async (req, res) => {
    try {
        const submission = await WasteSubmission.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).select('status productIdeas createdAt errorMessage');

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        res.json({
            status: submission.status,
            hasResults: submission.productIdeas.length > 0,
            ideasCount: submission.productIdeas.length,
            createdAt: submission.createdAt,
            errorMessage: submission.errorMessage || null
        });
    } catch (error) {
        console.error("Status Check Error:", error);
        res.status(500).json({
            message: "Failed to check status",
            error: error.message
        });
    }
};

// @desc    Get user's waste submission history
// @route   GET /api/waste/history
// @access  Private
exports.getSubmissionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const submissions = await WasteSubmission.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await WasteSubmission.countDocuments({ userId: req.user.id });

        res.json({
            success: true,
            count: submissions.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            submissions
        });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({
            message: "Failed to fetch history",
            error: error.message
        });
    }
};

// @desc    Get specific submission details
// @route   GET /api/waste/:id
// @access  Private
exports.getSubmissionById = async (req, res) => {
    try {
        const submission = await WasteSubmission.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        res.json({
            success: true,
            submission
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({
            message: "Failed to fetch submission",
            error: error.message
        });
    }
};

// @desc    Delete a submission
// @route   DELETE /api/waste/:id
// @access  Private
exports.deleteSubmission = async (req, res) => {
    try {
        const submission = await WasteSubmission.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        res.json({
            success: true,
            message: "Submission deleted successfully"
        });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({
            message: "Failed to delete submission",
            error: error.message
        });
    }
};

// @desc    Get statistics for user's submissions
// @route   GET /api/waste/stats
// @access  Private
exports.getSubmissionStats = async (req, res) => {
    try {
        const submissions = await WasteSubmission.find({
            userId: req.user.id,
            status: 'completed'
        });

        // Calculate aggregate statistics
        let totalCO2Saved = 0;
        let totalWaterSaved = 0;
        let totalIdeas = 0;
        let avgProfitMargin = 0;

        submissions.forEach(submission => {
            submission.productIdeas.forEach(idea => {
                totalCO2Saved += idea.co2Saved || 0;
                totalWaterSaved += idea.waterSaved || 0;
                avgProfitMargin += idea.profitMargin || 0;
                totalIdeas++;
            });
        });

        avgProfitMargin = totalIdeas > 0 ? Math.round(avgProfitMargin / totalIdeas) : 0;

        res.json({
            success: true,
            stats: {
                totalSubmissions: submissions.length,
                totalIdeas,
                totalCO2Saved,
                totalWaterSaved,
                avgProfitMargin,
                industries: [...new Set(submissions.map(s => s.industry))]
            }
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({
            message: "Failed to fetch statistics",
            error: error.message
        });
    }
};

// @desc    Re-analyze existing waste submission
// @route   POST /api/waste/reanalyze/:id
// @access  Private
exports.reanalyzeWaste = async (req, res) => {
    try {
        const { id } = req.params;

        // Get original submission
        const original = await WasteSubmission.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!original) {
            return res.status(404).json({ message: "Original submission not found" });
        }

        // Check if user has a submission currently processing
        const existingProcessing = await WasteSubmission.findOne({
            userId: req.user.id,
            status: 'processing'
        });

        if (existingProcessing) {
            return res.status(429).json({
                message: "You have a submission currently being processed. Please wait for it to complete.",
                submissionId: existingProcessing._id
            });
        }

        // Collect ALL previous ideas from this waste data to avoid repetition
        const allPreviousSubmissions = await WasteSubmission.find({
            userId: req.user.id,
            material: original.material,
            quantity: original.quantity,
            industry: original.industry,
            status: 'completed'
        });

        // Extract all previously generated idea names
        const excludeIdeas = [];
        allPreviousSubmissions.forEach(submission => {
            submission.productIdeas.forEach(idea => {
                excludeIdeas.push({
                    name: idea.name,
                    description: idea.description
                });
            });
        });

        console.log(`Excluding ${excludeIdeas.length} previous ideas from regeneration`);

        // Create new submission with same data
        const newSubmission = new WasteSubmission({
            userId: req.user.id,
            material: original.material,
            quantity: original.quantity,
            properties: original.properties,
            industry: original.industry,
            status: 'processing'
        });

        await newSubmission.save();

        res.status(202).json({
            message: "Generating NEW ideas. This may take 30-60 seconds...",
            submissionId: newSubmission._id,
            status: 'processing',
            excludedCount: excludeIdeas.length
        });

        // Process AI generation asynchronously
        (async () => {
            try {
                console.log(`Starting re-analysis for submission ${newSubmission._id}`);

                const { material, quantity, properties, industry } = original;

                // Step 1: Generate product ideas with Groq (WITH EXCLUSION LIST)
                const ideas = await aiService.generateProductIdeas({
                    material,
                    quantity,
                    properties: properties || [],
                    industry
                }, excludeIdeas); // Pass previous ideas to avoid repetition

                console.log(`Generated ${ideas.length} NEW product ideas for re-analysis`);

                // Step 2: Generate images
                const imageUrls = await aiService.generateProductImagesWithRetry(ideas);

                // Step 3: Calculate impact metrics per idea
                const processedIdeas = ideas.map((idea, index) => {
                    const impact = aiService.calculateImpact({
                        quantity,
                        material
                    }, idea.name);

                    return {
                        name: idea.name,
                        description: idea.description,
                        targetMarket: idea.targetMarket,
                        researchQuestions: idea.researchQuestions,
                        successFactors: idea.successFactors,
                        imageUrl: imageUrls[index],
                        ...impact
                    };
                });

                // Step 4: Update submission with results
                newSubmission.productIdeas = processedIdeas;
                newSubmission.status = 'completed';
                await newSubmission.save();

                console.log(`Re-analysis ${newSubmission._id} completed successfully with NEW ideas`);

            } catch (aiError) {
                console.error("Re-analysis AI Processing Error:", aiError);
                newSubmission.status = 'failed';
                newSubmission.errorMessage = aiError.message;
                await newSubmission.save();
            }
        })();

    } catch (error) {
        console.error("Re-analyze Error:", error);
        res.status(500).json({
            message: "Failed to re-analyze submission",
            error: error.message
        });
    }
};