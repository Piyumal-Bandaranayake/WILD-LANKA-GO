const express = require('express');
const {
  getAllUsers,
  getUserById,
  createSystemUser,
  updateUser,
  updateUserRole,
  deleteUser,
  updateUserStatus,
  deactivateUser,
  resetUserPassword,
  getUserStatistics
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');
const Event = require('../models/Event');

const router = express.Router();

// Protected routes (require authentication and admin role)
router.use(authenticate);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', validate(schemas.userRegistration), createSystemUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/reset-password', resetUserPassword);

// Statistics
router.get('/statistics', getUserStatistics);

// Event slot management
router.post('/events/recalculate-slots', asyncHandler(async (req, res) => {
  try {
    console.log('Admin requested slot recalculation for all events');
    
    const results = await Event.recalculateAllAvailableSlots();
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`Slot recalculation completed: ${successCount} success, ${errorCount} errors`);
    
    return sendSuccess(res, {
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
    }, 'Event slots recalculated successfully');
    
  } catch (error) {
    console.error('Error recalculating event slots:', error);
    return sendError(res, 'Failed to recalculate event slots', 500);
  }
}));

router.post('/events/:eventId/recalculate-slots', asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('Admin requested slot recalculation for event:', eventId);
    
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }
    
    const oldSlots = event.availableSlots;
    await event.recalculateAvailableSlots();
    
    console.log(`Slot recalculation completed for event ${event.title}: ${oldSlots} -> ${event.availableSlots}`);
    
    return sendSuccess(res, {
      eventId: event._id,
      eventTitle: event.title,
      maxSlots: event.maxSlots,
      oldAvailableSlots: oldSlots,
      newAvailableSlots: event.availableSlots,
      difference: event.availableSlots - oldSlots
    }, 'Event slots recalculated successfully');
    
  } catch (error) {
    console.error('Error recalculating event slots:', error);
    return sendError(res, 'Failed to recalculate event slots', 500);
  }
}));

module.exports = router;
