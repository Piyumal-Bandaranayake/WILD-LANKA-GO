const Activity = require('../models/Activity');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

/**
 * Get all activities
 * GET /api/activities
 */
const getActivities = asyncHandler(async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const activities = await Activity.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Activity.countDocuments(filter);
  
  return sendSuccess(res, {
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Activities retrieved successfully');
});

/**
 * Get single activity by ID
 * GET /api/activities/:id
 */
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');
  
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  return sendSuccess(res, { activity }, 'Activity retrieved successfully');
});

/**
 * Create new activity
 * POST /api/activities
 */
const createActivity = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    duration,
    location,
    imageUrl,
    maxParticipants,
    dailySlots,
    category,
    difficulty,
    requirements,
    includes,
    excludes,
    cancellationPolicy
  } = req.body;
  
  // Process requirements - convert string to array if needed
  let processedRequirements = [];
  if (requirements) {
    if (Array.isArray(requirements)) {
      processedRequirements = requirements;
    } else if (typeof requirements === 'string' && requirements.trim()) {
      processedRequirements = [requirements.trim()];
    }
  }
  
  const activity = new Activity({
    title,
    description,
    price: Number(price),
    duration: Number(duration),
    location,
    imageUrl,
    maxParticipants: Number(maxParticipants),
    dailySlots: Number(dailySlots),
    category,
    difficulty: difficulty || 'easy',
    requirements: processedRequirements,
    includes: includes || [],
    excludes: excludes || [],
    cancellationPolicy: cancellationPolicy || 'Free cancellation up to 24 hours before the activity',
    createdBy: req.user._id
  });
  
  await activity.save();
  
  await activity.populate('createdBy', 'firstName lastName email');
  
  logger.info(`New activity created: ${title} by ${req.user.email}`);
  
  return sendSuccess(res, { activity }, 'Activity created successfully', 201);
});

/**
 * Update activity
 * PUT /api/activities/:id
 */
const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  const allowedUpdates = [
    'title', 'description', 'price', 'duration', 'location', 'imageUrl',
    'maxParticipants', 'dailySlots', 'status', 'category', 'difficulty',
    'requirements', 'includes', 'excludes', 'cancellationPolicy'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });
  
  updates.updatedBy = req.user._id;
  
  const updatedActivity = await Activity.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('createdBy updatedBy', 'firstName lastName email');
  
  logger.info(`Activity updated: ${updatedActivity.title} by ${req.user.email}`);
  
  return sendSuccess(res, { activity: updatedActivity }, 'Activity updated successfully');
});

/**
 * Delete activity
 * DELETE /api/activities/:id
 */
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  await Activity.findByIdAndDelete(req.params.id);
  
  logger.info(`Activity deleted: ${activity.title} by ${req.user.email}`);
  
  return sendSuccess(res, null, 'Activity deleted successfully');
});

/**
 * Get available slots for activity on specific date
 * GET /api/activities/:id/slots/:date
 */
const getActivitySlots = asyncHandler(async (req, res) => {
  const { id, date } = req.params;
  
  const activity = await Activity.findById(id);
  
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  const availableSlots = activity.getSlotsForDate(date);
  
  return sendSuccess(res, {
    activityId: id,
    date,
    availableSlots,
    maxParticipants: activity.maxParticipants
  }, 'Activity slots retrieved successfully');
});

/**
 * Update activity slots (when booking is made)
 * PUT /api/activities/:id/slots
 */
const updateActivitySlots = asyncHandler(async (req, res) => {
  const { date, participantCount } = req.body;
  
  const activity = await Activity.findById(req.params.id);
  
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  await activity.updateSlots(date, participantCount);
  
  const updatedSlots = activity.getSlotsForDate(date);
  
  logger.info(`Activity slots updated: ${activity.title} - ${participantCount} participants on ${date}`);
  
  return sendSuccess(res, {
    activityId: req.params.id,
    date,
    availableSlots: updatedSlots,
    participantCount
  }, 'Activity slots updated successfully');
});

/**
 * Get activities by category
 * GET /api/activities/category/:category
 */
const getActivitiesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const activities = await Activity.findByCategory(category)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Activity.countDocuments({ category, status: 'active' });
  
  return sendSuccess(res, {
    activities,
    category,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, `Activities in ${category} category retrieved successfully`);
});

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitySlots,
  updateActivitySlots,
  getActivitiesByCategory
};
