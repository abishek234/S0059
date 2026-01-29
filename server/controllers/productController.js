// controllers/productController.js - NEW FILE
const Product = require('../models/Product');
const WasteSubmission = require('../models/WasteSubmission');
const User = require('../models/User');
const Report = require('../models/Report');
const mongoose = require('mongoose');
const mailer = require('../utils/mailer');

// @desc    Publish a specific idea from submission
// @route   POST /api/products/publish
// @access  Private (User)
exports.publishIdea = async (req, res) => {
    try {
        const { submissionId, ideaIndex } = req.body;

        // Validation
        if (ideaIndex === undefined || !submissionId) {
            return res.status(400).json({
                message: "Please provide submissionId and ideaIndex"
            });
        }

        // Check if user already has a pending product
        const existingPending = await Product.findOne({
            userId: req.user.id,
            status: 'pending_verification'
        });

        if (existingPending) {
            return res.status(409).json({
                message: "You already have a product pending verification. Please wait for admin review.",
                pendingProduct: {
                    id: existingPending._id,
                    name: existingPending.name,
                    submittedAt: existingPending.createdAt
                }
            });
        }

        // Get the submission
        const submission = await WasteSubmission.findOne({
            _id: submissionId,
            userId: req.user.id
        });

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        if (submission.status !== 'completed') {
            return res.status(400).json({ message: "Submission is not completed yet" });
        }

        // Validate idea index
        if (ideaIndex < 0 || ideaIndex >= submission.productIdeas.length) {
            return res.status(400).json({ message: "Invalid idea index" });
        }

        const selectedIdea = submission.productIdeas[ideaIndex];

        // Check if this specific idea is already published
        if (selectedIdea.isPublished) {
            return res.status(409).json({
                message: "This idea has already been published",
                productId: selectedIdea.publishedProductId
            });
        }

        // Create product from idea
        const product = new Product({
            userId: req.user.id,
            submissionId: submission._id,
            ideaIndex: ideaIndex,
            
            // Copy idea content
            name: selectedIdea.name,
            description: selectedIdea.description,
            targetMarket: selectedIdea.targetMarket,
            imageUrl: selectedIdea.imageUrl,
            co2Saved: selectedIdea.co2Saved,
            waterSaved: selectedIdea.waterSaved,
            profitMargin: selectedIdea.profitMargin,
            feasibilityScore: selectedIdea.feasibilityScore,
            
            // Copy waste details
            material: submission.material,
            quantity: submission.quantity,
            industry: submission.industry,
            properties: submission.properties,
            
            status: 'pending_verification'
        });

        await product.save();

        // Mark idea as published in submission
        submission.productIdeas[ideaIndex].isPublished = true;
        submission.productIdeas[ideaIndex].publishedProductId = product._id;
        await submission.save();

          // Notify admin about new submission
        const user = await User.findById(req.user.id);
        
        try {
            await mailer.notifyAdminProductSubmitted(
                process.env.ADMIN_EMAIL,
                {
                    id: product._id,
                    name: product.name,
                    material: product.material,
                    industry: product.industry,
                    createdAt: product.createdAt
                },
                {
                    name: user.name,
                    email: user.email,
                    companyName: user.companyName,
                    isVerified: user.isVerified
                }
            );
        } catch (emailError) {
            console.error('Failed to send admin notification:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: "Product submitted for verification. This may take 1-2 working days.",
            product: {
                id: product._id,
                name: product.name,
                status: product.status,
                submittedAt: product.createdAt
            }
        });

    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({
            message: "Failed to publish product",
            error: error.message
        });
    }
};

// @desc    Get user's published products (for "Published Products" tab)
// @route   GET /api/products/my-products
// @access  Private (User)
exports.getMyProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Ensure userId is ObjectId
        const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
            ? new mongoose.Types.ObjectId(req.user.id)
            : req.user.id;

        // Fetch products
        const products = await Product.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-adminNotes');

        const total = await Product.countDocuments({ userId });

        // Get status counts with proper ObjectId conversion
        const statusCounts = await Product.aggregate([
            { 
                $match: { 
                    userId: userId 
                } 
            },
            { 
                $group: { 
                    _id: '$status', 
                    count: { $sum: 1 } 
                } 
            }
        ]);

        // Initialize counts
        const counts = {
            pending: 0,
            approved: 0,
            rejected: 0,
            deactivated: 0
        };

        // Map aggregate results to counts
        statusCounts.forEach(item => {
            switch (item._id) {
                case 'pending_verification':
                    counts.pending = item.count;
                    break;
                case 'approved':
                    counts.approved = item.count;
                    break;
                case 'rejected':
                    counts.rejected = item.count;
                    break;
                case 'deactivated':
                    counts.deactivated = item.count;
                    break;
                default:
                    break;
            }
        });

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            },
            statusCounts: counts
        });

    } catch (error) {
        console.error("Get Products Error:", error);
        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private (User - own products) / Public (approved products)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('userId', 'name companyName location')
            .select('-adminNotes');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check access permissions
        const isOwner = req.user && product.userId._id.toString() === req.user.id;
        const isAdmin = req.user && req.user.role === 'admin';
        const isPublic = product.isPublic && product.status === 'approved';

        if (!isOwner && !isAdmin && !isPublic) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Increment view count for public products
        if (isPublic && !isOwner) {
            product.viewCount += 1;
            await product.save();
        }

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error("Get Product Error:", error);
        res.status(500).json({
            message: "Failed to fetch product",
            error: error.message
        });
    }
};

// @desc    Unpublish/Delete a product (only if pending or rejected)
// @route   DELETE /api/products/:id
// @access  Private (User)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Only allow deletion of pending or rejected products
        if (product.status === 'approved' || product.status === 'deactivated') {
            return res.status(403).json({
                message: "Cannot delete approved or deactivated products. Please contact support."
            });
        }

        // Update submission to mark idea as unpublished
        await WasteSubmission.updateOne(
            { 
                _id: product.submissionId,
                'productIdeas.publishedProductId': product._id
            },
            {
                $set: {
                    'productIdeas.$.isPublished': false,
                    'productIdeas.$.publishedProductId': null
                }
            }
        );

        await product.deleteOne();

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
};

// @desc    Report a product
// @route   POST /api/products/:id/report
// @access  Public
exports.reportProduct = async (req, res) => {
    try {
        const { reason, details, reporterEmail } = req.body;

        if (!reason || !reporterEmail) {
            return res.status(400).json({
                message: "Please provide reason and email"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.status !== 'approved') {
            return res.status(400).json({
                message: "Can only report approved products"
            });
        }

        // Check for duplicate reports from same email
        const existingReport = await Report.findOne({
            productId: product._id,
            reporterEmail: reporterEmail,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(409).json({
                message: "You have already reported this product"
            });
        }

        const report = new Report({
            productId: product._id,
            reporterEmail,
            reason,
            details
        });

        await report.save();

        // Increment report count
        product.reportCount += 1;
        await product.save();

        res.status(201).json({
            success: true,
            message: "Report submitted successfully. We'll review it shortly."
        });

    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({
            message: "Failed to submit report",
            error: error.message
        });
    }
};

// controllers/productController.js - Add public endpoint
exports.getPublicProducts = async (req, res) => {
    try {
        const products = await Product.find({ 
            status: 'approved',
            isPublic: true 
        })
        .populate('userId', 'name companyName location')
        .sort({ publishedAt: -1 })
        .select('-adminNotes -reviewedBy');

        // Calculate stats
        const stats = await Product.aggregate([
            { $match: { status: 'approved', isPublic: true } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalCO2Saved: { $sum: '$co2Saved' },
                    totalWaterSaved: { $sum: '$waterSaved' }
                }
            }
        ]);

        res.json({
            success: true,
            products,
            stats: stats[0] || { total: 0, totalCO2Saved: 0, totalWaterSaved: 0 }
        });

    } catch (error) {
        console.error('Get Public Products Error:', error);
        res.status(500).json({
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};
