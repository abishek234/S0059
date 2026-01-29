// routes/admin.js - NEW FILE
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  deactivateProduct,
  getProductById,
  getAllProducts,
  getAllUsers,
  suspendUser,
  reactivateUser,
  getAllReports,
  getPendingReports,
  resolveReport,
  reactivateProduct,
  getDeactivatedProducts
} = require('../controllers/adminController');

// Apply admin authentication to all routes
router.use(protect, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// Product Management
router.get('/products/pending', getPendingProducts);
router.get('/products', getAllProducts);
router.post('/products/:id/approve', approveProduct);
router.post('/products/:id/reject', rejectProduct);
router.post('/products/:id/deactivate', deactivateProduct);
router.get('/products/:id', getProductById);

// User Management
router.get('/users', getAllUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/reactivate', reactivateUser);

// Report Management
router.get('/reports',  getAllReports);
router.get('/reports/pending', getPendingReports);
router.post('/reports/:id/resolve', resolveReport);

// Product reactivation
router.post('/products/:id/reactivate',  reactivateProduct);

// Get deactivated products
router.get('/products/deactivated',getDeactivatedProducts);

module.exports = router;