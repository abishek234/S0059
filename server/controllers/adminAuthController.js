// controllers/adminAuthController.js - NEW FILE
const User = require('../models/User');


// @desc    Create admin account (Protected by secret key)
// @route   POST /api/auth/admin/create
// @access  Protected by secret key
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, phone, password, secretKey } = req.body;

        // Security: Require secret key from environment
        if (secretKey !== process.env.ADMIN_CREATE_SECRET) {
            return res.status(403).json({ 
                message: "Unauthorized. Invalid secret key." 
            });
        }

        // Check if admin already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: "User with this email already exists" 
            });
        }

        // Create admin user
        const admin = await User.create({
            name,
            email,
            phone,
            password,
            role: 'admin',
            companyName: 'Admin',
            location: 'System',
            isVerified: true,
            status: 'active'
        });

        res.status(201).json({ 
            success: true,
            message: "Admin account created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Create Admin Error:", error);
        res.status(500).json({ 
            message: 'Error creating admin account', 
            error: error.message 
        });
    }
};

// @desc    Get all admins (for super admin management)
// @route   GET /api/admin/list-admins
// @access  Protected (Admin only)
exports.listAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: admins.length,
            admins
        });

    } catch (error) {
        console.error("List Admins Error:", error);
        res.status(500).json({ 
            message: 'Error fetching admins', 
            error: error.message 
        });
    }
};

// @desc    Delete admin account (for super admin)
// @route   DELETE /api/admin/delete-admin/:id
// @access  Protected (Admin only)
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await User.findOne({ _id: id, role: 'admin' });
        
        if (!admin) {
            return res.status(404).json({ 
                message: "Admin not found" 
            });
        }

        // Prevent deleting yourself
        if (admin._id.toString() === req.user.id) {
            return res.status(400).json({ 
                message: "Cannot delete your own admin account" 
            });
        }

        await admin.deleteOne();

        res.json({
            success: true,
            message: "Admin account deleted successfully"
        });

    } catch (error) {
        console.error("Delete Admin Error:", error);
        res.status(500).json({ 
            message: 'Error deleting admin', 
            error: error.message 
        });
    }
};