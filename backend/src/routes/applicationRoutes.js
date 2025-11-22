const express = require('express');
const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  getMyApplications,
  getApplicationStatistics,
  updateApplication,
  deleteApplication
} = require('../controllers/applicationController');
const {
  submitJobApplication,
  wpoSetStatus,
  adminCreateAccount,
  listJobApplications
} = require('../controllers/tourmanagement/applicationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public job application routes (no authentication required)
router.post('/apply', submitJobApplication);
router.post('/job-apply', submitJobApplication); // Alternative endpoint

// Protected routes (require authentication)
router.use(authenticate);

// Tourist routes
router.get('/my-applications', authorize('tourist'), getMyApplications);
router.post('/', authorize('tourist'), createApplication);
router.put('/:id', authorize('tourist'), updateApplication);

// Admin and Wildlife Officer routes
router.get('/statistics', authorize('admin', 'wildlifeOfficer'), getApplicationStatistics);
router.get('/', authorize('admin', 'wildlifeOfficer'), getApplications);

// Job application management routes (for WPO/Admin) - MUST come before /:id routes
router.get('/job-applications', authorize('wildlifeOfficer', 'admin'), listJobApplications);
router.patch('/:id/wpo', authorize('wildlifeOfficer', 'admin'), wpoSetStatus); // body: { action: 'approve' | 'reject', notes? }
router.post('/:id/admin-create-account', authorize('admin'), adminCreateAccount);

// Parameterized routes (must come after specific routes)
router.get('/:id', authorize('admin', 'wildlifeOfficer', 'tourist'), getApplicationById);
router.put('/:id/status', authorize('admin', 'wildlifeOfficer'), updateApplicationStatus);
router.delete('/:id', authorize('admin', 'tourist'), deleteApplication);

module.exports = router;
