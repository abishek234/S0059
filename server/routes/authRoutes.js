// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const adminAuthController = require("../controllers/adminAuthController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// === AUTHENTICATION ROUTES ===
// user Registration
router.post("/register", authController.signup);


// Login (works for both users and admins)
router.post("/login", authController.login);
router.post('/verification-otp', authController.verifyOtpAndLogin);
router.get('/profile/:id', authController.getUserProfile);



router.post('/request-otp', authController.otp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/change-password', authController.changePassword);


// === ADMIN MANAGEMENT ROUTES ===
// Create admin (protected by secret key)
router.post('/admin/create', adminAuthController.createAdmin);

// Admin management (requires admin authentication)
router.get('/admin/list', protect, adminOnly, adminAuthController.listAdmins);
router.delete('/admin/delete/:id', protect, adminOnly, adminAuthController.deleteAdmin);

module.exports = router;