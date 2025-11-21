const { asyncHandler } = require('../middleware/errorHandler');
const Activity = require('../models/Activity');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SystemUser = require('../models/SystemUser');
const { sendSuccess, sendError, sendNotFound, sendBadRequest } = require('../utils/response');
const { BOOKING_TYPES, BOOKING_STATUS } = require('../utils/constants');
const logger = require('../../config/logger');

/**
 * Check available slots for activity booking
 * GET /api/activity-bookings/check-slots
 */
const checkAvailableSlots = asyncHandler(async (req, res) => {
  const { activityId, date, participants } = req.query;
  
  // Validate required parameters
  if (!activityId || !date || !participants) {
    return sendBadRequest(res, 'Activity ID, date, and participants are required');
  }
  
  const participantCount = parseInt(participants);
  if (isNaN(participantCount) || participantCount < 1) {
    return sendBadRequest(res, 'Participants must be a valid number greater than 0');
  }
  
  // Find the activity
  const activity = await Activity.findById(activityId);
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  // Check if activity is active
  if (activity.status !== 'active') {
    return sendSuccess(res, {
      canBook: false,
      message: 'Activity is not currently available for booking',
      availableSlots: 0,
      requestedParticipants: participantCount,
      activityId,
      date
    }, 'Activity status check completed');
  }
  
  // Get available slots for the requested date
  const availableSlots = activity.getSlotsForDate(date);
  
  // Check if there are enough slots
  const canBook = availableSlots >= participantCount;
  
  logger.info(`Slot check: Activity ${activityId}, Date ${date}, Available: ${availableSlots}, Requested: ${participantCount}, Can book: ${canBook}`);
  
  return sendSuccess(res, {
    canBook,
    availableSlots,
    requestedParticipants: participantCount,
    activityId,
    date,
    message: canBook 
      ? `${availableSlots} slots available for ${participantCount} participants`
      : `Not enough slots available. Only ${availableSlots} slots remaining, but ${participantCount} participants requested.`
  }, 'Slot availability checked successfully');
});

/**
 * Verify slot reduction after booking
 * GET /api/activity-bookings/verify-slots
 */
const verifySlotReduction = asyncHandler(async (req, res) => {
  const { activityId, date } = req.query;
  
  if (!activityId || !date) {
    return sendBadRequest(res, 'Activity ID and date are required');
  }
  
  const activity = await Activity.findById(activityId);
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  const currentSlots = activity.getSlotsForDate(date);
  
  return sendSuccess(res, {
    activityId,
    date,
    currentAvailableSlots: currentSlots,
    maxSlots: activity.dailySlots
  }, 'Slot verification completed');
});

/**
 * Create activity booking
 * POST /api/activity-bookings
 * 
 * Note: Currently frontend sends only 'numberOfParticipants' as total count.
 * Backend maps this to 'numberOfAdults' and sets 'numberOfChildren' to 0.
 * Future enhancement: Frontend could send separate adult/child counts for better pricing.
 */
const createActivityBooking = asyncHandler(async (req, res) => {
  const {
    userId,
    activityId,
    numberOfParticipants,
    preferredDate,
    requestTourGuide,
    totalAmount,
    touristName,
    touristEmail,
    touristPhone,
    specialRequests
  } = req.body;
  
  // Validate required fields
  if (!userId || !activityId || !numberOfParticipants || !preferredDate) {
    return sendBadRequest(res, 'User ID, Activity ID, number of participants, and preferred date are required');
  }
  
  const participantCount = parseInt(numberOfParticipants);
  if (isNaN(participantCount) || participantCount < 1) {
    return sendBadRequest(res, 'Number of participants must be a valid number greater than 0');
  }
  
  // Find the activity
  const activity = await Activity.findById(activityId);
  if (!activity) {
    return sendNotFound(res, 'Activity not found');
  }
  
  // Check if activity is active
  if (activity.status !== 'active') {
    return sendBadRequest(res, 'Activity is not currently available for booking');
  }
  
  // Double-check slot availability before booking
  const availableSlots = activity.getSlotsForDate(preferredDate);
  if (availableSlots < participantCount) {
    return sendBadRequest(res, `Not enough slots available. Only ${availableSlots} slots remaining, but ${participantCount} participants requested.`);
  }
  
  // Generate unique booking ID
  const bookingId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate total price
  const calculatedTotalPrice = totalAmount || (activity.price * participantCount);
  
  // Create the booking using the correct Booking model structure
  // Since frontend only sends total participants, we assume all are adults by default
  // This can be enhanced later if frontend adds separate adult/child fields
  const booking = new Booking({
    bookingId: bookingId,
    customer: userId,
    type: BOOKING_TYPES.ACTIVITY,
    status: BOOKING_STATUS.PENDING,
    bookingDate: new Date(preferredDate),
    startTime: '09:00', // Default start time, can be made configurable
    duration: activity.duration || 3, // Use activity duration or default to 3 hours
    numberOfAdults: participantCount, // All participants assumed to be adults
    numberOfChildren: 0, // No children specified in current form
    totalParticipants: participantCount, // Required field
    
    // Location (required)
    location: {
      name: activity.location || 'Activity Location',
      coordinates: {
        latitude: null,
        longitude: null
      },
      description: `Location for ${activity.title}`
    },
    
    // Pricing (required fields)
    pricing: {
      adultPrice: activity.price || 0,
      childPrice: 0,
      guidePrice: requestTourGuide ? 5000 : 0,
      vehiclePrice: 0,
      totalPrice: calculatedTotalPrice,
      currency: 'LKR'
    },
    
    // Payment information
    payment: {
      status: 'pending',
      paidAmount: 0
    },
    
    // Special requirements
    specialRequests: specialRequests || '',
    
    // Tour guide request
    requestTourGuide: requestTourGuide || false,
    
    // Store customer info in notes field for reference
    notes: `Activity: ${activity.title} | Customer: ${touristName} | Email: ${touristEmail} | Phone: ${touristPhone}`
  });
  
  // Save the booking first
  await booking.save();
  
  // Update activity slots (reduce by participant count)
  await activity.updateSlots(preferredDate, participantCount);
  
  // Populate the booking with customer details
  await booking.populate('customer', 'firstName lastName email');
  
  logger.info(`Activity booking created: ${booking._id} - ${activity.title} for ${participantCount} participants on ${preferredDate}`);
  
  return sendSuccess(res, { 
    booking,
    message: `Successfully booked ${activity.title} for ${participantCount} participants on ${preferredDate}`
  }, 'Activity booking created successfully', 201);
});

/**
 * Get activity bookings
 * GET /api/activity-bookings
 */
const getActivityBookings = asyncHandler(async (req, res) => {
  const { userId, status } = req.query;
  
  let filter = { type: BOOKING_TYPES.ACTIVITY };
  if (userId) filter.customer = userId;
  if (status) filter.status = status;
  
  const bookings = await Booking.find(filter)
    .populate({
      path: 'customer',
      select: 'firstName lastName email phone',
      model: 'User' // Explicitly specify the model
    })
    .populate({
      path: 'driver',
      select: 'firstName lastName email phone role isAvailable',
      model: 'SystemUser'
    })
    .populate({
      path: 'tourGuide',
      select: 'firstName lastName email phone role isAvailable',
      model: 'SystemUser'
    })
    .sort({ bookingDate: -1 });
  
  // Debug: Log the first booking to see if customer, driver, and tourGuide are populated
  if (bookings.length > 0) {
    logger.info('Sample booking data:', {
      bookingId: bookings[0]._id,
      customer: bookings[0].customer,
      driver: bookings[0].driver,
      tourGuide: bookings[0].tourGuide,
      customerType: typeof bookings[0].customer,
      driverType: typeof bookings[0].driver,
      tourGuideType: typeof bookings[0].tourGuide,
      customerKeys: bookings[0].customer ? Object.keys(bookings[0].customer) : 'No customer object',
      driverKeys: bookings[0].driver ? Object.keys(bookings[0].driver) : 'No driver object',
      tourGuideKeys: bookings[0].tourGuide ? Object.keys(bookings[0].tourGuide) : 'No tourGuide object'
    });
    
    // If customer is not populated, try to fetch it manually
    if (!bookings[0].customer || typeof bookings[0].customer === 'string') {
      logger.info('Customer not populated, attempting manual fetch...');
      const customerId = bookings[0].customer || bookings[0].customer;
      if (customerId) {
        const customer = await User.findById(customerId).select('firstName lastName email phone');
        if (customer) {
          bookings[0].customer = customer;
          logger.info('Customer manually populated:', customer);
        } else {
          logger.warn('Customer not found in User model:', customerId);
        }
      }
    }
  }
  
  return sendSuccess(res, { 
    bookings,
    count: bookings.length 
  }, 'Activity bookings retrieved successfully');
});

/**
 * Update activity booking status
 * PUT /api/activity-bookings/:id
 */
const updateActivityBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, driver, tourGuide } = req.body;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }
  
  // If booking is being cancelled, restore the slots
  if (status === BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.CANCELLED) {
    const activityId = booking.activityDetails?.activityId;
    if (activityId) {
      const activity = await Activity.findById(activityId);
      if (activity) {
        // Restore slots by adding back the participant count
        const participantCount = booking.numberOfAdults || 1;
        const bookingDate = booking.bookingDate;
        const slotIndex = activity.availableSlots.findIndex(
          slot => slot.date.toDateString() === bookingDate.toDateString()
        );
        
        if (slotIndex !== -1) {
          activity.availableSlots[slotIndex].slots += participantCount;
        } else {
          // If no slot entry exists, create one with restored slots
          activity.availableSlots.push({
            date: bookingDate,
            slots: activity.dailySlots // Reset to daily slots since this was the only booking
          });
        }
        
        await activity.save();
        logger.info(`Restored ${participantCount} slots for activity ${activity.title} on ${bookingDate}`);
      }
    }
  }
  
  // Update booking status
  if (status) booking.status = status;
  if (paymentStatus) booking.paymentStatus = paymentStatus;
  
  // Update staff assignments
  if (driver !== undefined) booking.driver = driver;
  if (tourGuide !== undefined) booking.tourGuide = tourGuide;
  
  await booking.save();
  
  // Update staff availability when assigned or when booking is completed/cancelled
  if (driver) {
    if (status === 'completed' || status === 'cancelled') {
      await SystemUser.findByIdAndUpdate(driver, { isAvailable: true });
      logger.info(`Driver ${driver} marked as available (booking ${status})`);
    } else if (status === 'confirmed' || status === 'processing') {
      await SystemUser.findByIdAndUpdate(driver, { isAvailable: false });
      logger.info(`Driver ${driver} marked as unavailable`);
    }
  }
  if (tourGuide) {
    if (status === 'completed' || status === 'cancelled') {
      await SystemUser.findByIdAndUpdate(tourGuide, { isAvailable: true });
      logger.info(`Tour guide ${tourGuide} marked as available (booking ${status})`);
    } else if (status === 'confirmed' || status === 'processing') {
      await SystemUser.findByIdAndUpdate(tourGuide, { isAvailable: false });
      logger.info(`Tour guide ${tourGuide} marked as unavailable`);
    }
  }
  
  // Populate the updated booking with staff details
  const updatedBooking = await Booking.findById(id)
    .populate('driver', 'firstName lastName email phone isAvailable')
    .populate('tourGuide', 'firstName lastName email phone isAvailable')
    .populate('customer', 'firstName lastName email phone');
  
  logger.info(`Activity booking ${id} updated: status=${status}, paymentStatus=${paymentStatus}, driver=${driver}, tourGuide=${tourGuide}`);
  
  return sendSuccess(res, { booking: updatedBooking }, 'Activity booking updated successfully');
});

/**
 * Delete activity booking
 * DELETE /api/activity-bookings/:id
 */
const deleteActivityBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }
  
  // Check if booking is of type ACTIVITY
  if (booking.type !== BOOKING_TYPES.ACTIVITY) {
    return sendBadRequest(res, 'This endpoint is only for activity bookings');
  }
  
  // If booking is not already cancelled, restore the slots
  if (booking.status !== BOOKING_STATUS.CANCELLED) {
    const activityId = booking.activityDetails?.activityId;
    if (activityId) {
      const activity = await Activity.findById(activityId);
      if (activity) {
        // Restore slots by adding back the participant count
        const participantCount = booking.numberOfAdults || 1;
        const bookingDate = booking.bookingDate;
        const slotIndex = activity.availableSlots.findIndex(
          slot => slot.date.toDateString() === bookingDate.toDateString()
        );
        
        if (slotIndex !== -1) {
          activity.availableSlots[slotIndex].slots += participantCount;
        } else {
          // If no slot entry exists, create one with restored slots
          activity.availableSlots.push({
            date: bookingDate,
            slots: activity.dailySlots // Reset to daily slots since this was the only booking
          });
        }
        
        await activity.save();
        logger.info(`Restored ${participantCount} slots for activity ${activity.title} on ${bookingDate} after booking deletion`);
      }
    }
  }
  
  // If staff were assigned, mark them as available again
  if (booking.driver) {
    await SystemUser.findByIdAndUpdate(booking.driver, { isAvailable: true });
    logger.info(`Driver ${booking.driver} marked as available after booking deletion`);
  }
  if (booking.tourGuide) {
    await SystemUser.findByIdAndUpdate(booking.tourGuide, { isAvailable: true });
    logger.info(`Tour guide ${booking.tourGuide} marked as available after booking deletion`);
  }
  
  // Delete the booking
  await Booking.findByIdAndDelete(id);
  
  logger.info(`Activity booking ${id} deleted successfully`);
  
  return sendSuccess(res, { 
    message: 'Activity booking deleted successfully',
    deletedBookingId: id
  }, 'Activity booking deleted successfully');
});

module.exports = {
  checkAvailableSlots,
  verifySlotReduction,
  createActivityBooking,
  getActivityBookings,
  updateActivityBooking,
  deleteActivityBooking
};
