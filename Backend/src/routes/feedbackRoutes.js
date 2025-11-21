const express = require('express');
const {
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedbackStatus,
  getMyFeedback,
  getPublicFeedback,
  getFeedbackStatistics,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadMultiple, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/public', getPublicFeedback);

// Protected routes (require authentication)
router.use(authenticate);

// Tourist routes
router.get('/my-feedback', authorize('tourist'), getMyFeedback);
router.post('/', authorize('tourist'), uploadMultiple('images', 5), uploadToCloudinary, createFeedback);
router.put('/:id', authorize('tourist'), updateFeedback);

// Admin, Wildlife Officer, and Call Operator routes
router.get('/statistics', authorize('admin', 'wildlifeOfficer', 'callOperator'), getFeedbackStatistics);
router.get('/', authorize('admin', 'wildlifeOfficer', 'callOperator'), getFeedback);
router.get('/:id', authorize('admin', 'wildlifeOfficer', 'callOperator', 'tourist'), getFeedbackById);
router.put('/:id/status', authorize('admin', 'wildlifeOfficer', 'callOperator'), updateFeedbackStatus);

// Delete feedback - allows both tourists (own feedback) and staff (any feedback)
router.delete('/:id', authorize('admin', 'wildlifeOfficer', 'callOperator', 'tourist'), deleteFeedback);

module.exports = router;
