const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitWaste,
  getSubmissionStatus,
  getSubmissionHistory,
  getSubmissionById,
  deleteSubmission,
  getSubmissionStats,
  reanalyzeWaste
} = require('../controllers/wasteController');

// @route   POST /api/waste/submit
// @desc    Submit waste data and generate AI recommendations
// @access  Private
router.post('/submit', protect, submitWaste);

// @route   POST /api/waste/reanalyze/:id
// @desc    Re-analyze existing waste submission with new AI ideas
// @access  Private
router.post('/reanalyze/:id', protect, reanalyzeWaste);

// @route   GET /api/waste/status/:id
// @desc    Check processing status of a submission
// @access  Private
router.get('/status/:id', protect, getSubmissionStatus);

// @route   GET /api/waste/history
// @desc    Get user's waste submission history with pagination
// @access  Private
router.get('/history', protect, getSubmissionHistory);

// @route   GET /api/waste/stats
// @desc    Get aggregate statistics for user's submissions
// @access  Private
router.get('/stats', protect, getSubmissionStats);

// @route   GET /api/waste/:id
// @desc    Get specific submission details
// @access  Private
router.get('/:id', protect, getSubmissionById);

// @route   DELETE /api/waste/:id
// @desc    Delete a submission
// @access  Private
router.delete('/:id', protect, deleteSubmission);

module.exports = router;