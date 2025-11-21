const express = require('express');
const {
  createTour,
  createTourWithAssignment,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver,
  getDriverDashboardStats,
  acceptTour,
  rejectTour,
  updateTourStatus,
  createTestTour,
  resetAvailabilityForEndedTours
} = require('../../controllers/tourmanagement/tourcontroller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Tour creation and assignment routes (Wildlife Officer only)
router.post('/create', authenticate, authorize('wildlifeOfficer', 'admin'), createTour);  // DEPRECATED - Returns error message
router.post('/create-with-assignment', authenticate, authorize('wildlifeOfficer', 'admin'), createTourWithAssignment);  // PRIMARY route - Requires MANDATORY driver assignment
router.put('/assign', authenticate, authorize('wildlifeOfficer', 'admin'), assignDriverAndGuide);

// Tour acceptance/rejection routes (Drivers only)
router.put('/:tourId/accept', authenticate, authorize('safariDriver'), acceptTour);
router.put('/:tourId/reject', authenticate, authorize('safariDriver'), rejectTour);

// Tour status updates (Tour Guide and Driver can update their assigned tours)
router.put('/:tourId/status', authenticate, authorize('tourGuide', 'safariDriver', 'wildlifeOfficer', 'admin'), updateTourStatus);

// Tour retrieval routes
router.get('/', authenticate, authorize('wildlifeOfficer', 'admin'), getAllTours);
router.get('/guide/:guideId', authenticate, authorize('tourGuide', 'wildlifeOfficer', 'admin'), getToursByGuide);   // <-- before /:id
router.get('/driver/:driverId', authenticate, authorize('safariDriver', 'wildlifeOfficer', 'admin'), getToursByDriver); // <-- before /:id
router.get('/dashboard/driver', authenticate, authorize('safariDriver'), getDriverDashboardStats); // Driver dashboard endpoint
router.get('/:id', authenticate, authorize('tourGuide', 'safariDriver', 'wildlifeOfficer', 'admin'), getTourById);

// Test route for debugging (remove in production)
router.post('/test/create', authenticate, authorize('admin'), createTestTour);

// Utility route to reset availability for ended tours (admin only)
router.post('/reset-ended-availability', authenticate, authorize('admin'), resetAvailabilityForEndedTours);

module.exports = router;
