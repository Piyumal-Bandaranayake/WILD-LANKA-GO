const express = require('express');
const {
  getUserStats,
  getTouristStats,
  getSystemUserStats,
  getAvailableStaff,
  resetEndedToursAvailability,
} = require('../controllers/userStatsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// General user statistics (admin only)
router.get('/stats', 
  authorize('admin', 'wildlifeOfficer'), 
  getUserStats
);

// Tourist-specific statistics (admin and wildlife officers)
router.get('/tourists/stats', 
  authorize('admin', 'wildlifeOfficer'), 
  getTouristStats
);

// System user-specific statistics (admin only)
router.get('/system/stats', 
  authorize('admin'), 
  getSystemUserStats
);

// Get available staff (admin, wildlife officers, and call operators)
router.get('/available-staff', 
  authorize('admin', 'wildlifeOfficer', 'callOperator'), 
  getAvailableStaff
);

// Reset availability for ended tours (admin only)
router.post('/reset-ended-tours-availability', 
  authorize('admin'), 
  resetEndedToursAvailability
);

module.exports = router;
