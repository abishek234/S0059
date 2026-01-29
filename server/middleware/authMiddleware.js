// middleware/authMiddleware.js - UPDATED to check suspension
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // **NEW: Check if user is suspended**
        if (user.status === 'suspended' && user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Your account has been suspended',
                suspended: true,
                suspensionReason: user.suspensionReason || 'Please contact admin for details.'
            });
        }

        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status
        };

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};



// Admin-only middleware
exports.adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required." 
    });
  }

  next();
};

exports.optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};