const express = require('express');
const {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitySlots,
  updateActivitySlots,
  getActivitiesByCategory
} = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const { uploadSingle, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// Public routes (for tourists to view activities)
router.get('/', getActivities);
router.get('/category/:category', getActivitiesByCategory);
router.get('/:id', getActivityById);
router.get('/:id/slots/:date', getActivitySlots);

// Protected routes (require authentication)
router.use(authenticate);

// Admin and Wildlife Officer can manage activities
router.post('/', 
  authorize('admin', 'wildlifeOfficer'), 
  uploadSingle('imageUrl'),
  uploadToCloudinary,
  validate(schemas.activityCreation), 
  createActivity
);

router.put('/:id', 
  authorize('admin', 'wildlifeOfficer'), 
  uploadSingle('imageUrl'),
  uploadToCloudinary,
  validate(schemas.activityUpdate), 
  updateActivity
);

router.delete('/:id', 
  authorize('admin', 'wildlifeOfficer'), 
  deleteActivity
);

// Update slots (can be done by booking system)
router.put('/:id/slots', 
  authorize('admin', 'wildlifeOfficer', 'callOperator'), 
  updateActivitySlots
);

module.exports = router;
