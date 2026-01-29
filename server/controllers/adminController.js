// controllers/adminController.js - NEW FILE
const Product = require('../models/Product');
const User = require('../models/User');
const Report = require('../models/Report');
const WasteSubmission = require('../models/WasteSubmission');
const mailer = require('../utils/mailer');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        // User stats
        const totalUsers = await User.countDocuments({ role: 'user' });
        const verifiedUsers = await User.countDocuments({ role: 'user', isVerified: true });
        const suspendedUsers = await User.countDocuments({ role: 'user', status: 'suspended' });

        // Product stats
        const totalProducts = await Product.countDocuments();
        const pendingProducts = await Product.countDocuments({ status: 'pending_verification' });
        const approvedProducts = await Product.countDocuments({ status: 'approved' });
        const rejectedProducts = await Product.countDocuments({ status: 'rejected' });
        const deactivatedProducts = await Product.countDocuments({ status: 'deactivated' });

        // Report stats
        const pendingReports = await Report.countDocuments({ status: 'pending' });

        // Environmental impact (from approved products only)
        const impactStats = await Product.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalCO2Saved: { $sum: '$co2Saved' },
                    totalWaterSaved: { $sum: '$waterSaved' },
                    avgProfitMargin: { $avg: '$profitMargin' },
                    avgFeasibility: { $avg: '$feasibilityScore' }
                }
            }
        ]);

        const impact = impactStats[0] || {
            totalCO2Saved: 0,
            totalWaterSaved: 0,
            avgProfitMargin: 0,
            avgFeasibility: 0
        };

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    verified: verifiedUsers,
                    suspended: suspendedUsers
                },
                products: {
                    total: totalProducts,
                    pending: pendingProducts,
                    approved: approvedProducts,
                    rejected: rejectedProducts,
                    deactivated: deactivatedProducts
                },
                reports: {
                    pending: pendingReports
                },
                impact: {
                    totalCO2Saved: Math.round(impact.totalCO2Saved),
                    totalWaterSaved: Math.round(impact.totalWaterSaved),
                    avgProfitMargin: Math.round(impact.avgProfitMargin),
                    avgFeasibility: Math.round(impact.avgFeasibility)
                }
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

// @desc    Get pending products for review
// @route   GET /api/admin/products/pending
// @access  Private (Admin only)
exports.getPendingProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const products = await Product.find({ status: 'pending_verification' })
            .populate('userId', 'name email companyName location isVerified')
            .sort({ createdAt: 1 }) // Oldest first (FIFO)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments({ status: 'pending_verification' });

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        console.error("Pending Products Error:", error);
        res.status(500).json({
            message: "Failed to fetch pending products",
            error: error.message
        });
    }
};

// @desc    Approve a product (and verify user on first approval)
// @route   POST /api/admin/products/:id/approve
// @access  Private (Admin only)
exports.approveProduct = async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.status !== 'pending_verification') {
            return res.status(400).json({
                message: "Can only approve pending products"
            });
        }

        // Update product status
        product.status = 'approved';
        product.isPublic = true;
        product.publishedAt = new Date();
        product.reviewedBy = req.user.id;
        product.reviewedAt = new Date();
        if (adminNotes) product.adminNotes = adminNotes;

        await product.save();

        // **KEY FEATURE: Verify user on first approval**
        const user = await User.findById(product.userId);
        
        if (user && !user.isVerified) {
            user.isVerified = true;
            user.verifiedAt = new Date();
            user.verifiedBy = req.user.id;
            await user.save();
            
            console.log(`User ${user.email} automatically verified on first product approval`);
        }

           // Notify user about approval
        try {
            await mailer.notifyUserProductApproved(
                user.email,
                {
                    name: product.name,
                    material: product.material,
                    publishedAt: product.publishedAt
                },
                wasVerified
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }


        res.json({
            success: true,
            message: "Product approved successfully",
            product: {
                id: product._id,
                name: product.name,
                status: product.status,
                approvedAt: product.publishedAt
            },
            userVerified: user && !user.isVerified // Indicates if user was just verified
        });

    } catch (error) {
        console.error("Approve Error:", error);
        res.status(500).json({
            message: "Failed to approve product",
            error: error.message
        });
    }
};

// @desc    Reject a product
// @route   POST /api/admin/products/:id/reject
// @access  Private (Admin only)
exports.rejectProduct = async (req, res) => {
    try {
        const { rejectionReason, adminNotes } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                message: "Please provide rejection reason"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.status !== 'pending_verification') {
            return res.status(400).json({
                message: "Can only reject pending products"
            });
        }

        product.status = 'rejected';
        product.rejectionReason = rejectionReason;
        product.reviewedBy = req.user.id;
        product.reviewedAt = new Date();
        if (adminNotes) product.adminNotes = adminNotes;

        await product.save();

          // Notify user about rejection
        const user = await User.findById(product.userId);

        
        try {
            await mailer.notifyUserProductRejected(
                user.email,
                {
                    name: product.name,
                    material: product.material,
                    reviewedAt: product.reviewedAt
                },
                rejectionReason
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }

        res.json({
            success: true,
            message: "Product rejected",
            product: {
                id: product._id,
                name: product.name,
                status: product.status,
                rejectionReason: product.rejectionReason
            }
        });

    } catch (error) {
        console.error("Reject Error:", error);
        res.status(500).json({
            message: "Failed to reject product",
            error: error.message
        });
    }
};


// @desc    Get all products (with filters)
// @route   GET /api/admin/products
// @access  Private (Admin only)
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const { status, material, industry } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (material) filter.material = new RegExp(material, 'i');
        if (industry) filter.industry = new RegExp(industry, 'i');

        const products = await Product.find(filter)
            .populate('userId', 'name email companyName isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({ role: 'user' });

        res.json({
            success: true,
            users,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message
        });
    }
};


// @desc    Get pending reports
// @route   GET /api/admin/reports/pending
// @access  Private (Admin only)
exports.getPendingReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: 'pending' })
            .populate('productId', 'name status userId')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            reports
        });

    } catch (error) {
        console.error("Get Reports Error:", error);
        res.status(500).json({
            message: "Failed to fetch reports",
            error: error.message
        });
    }
};

// @desc    Resolve a report (and optionally deactivate product)
// @route   POST /api/admin/reports/:id/resolve
// @access  Private (Admin only)
exports.resolveReport = async (req, res) => {
    try {
        const { action, adminNotes } = req.body; // action: 'dismiss' or 'deactivate'

        const report = await Report.findById(req.params.id)
            .populate('productId');

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        report.status = 'resolved';
        report.resolvedBy = req.user.id;
        report.resolvedAt = new Date();
        if (adminNotes) report.adminNotes = adminNotes;

        await report.save();

        // If action is deactivate, deactivate the product
        if (action === 'deactivate' && report.productId) {
            report.productId.status = 'deactivated';
            report.productId.isPublic = false;
            report.productId.deactivationReason = `Report resolved: ${report.reason}`;
            await report.productId.save();
        }

        // Notify user about report resolution
        const user = await User.findById(report.productId.userId);

             try {
                await mailer.notifyUserProductDeactivatedFromReport(
                    user.email,
                    {
                        name: report.productId.name,
                        material: report.productId.material
                    },
                    {
                        reason: report.reason,
                        reporterEmail: report.reporterEmail,
                        deactivationReason: report.productId.deactivationReason
                    }
                );
            } catch (emailError) {
                console.error('Failed to send user notification:', emailError);
            }


        res.json({
            success: true,
            message: "Report resolved successfully",
            action: action || 'dismissed'
        });

    } catch (error) {
        console.error("Resolve Report Error:", error);
        res.status(500).json({
            message: "Failed to resolve report",
            error: error.message
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('userId', 'name email companyName location isVerified');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
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

// Get all reports (not just pending)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('productId', 'name material imageUrl status')
            .populate('resolvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error("Get All Reports Error:", error);
        res.status(500).json({
            message: "Failed to fetch reports",
            error: error.message
        });
    }
};

// Deactivate product (individual)
exports.deactivateProduct = async (req, res) => {
    try {
        const { deactivationReason, adminNotes, deactivationType } = req.body;

        if (!deactivationReason) {
            return res.status(400).json({
                message: "Please provide deactivation reason"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.status !== 'approved') {
            return res.status(400).json({
                message: "Can only deactivate approved products"
            });
        }

        // Store previous status for potential reactivation
        product.previousStatus = product.status;
        product.status = 'deactivated';
        product.isPublic = false;
        product.deactivationReason = deactivationReason;
        product.deactivationType = deactivationType || 'admin_action';
        product.deactivatedBy = req.user.id;
        product.deactivatedAt = new Date();
        if (adminNotes) product.adminNotes = adminNotes;

        await product.save();

        // Notify user
        const user = await User.findById(product.userId);
        
        try {
            await mailer.notifyUserProductDeactivated(
                user.email,
                {
                    name: product.name,
                    material: product.material
                },
                deactivationReason
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }

        res.json({
            success: true,
            message: "Product deactivated",
            product: {
                id: product._id,
                name: product.name,
                status: product.status,
                deactivationType: product.deactivationType
            }
        });

    } catch (error) {
        console.error("Deactivate Error:", error);
        res.status(500).json({
            message: "Failed to deactivate product",
            error: error.message
        });
    }
};

// Reactivate a deactivated product
exports.reactivateProduct = async (req, res) => {
    try {
        const { reactivationNotes } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.status !== 'deactivated') {
            return res.status(400).json({
                message: "Can only reactivate deactivated products"
            });
        }

        // Check if user is still active
        const user = await User.findById(product.userId);
        if (user.status === 'suspended') {
            return res.status(400).json({
                message: "Cannot reactivate product while user is suspended"
            });
        }

        // FIXED: Use updateOne to bypass validation
        await Product.updateOne(
            { _id: product._id },
            {
                $set: {
                    status: product.previousStatus || 'approved',
                    isPublic: true
                },
                $unset: {
                    deactivationReason: "",
                    deactivationType: "",
                    deactivatedBy: "",
                    deactivatedAt: "",
                    previousStatus: ""
                },
                $push: {
                    adminNotes: reactivationNotes ? `Reactivation: ${reactivationNotes}` : undefined
                }
            },
            { runValidators: false } // Skip validation
        );

        // Fetch updated product
        const updatedProduct = await Product.findById(product._id);

        // Notify user
        
        try {
            await mailer.notifyUserProductReactivated(
                user.email,
                {
                    name: updatedProduct.name,
                    material: updatedProduct.material
                }
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }

        res.json({
            success: true,
            message: "Product reactivated successfully",
            product: {
                id: updatedProduct._id,
                name: updatedProduct.name,
                status: updatedProduct.status
            }
        });

    } catch (error) {
        console.error("Reactivate Product Error:", error);
        res.status(500).json({
            message: "Failed to reactivate product",
            error: error.message
        });
    }
};

// Updated Suspend User - Track deactivation type
exports.suspendUser = async (req, res) => {
    try {
        const { suspensionReason } = req.body;

        if (!suspensionReason) {
            return res.status(400).json({
                message: "Please provide suspension reason"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                message: "Cannot suspend admin users"
            });
        }

        user.status = 'suspended';
        user.suspensionReason = suspensionReason;
        await user.save();

        // Deactivate all user's approved products with suspension tracking
        await Product.updateMany(
            { userId: user._id, status: 'approved' },
            { 
                previousStatus: 'approved', // Store previous status
                status: 'deactivated',
                isPublic: false,
                deactivationReason: `User suspended: ${suspensionReason}`,
                deactivationType: 'user_suspension',
                deactivatedBy: req.user.id,
                deactivatedAt: new Date()
            }
        );

        // Notify user
        
        try {
            await mailer.notifyUserSuspended(
                user.email,
                {
                    name: user.name,
                    email: user.email
                },
                suspensionReason
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }

        res.json({
            success: true,
            message: "User suspended successfully",
            user: {
                id: user._id,
                email: user.email,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Suspend User Error:", error);
        res.status(500).json({
            message: "Failed to suspend user",
            error: error.message
        });
    }
};

// Updated Reactivate User - Handle products
exports.reactivateUser = async (req, res) => {
    try {
        const { reactivateProducts } = req.body; // Option to reactivate products

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status !== 'suspended') {
            return res.status(400).json({
                message: "User is not suspended"
            });
        }

        user.status = 'active';
        user.suspensionReason = null;
        await user.save();

        let productsReactivated = 0;

        // Reactivate products that were deactivated due to user suspension
        if (reactivateProducts !== false) { // Default to true
            const result = await Product.updateMany(
                { 
                    userId: user._id, 
                    status: 'deactivated',
                    deactivationType: 'user_suspension' // Only reactivate suspension-related deactivations
                },
                { 
                    status: 'approved',
                    isPublic: true,
                    deactivationReason: null,
                    deactivationType: null,
                    deactivatedBy: null,
                    deactivatedAt: null,
                    previousStatus: null
                }
            );
            productsReactivated = result.modifiedCount;
        }

        
        try {
            await mailer.notifyUserReactivated(
                user.email,
                {
                    name: user.name,
                    email: user.email
                },
                productsReactivated
            );
        } catch (emailError) {
            console.error('Failed to send user notification:', emailError);
        }

        res.json({
            success: true,
            message: "User reactivated successfully",
            user: {
                id: user._id,
                email: user.email,
                status: user.status
            },
            productsReactivated
        });

    } catch (error) {
        console.error("Reactivate User Error:", error);
        res.status(500).json({
            message: "Failed to reactivate user",
            error: error.message
        });
    }
};

// NEW: Get deactivated products (for admin review)
exports.getDeactivatedProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const { deactivationType } = req.query;
        
        let filter = { status: 'deactivated' };
        if (deactivationType) {
            filter.deactivationType = deactivationType;
        }

        const products = await Product.find(filter)
            .populate('userId', 'name email companyName status')
            .populate('deactivatedBy', 'name email')
            .sort({ deactivatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        console.error("Get Deactivated Products Error:", error);
        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};