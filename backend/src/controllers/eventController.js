const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

/**
 * Get all events
 * GET /api/events
 */
const getEvents = asyncHandler(async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const events = await Event.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ date: 1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Add participant counts (attendees) to each event
  const eventsWithRegistrations = await Promise.all(
    events.map(async (event) => {
      // Get all active registrations for this event
      const registrations = await EventRegistration.find({ 
        event: event._id, 
        status: { $in: ['registered', 'confirmed'] } 
      });
      
      // Sum up the participants from all registrations
      const totalAttendees = registrations.reduce((sum, registration) => {
        return sum + (registration.participants || 1); // Default to 1 if participants field is missing
      }, 0);
      
      console.log(`Event ${event.title}: ${registrations.length} registrations, ${totalAttendees} total attendees`);
      
      return {
        ...event.toObject(),
        registrationCount: registrations.length, // Number of registrations
        totalAttendees, // Total number of participants/attendees
        registrations: { length: totalAttendees } // For backward compatibility - now shows attendees, not registrations
      };
    })
  );
  
  const total = await Event.countDocuments(filter);
  
  return sendSuccess(res, {
    events: eventsWithRegistrations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Events retrieved successfully');
});

/**
 * Get single event by ID
 * GET /api/events/:id
 */
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');
  
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  return sendSuccess(res, { event }, 'Event retrieved successfully');
});

/**
 * Create new event
 * POST /api/events
 */
const createEvent = asyncHandler(async (req, res) => {
  const {
    name,
    title,
    description,
    date,
    time,
    location,
    maxSlots,
    availableSlots,
    price,
    imageUrl,
    imageUrls,
    category,
    eventType,
    duration,
    requirements,
    includes,
    organizer
  } = req.body;
  
  // Handle different field names from frontend
  const eventTitle = title || name;
  const eventMaxSlots = maxSlots || availableSlots || 50;
  const eventCategory = category || eventType || 'Other';
  
  // Handle image URLs from uploads (support both strings and objects with url)
  let eventImageUrls = [];
  if (imageUrls && Array.isArray(imageUrls)) {
    eventImageUrls = imageUrls.filter(Boolean);
    logger.info(`Event creation - imageUrls from Cloudinary: ${JSON.stringify(imageUrls)}`);
  } else if (Array.isArray(req.body.images)) {
    // Normalize array of objects -> array of urls
    eventImageUrls = req.body.images
      .map(img => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);
    logger.info(`Event creation - images array normalized: ${JSON.stringify(eventImageUrls)}`);
  } else if (imageUrl) {
    eventImageUrls = [imageUrl];
    logger.info(`Event creation - single imageUrl: ${imageUrl}`);
  }
  
  logger.info(`Event creation - final eventImageUrls: ${JSON.stringify(eventImageUrls)}`);
  
  const event = new Event({
    title: eventTitle,
    description,
    date,
    time,
    location,
    maxSlots: eventMaxSlots,
    availableSlots: eventMaxSlots,
    price: price || 0,
    imageUrl: eventImageUrls[0] || null,
    images: eventImageUrls,
    category: eventCategory,
    duration: duration || '3 hours',
    requirements,
    includes,
    organizer,
    createdBy: req.user._id
  });
  
  await event.save();
  
  await event.populate('createdBy', 'firstName lastName email');
  
  logger.info(`New event created: ${eventTitle} by ${req.user.email}`);
  
  return sendSuccess(res, { event }, 'Event created successfully', 201);
});

/**
 * Update event
 * PUT /api/events/:id
 */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  const allowedUpdates = [
    'title', 'description', 'date', 'time', 'location', 'maxSlots',
    'price', 'imageUrl', 'images', 'status', 'category', 'requirements', 'includes', 'organizer'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Handle image URLs from uploads (support both strings and objects with url)
  if (Array.isArray(req.body.imageUrls)) {
    const normalized = req.body.imageUrls.filter(Boolean);
    updates.images = normalized;
    updates.imageUrl = normalized[0] || null;
  } else if (Array.isArray(req.body.images)) {
    const normalized = req.body.images
      .map(img => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);
    updates.images = normalized;
    updates.imageUrl = normalized[0] || null;
  }
  
  // If maxSlots is being updated, adjust availableSlots accordingly
  if (updates.maxSlots && updates.maxSlots !== event.maxSlots) {
    const registrations = await EventRegistration.find({
      event: event._id,
      status: 'registered'
    });
    const registeredCount = registrations.reduce((sum, reg) => sum + reg.participants, 0);
    updates.availableSlots = Math.max(0, updates.maxSlots - registeredCount);
  }
  
  updates.updatedBy = req.user._id;
  
  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('createdBy updatedBy', 'firstName lastName email');
  
  logger.info(`Event updated: ${updatedEvent.title} by ${req.user.email}`);
  
  return sendSuccess(res, { event: updatedEvent }, 'Event updated successfully');
});

/**
 * Delete event
 * DELETE /api/events/:id
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  // Check if event has registrations
  const activeRegistrations = await EventRegistration.countDocuments({
    event: event._id,
    status: 'registered'
  });
  if (activeRegistrations > 0) {
    return sendError(res, 'Cannot delete event with active registrations', 400);
  }
  
  await Event.findByIdAndDelete(req.params.id);
  
  logger.info(`Event deleted: ${event.title} by ${req.user.email}`);
  
  return sendSuccess(res, null, 'Event deleted successfully');
});

/**
 * Register user for event
 * POST /api/events/:id/register
 */
const registerForEvent = asyncHandler(async (req, res) => {
  const { participants = 1 } = req.body;
  const participantCount = parseInt(participants);
  
  if (isNaN(participantCount) || participantCount < 1) {
    return sendError(res, 'Participants must be a valid number greater than 0', 400);
  }
  
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  // Check if event is in the future
  if (new Date(event.date) < new Date()) {
    return sendError(res, 'Cannot register for past events', 400);
  }
  
  // Check if there are enough available slots
  if (event.availableSlots < participantCount) {
    return sendError(res, `Not enough slots available. Only ${event.availableSlots} slots remaining, but ${participantCount} participants requested.`, 400);
  }
  
  // Check if user is already registered
  const existingRegistration = await EventRegistration.isUserRegistered(event._id, req.user._id);
  
  if (existingRegistration) {
    return sendError(res, 'User is already registered for this event', 400);
  }
  
  try {
    // Use the Event model's registerUser method
    const registration = await event.registerUser(req.user._id, participantCount);
    
    logger.info(`User registered for event: ${req.user.email} -> ${event.title} (${participantCount} participants)`);
    
    // Reload event to get updated data
    const updatedEvent = await Event.findById(event._id);
    
    return sendSuccess(res, { 
      event: updatedEvent,
      registration,
      participantCount,
      message: `Successfully registered for event with ${participantCount} participants`
    }, 'Registration successful');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
});

/**
 * Cancel event registration
 * DELETE /api/events/:id/register
 */
const cancelEventRegistration = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  try {
    await event.cancelRegistration(req.user._id);
    
    logger.info(`User cancelled event registration: ${req.user.email} -> ${event.title}`);
    
    return sendSuccess(res, { 
      event,
      message: 'Registration cancelled successfully'
    }, 'Registration cancelled');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
});

/**
 * Get upcoming events
 * GET /api/events/upcoming
 */
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const events = await Event.findUpcoming()
    .populate('createdBy', 'firstName lastName email')
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Event.countDocuments({ 
    date: { $gte: new Date() },
    status: 'upcoming'
  });
  
  return sendSuccess(res, {
    events,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Upcoming events retrieved successfully');
});

/**
 * Check available slots for event registration
 * GET /api/events/check-slots
 */
const checkEventAvailableSlots = asyncHandler(async (req, res) => {
  const { eventId, participants } = req.query;
  
  // Validate required parameters
  if (!eventId || !participants) {
    return sendError(res, 'Event ID and participants are required', 400);
  }
  
  const participantCount = parseInt(participants);
  if (isNaN(participantCount) || participantCount < 1) {
    return sendError(res, 'Participants must be a valid number greater than 0', 400);
  }
  
  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    return sendNotFound(res, 'Event not found');
  }
  
  // Check if event is in the future
  if (new Date(event.date) < new Date()) {
    return sendSuccess(res, {
      canRegister: false,
      message: 'Cannot register for past events',
      availableSlots: 0,
      requestedParticipants: participantCount,
      eventId
    }, 'Event date check completed');
  }
  
  // Check if event is active
  if (event.status !== 'upcoming') {
    return sendSuccess(res, {
      canRegister: false,
      message: 'Event is not currently available for registration',
      availableSlots: 0,
      requestedParticipants: participantCount,
      eventId
    }, 'Event status check completed');
  }
  
  // Check if there are enough slots
  const canRegister = event.availableSlots >= participantCount;
  
  logger.info(`Event slot check: Event ${eventId}, Available: ${event.availableSlots}, Requested: ${participantCount}, Can register: ${canRegister}`);
  
  return sendSuccess(res, {
    canRegister,
    availableSlots: event.availableSlots,
    requestedParticipants: participantCount,
    eventId,
    eventTitle: event.title,
    eventDate: event.date,
    message: canRegister 
      ? `${event.availableSlots} slots available for ${participantCount} participants`
      : `Not enough slots available. Only ${event.availableSlots} slots remaining, but ${participantCount} participants requested.`
  }, 'Event slot availability checked successfully');
});

/**
 * Get events by category
 * GET /api/events/category/:category
 */
const getEventsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const events = await Event.findByCategory(category)
    .populate('createdBy', 'firstName lastName email')
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Event.countDocuments({ 
    category,
    date: { $gte: new Date() },
    status: 'upcoming'
  });
  
  return sendSuccess(res, {
    events,
    category,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, `Events in ${category} category retrieved successfully`);
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getUpcomingEvents,
  checkEventAvailableSlots,
  getEventsByCategory
};
