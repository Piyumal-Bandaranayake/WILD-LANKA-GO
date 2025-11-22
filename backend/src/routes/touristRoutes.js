const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { BOOKING_TYPES } = require('../utils/constants');
const logger = require('../../config/logger');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

const router = express.Router();

// All tourist routes require authentication
router.use(authenticate);
router.use(authorize('tourist'));

/**
 * Get tourist's event registrations
 * GET /api/tourist/my-registrations
 */
const getMyRegistrations = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching registrations for user:', userId);
    
    // Find user's registrations using the separate collection (all statuses, not just 'registered')
    const registrations = await EventRegistration.find({ user: userId })
      .populate('event', 'title date time location status');
    
    console.log('Found registrations:', registrations.length);
    console.log('Raw registrations:', registrations.map(r => ({ 
      _id: r._id, 
      eventId: r.event?._id, 
      eventTitle: r.event?.title,
      status: r.status 
    })));
    
    // Format registrations for frontend - match the expected structure
    const formattedRegistrations = registrations.map(registration => ({
      _id: registration._id, // For frontend compatibility
      registrationId: registration.registrationId,
      eventId: registration.event?._id,
      eventTitle: registration.event?.title || 'Event',
      eventDate: registration.event?.date,
      eventTime: registration.event?.time,
      eventLocation: registration.event?.location || 'Location',
      participants: registration.participants,
      numberOfParticipants: registration.participants, // For frontend compatibility
      registeredAt: registration.registrationDate,
      status: registration.status,
      eventStatus: registration.event?.status,
      paymentStatus: registration.payment?.status || 'pending',
      paymentAmount: registration.payment?.amount || 0,
      // Additional fields for better display
      specialRequests: registration.specialRequests,
      contactInfo: registration.contactInfo,
      createdAt: registration.registrationDate,
      updatedAt: registration.updatedAt
    }));
    
    console.log('Processed registrations:', formattedRegistrations.length);
    
    // Return in the format expected by frontend (data property contains the array)
    return sendSuccess(res, {
      data: formattedRegistrations, // Frontend expects data.data or data
      registrations: formattedRegistrations, // Also provide as registrations for compatibility
      count: formattedRegistrations.length
    }, 'Event registrations retrieved successfully');
    
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return sendError(res, 'Failed to fetch registrations', 500);
  }
});

/**
 * Get tourist's feedback submissions
 * GET /api/tourist/my-feedback
 */
const getMyFeedback = asyncHandler(async (req, res) => {
  try {
    const Feedback = require('../models/FeedbackModel');
    
    const feedback = await Feedback.find({ userId: req.user._id })
        .sort({ createdAt: -1 });
    
    return sendSuccess(res, feedback, 'My feedback retrieved successfully');
  } catch (error) {
    logger.error('Error fetching my feedback:', error);
    return sendError(res, 'Failed to fetch my feedback', 500);
  }
});

/**
 * Get tourist's complaints
 * GET /api/tourist/my-complaints
 */
const getMyComplaints = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching complaints for user:', userId);
    
    // Import Complaint model
    const Complaint = require('../models/ComplaintModel');
    
    // Find user's complaints
    const complaints = await Complaint.find({ 
      userId: userId,
      role: 'tourist' // Ensure we only get tourist complaints
    })
    .sort({ date: -1 }); // Most recent first
    
    console.log('Found complaints:', complaints.length);
    
    // Format complaints for frontend
    const formattedComplaints = complaints.map(complaint => ({
      _id: complaint._id,
      message: complaint.message,
      location: complaint.location,
      status: complaint.status,
      date: complaint.date,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      replies: complaint.replies || [],
      username: complaint.username,
      email: complaint.email
    }));
    
    console.log('Processed complaints:', formattedComplaints.length);
    
    const responseData = {
      data: formattedComplaints,
      complaints: formattedComplaints,
      count: formattedComplaints.length
    };
    
    console.log('📤 Sending complaints response:', JSON.stringify(responseData, null, 2));
    
    return sendSuccess(res, responseData, 'My complaints retrieved successfully');
  } catch (error) {
    console.error('Error fetching my complaints:', error);
    return sendError(res, 'Failed to fetch my complaints', 500);
  }
});

/**
 * Check event available slots
 * GET /api/tourist/events/check-slots
 */
const checkEventSlots = asyncHandler(async (req, res) => {
  const { eventId, participants } = req.query;
  
  if (!eventId || !participants) {
    return sendError(res, 'Event ID and participants are required', 400);
  }
  
  // TODO: Implement actual slot checking logic
  // For now, return mock data
  return sendSuccess(res, {
    canRegister: true,
    availableSlots: 50,
    requestedParticipants: parseInt(participants),
    eventId,
    message: `${50} slots available for ${participants} participants`
  }, 'Event slot availability checked successfully');
});

/**
 * Register for an event
 * POST /api/tourist/registrations
 */
const registerForEvent = asyncHandler(async (req, res) => {
  console.log('🎯 === REAL REGISTRATION REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : 'No user');
  console.log('🔍 Starting registration process...');
  
  const { eventId, participants } = req.body;
  const userId = req.user ? req.user._id : null;
  const participantCount = parseInt(participants);
  
  console.log('Extracted data:', { eventId, participants, userId, participantCount });
  
  if (!eventId || !participants || isNaN(participantCount) || participantCount < 1) {
    console.log('Validation failed:', { 
      eventId: !!eventId, 
      participants: !!participants,
      participantCount,
      isValidCount: !isNaN(participantCount) && participantCount >= 1
    });
    return sendError(res, 'Event ID and valid participant count are required', 400);
  }
  
  try {
    console.log('Finding event with ID:', eventId);
    console.log('User from auth middleware:', {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      userType: req.userType
    });
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      console.log('Event not found:', eventId);
      return sendError(res, 'Event not found', 404);
    }
    
    console.log('Event found:', { 
      title: event.title, 
      availableSlots: event.availableSlots,
      maxSlots: event.maxSlots
    });
    
    // Check if event is in the future
    if (new Date(event.date) < new Date()) {
      console.log('Event is in the past:', event.date);
      return sendError(res, 'Cannot register for past events', 400);
    }
    
    console.log('Attempting to register user...');
    console.log('BEFORE REGISTRATION - Available slots:', event.availableSlots);
    
    // Use the Event model's registerUser method (now returns EventRegistration)
    const registration = await event.registerUser(userId, participantCount);
    
    console.log('Registration successful, reloading event data...');
    
    // Reload the event to get updated data
    const updatedEvent = await Event.findById(eventId);
    
    console.log('AFTER REGISTRATION - Available slots:', updatedEvent.availableSlots);
    console.log('Slots reduced by:', participantCount);
    console.log('Updated event data:', {
      maxSlots: updatedEvent.maxSlots,
      availableSlots: updatedEvent.availableSlots,
      registrationId: registration._id,
      participants: participantCount
    });
    
    console.log('User registration created:', registration);
    
    return sendSuccess(res, {
      registrationId: registration._id,
      registrationNumber: registration.registrationId,
      eventId: updatedEvent._id,
      eventTitle: updatedEvent.title,
      userId,
      participants: participantCount,
      status: registration.status,
      registrationDate: registration.registrationDate,
      availableSlots: updatedEvent.availableSlots,
      paymentStatus: registration.payment.status,
      paymentAmount: registration.payment.amount,
      message: `Successfully registered for event with ${participantCount} participants`
    }, 'Event registration successful');
    
  } catch (error) {
    console.error('💥 Registration error:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('Not enough available slots')) {
      return sendError(res, error.message, 400);
    }
    
    if (error.message.includes('already registered')) {
      return sendError(res, 'You are already registered for this event', 400);
    }
    
    return sendError(res, error.message || 'Failed to register for event', 500);
  }
});

/**
 * Cancel event registration
 * DELETE /api/tourist/registrations/:registrationId
 */
const cancelEventRegistration = asyncHandler(async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user._id;
    
    console.log('=== CANCELLATION REQUEST ===');
    console.log('Registration ID:', registrationId);
    console.log('User ID:', userId);
    console.log('Registration ID type:', typeof registrationId);
    console.log('Registration ID length:', registrationId?.length);
    
    if (!registrationId) {
      return sendError(res, 'Registration ID is required', 400);
    }
    
    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      console.log('Invalid ObjectId format:', registrationId);
      return sendError(res, 'Invalid registration ID format', 400);
    }
    
    // Find the registration in the separate collection
    console.log('Searching for registration with query:', {
      _id: registrationId,
      user: userId,
      status: 'registered'
    });
    
    const registration = await EventRegistration.findOne({
      _id: registrationId,
      user: userId,
      status: 'registered'
    }).populate('event', 'title date _id');
    
    console.log('Registration found:', registration ? {
      id: registration._id,
      registrationId: registration.registrationId,
      status: registration.status,
      event: registration.event ? {
        id: registration.event._id,
        title: registration.event.title
      } : null
    } : null);
    
    if (!registration) {
      console.log('Registration not found - checking if it exists with different status...');
      const anyRegistration = await EventRegistration.findOne({
        _id: registrationId,
        user: userId
      });
      console.log('Any registration with this ID:', anyRegistration ? {
        id: anyRegistration._id,
        status: anyRegistration.status
      } : null);
      
      return sendError(res, 'Registration not found or already cancelled', 404);
    }
    
    // Get the event to use its cancelRegistration method
    const event = await Event.findById(registration.event._id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }
    
    console.log('BEFORE CANCELLATION - Available slots:', event.availableSlots);
    console.log('Participants to restore:', registration.participants);
    
    // Use the Event model's cancelRegistration method
    await event.cancelRegistration(userId);
    
    // Reload event to get updated slots
    const updatedEvent = await Event.findById(event._id);
    
    console.log('AFTER CANCELLATION - Available slots:', updatedEvent.availableSlots);
    console.log('Slots restored by:', registration.participants);
    console.log('Registration cancelled successfully');
    
    return sendSuccess(res, {
      message: 'Registration cancelled successfully',
      registrationId: registration._id,
      registrationNumber: registration.registrationId,
      eventId: event._id,
      eventTitle: event.title,
      cancelledAt: new Date()
    }, 'Registration cancelled');
    
  } catch (error) {
    console.error('Cancellation error:', error);
    return sendError(res, error.message || 'Failed to cancel registration', 500);
  }
});

/**
 * Get tourist's activity bookings
 * GET /api/tourist/my-bookings
 */
const getMyBookings = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching bookings for user:', userId);
    
    // Find user's activity bookings
    const bookings = await Booking.find({ 
      customer: userId,
      type: BOOKING_TYPES.ACTIVITY // Only activity bookings
    })
    .sort({ bookingDate: -1 }); // Most recent first
    
    console.log('Found bookings:', bookings.length);
    
    // Format bookings for frontend compatibility
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingId: booking.bookingId,
      activityId: {
        name: booking.notes ? booking.notes.split(' | ')[0]?.replace('Activity: ', '') : 'Activity',
        location: booking.location?.name || 'Location'
      },
      preferredDate: booking.bookingDate,
      bookingDate: booking.createdAt,
      numberOfParticipants: booking.totalParticipants,
      totalAmount: booking.pricing?.totalPrice || 0,
      status: booking.status === 'pending' ? 'Pending' : 
              booking.status === 'confirmed' ? 'Confirmed' :
              booking.status === 'completed' ? 'Completed' :
              booking.status === 'cancelled' ? 'Cancelled' : 'Pending',
      requestTourGuide: booking.requestTourGuide,
      specialRequests: booking.specialRequests,
      paymentStatus: booking.payment?.status || 'pending',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));
    
    console.log('Processed bookings:', formattedBookings.length);
    
    const responseData = {
      data: formattedBookings, // Frontend expects data.data or data
      bookings: formattedBookings, // Also provide as bookings for compatibility
      count: formattedBookings.length
    };
    
    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
    
    return sendSuccess(res, responseData, 'Activity bookings retrieved successfully');
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
});

/**
 * Get tourist's donations
 * GET /api/tourist/my-donations
 */
const getMyDonations = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('🔍 getMyDonations - User ID:', userId);
    console.log('🔍 getMyDonations - User email:', req.user.email);
    
    // Find user's donations
    const Donation = require('../models/Donation');
    let donations = await Donation.findByDonor(userId);
    
    console.log('🔍 getMyDonations - Found donations by userId:', donations.length);
    console.log('🔍 getMyDonations - Sample donation:', donations[0] ? { id: donations[0]._id, donor: donations[0].donor, amount: donations[0].amount } : 'No donations');
    
    // If no donations found by userId, try to find by email (fallback for donations with null donor)
    if (donations.length === 0) {
      console.log('🔍 getMyDonations - No donations found by userId, trying email lookup...');
      const donationsByEmail = await Donation.find({ 
        donorEmail: req.user.email,
        donor: null // Only get donations that weren't properly linked
      });
      console.log('🔍 getMyDonations - Found donations by email:', donationsByEmail.length);
      
      if (donationsByEmail.length > 0) {
        // Update these donations to link them to the current user
        console.log('🔍 getMyDonations - Updating donations to link to user...');
        await Donation.updateMany(
          { _id: { $in: donationsByEmail.map(d => d._id) } },
          { donor: userId, createdBy: userId }
        );
        console.log('🔍 getMyDonations - Updated donations linked to user');
        
        // Fetch the updated donations
        const updatedDonations = await Donation.findByDonor(userId);
        console.log('🔍 getMyDonations - Updated donations count:', updatedDonations.length);
        donations = updatedDonations;
      }
    }
    
    // Format donations for frontend compatibility
    const formattedDonations = donations.map(donation => ({
      _id: donation._id,
      amount: donation.amount,
      cause: donation.purpose,
      message: donation.message,
      date: donation.createdAt,
      status: donation.status,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      receiptNumber: donation.receiptNumber,
      currency: donation.currency
    }));
    
    console.log('Processed donations:', formattedDonations.length);
    
    // Return in the format expected by frontend (data property contains the array)
    return sendSuccess(res, {
      data: formattedDonations, // Frontend expects data.data or data
      donations: formattedDonations, // Also provide as donations for compatibility
      count: formattedDonations.length
    }, 'Donations retrieved successfully');
    
  } catch (error) {
    console.error('Error fetching donations:', error);
    return sendError(res, 'Failed to fetch donations', 500);
  }
});

// Test route to debug
router.post('/test-registration', (req, res) => {
  console.log('🧪 TEST REGISTRATION ENDPOINT HIT');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  res.json({ success: true, message: 'Test endpoint working' });
});

// Tourist routes
router.get('/my-registrations', getMyRegistrations);
router.get('/my-feedback', getMyFeedback);
router.get('/my-complaints', getMyComplaints);
router.get('/my-bookings', getMyBookings);
router.get('/my-donations', getMyDonations);
router.get('/events/check-slots', checkEventSlots);
router.post('/registrations', registerForEvent);
router.delete('/registrations/:registrationId', cancelEventRegistration);

module.exports = router;
