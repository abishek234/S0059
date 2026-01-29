// routes/product.js - NEW FILE
const express = require('express');
const router = express.Router();
const { protect,optionalProtect } = require('../middleware/authMiddleware');
const {
  publishIdea,
  getMyProducts,
  getProductById,
  deleteProduct,
  reportProduct,
  getPublicProducts
} = require('../controllers/productController');

router.get('/public', getPublicProducts);


// @route   POST /api/products/publish
// @desc    Publish a specific idea from submission
// @access  Private (User)
router.post('/publish', protect, publishIdea);

// @route   GET /api/products/my-products
// @desc    Get user's published products (for "Published Products" tab)
// @access  Private (User)
router.get('/my-products', protect, getMyProducts);

// @route   GET /api/products/:id
// @desc    Get single product details
// @access  Private (User - own products) / Public (approved products)
router.get('/:id', optionalProtect, getProductById);

// @route   DELETE /api/products/:id
// @desc    Delete a product (only if pending or rejected)
// @access  Private (User)
router.delete('/:id', protect, deleteProduct);

// @route   POST /api/products/:id/report
// @desc    Report a product
// @access  Public
router.post('/:id/report', reportProduct);


module.exports = router;