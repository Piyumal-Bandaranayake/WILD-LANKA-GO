const express = require('express');
const {
  checkAvailableSlots,
  verifySlotReduction,
  createActivityBooking,
  getActivityBookings,
  updateActivityBooking,
  deleteActivityBooking
} = require('../controllers/activityBookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for slot checking (tourists need to check before login sometimes)
router.get('/check-slots', checkAvailableSlots);
router.get('/verify-slots', verifySlotReduction);

// Protected routes (require authentication)
router.use(authenticate);

// Tourist routes
router.post('/', createActivityBooking);
router.get('/', getActivityBookings); // Can be filtered by userId in query

// Admin/Staff routes
router.put('/:id', 
  authorize('admin', 'wildlifeOfficer', 'callOperator'), 
  updateActivityBooking
);

router.delete('/:id', 
  authorize('admin', 'wildlifeOfficer', 'callOperator'), 
  deleteActivityBooking
);

module.exports = router;
