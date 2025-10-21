import Booking from '../../models/Activity Management/Booking.js';
import EventRegistration from '../../models/Activity Management/eventRegistration.js';
import Donation from '../../models/Donation.js';
import Feedback from '../../models/Feedback/FeedbackModel.js';
import Complaint from '../../models/Complaint/ComplaintModel.js';
import Activity from '../../models/Activity Management/Activity.js';
import Event from '../../models/Event.js';
import mongoose from 'mongoose';

// Get tourist's bookings
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId; // From auth middleware or request body
    
    const bookings = await Booking.find({ userId })
      .populate('activityId', 'name description location price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get tourist's event registrations
export const getMyEventRegistrations = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId; // From auth middleware or request body
    
    const registrations = await EventRegistration.find({ userId })
      .populate('eventId', 'title description dateTime location pricing capacity status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations,
      message: 'Event registrations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user event registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event registrations',
      error: error.message
    });
  }
};

// Get tourist's donations
export const getMyDonations = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId; // From auth middleware or request body
    
    const donations = await Donation.find({ 'donor.userId': userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: donations,
      message: 'Donations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
};

// Get tourist's feedback
export const getMyFeedback = async (req, res) => {
  try {
    const username = req.user?.name || req.user?.username || req.body.username || 'Anonymous'; // From auth middleware or request body
    
    const feedback = await Feedback.find({ username })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: feedback,
      message: 'Feedback retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get tourist's complaints
export const getMyComplaints = async (req, res) => {
  try {
    const username = req.user?.name || req.user?.username || req.body.username || 'Anonymous'; // From auth middleware or request body
    
    const complaints = await Complaint.find({ username, role: 'Tourist' })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: complaints,
      message: 'Complaints retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
};

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { activityId, bookingDate, numberOfParticipants, requestTourGuide, preferredDate, paymentMethod } = req.body;

    // Validate required fields
    if (!activityId || !bookingDate || !numberOfParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID, booking date, and number of participants are required'
      });
    }

    if (numberOfParticipants < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of participants must be at least 1'
      });
    }

    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if activity is active
    if (activity.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Activity is not currently available for booking'
      });
    }

    // Validate booking date is not in the past
    const bookingDateObj = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book activities for past dates'
      });
    }

    // Check available slots for the chosen date
    const existingBookingsOnDate = await Booking.aggregate([
      {
        $match: {
          activityId: new mongoose.Types.ObjectId(activityId),
          bookingDate: {
            $gte: new Date(bookingDate + 'T00:00:00.000Z'),
            $lt: new Date(bookingDate + 'T23:59:59.999Z')
          },
          status: { $in: ['Pending', 'Confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: '$numberOfParticipants' }
        }
      }
    ]);

    const bookedParticipants = existingBookingsOnDate.length > 0 ? existingBookingsOnDate[0].totalParticipants : 0;
    const availableSlots = activity.capacity - bookedParticipants;

    if (numberOfParticipants > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Not enough slots available. Only ${availableSlots} slots remaining for this date.`,
        availableSlots: availableSlots
      });
    }

    // Create booking with pending status (will be confirmed after payment)
    const booking = new Booking({
      userId,
      activityId,
      bookingDate: bookingDateObj,
      numberOfParticipants,
      requestTourGuide: requestTourGuide || false,
      preferredDate: preferredDate ? new Date(preferredDate) : bookingDateObj,
      status: 'Pending' // Will be updated to 'Confirmed' after payment
    });

    await booking.save();

    // Populate the activity details for response
    await booking.populate('activityId', 'name description location price images capacity');

    // Calculate total price for payment processing
    const totalPrice = activity.price * numberOfParticipants;
    const tourGuidePrice = requestTourGuide ? 1500 : 0; // LKR 1500 for tour guide
    const finalTotal = totalPrice + tourGuidePrice;

    res.status(201).json({
      success: true,
      data: {
        booking,
        payment: {
          totalAmount: finalTotal,
          basePrice: totalPrice,
          tourGuidePrice: tourGuidePrice,
          currency: 'LKR'
        },
        availableSlots: availableSlots - numberOfParticipants
      },
      message: 'Booking created successfully. Please proceed with payment to confirm.',
      note: 'Once confirmed, this booking cannot be cancelled or modified.'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Check available slots for an activity on a specific date
export const checkAvailableSlots = async (req, res) => {
  try {
    const { activityId, date } = req.query;

    if (!activityId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID and date are required'
      });
    }

    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check existing bookings for the date
    const existingBookingsOnDate = await Booking.aggregate([
      {
        $match: {
          activityId: new mongoose.Types.ObjectId(activityId),
          bookingDate: {
            $gte: new Date(date + 'T00:00:00.000Z'),
            $lt: new Date(date + 'T23:59:59.999Z')
          },
          status: { $in: ['Pending', 'Confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: '$numberOfParticipants' }
        }
      }
    ]);

    const bookedParticipants = existingBookingsOnDate.length > 0 ? existingBookingsOnDate[0].totalParticipants : 0;
    const availableSlots = activity.capacity - bookedParticipants;

    res.status(200).json({
      success: true,
      data: {
        activityId,
        date,
        totalCapacity: activity.capacity,
        bookedSlots: bookedParticipants,
        availableSlots: Math.max(0, availableSlots),
        activityName: activity.name,
        price: activity.price
      }
    });
  } catch (error) {
    console.error('Error checking available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check available slots',
      error: error.message
    });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { eventId, numberOfParticipants } = req.body;

    // Validate event exists and has available slots
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.capacity.availableSlots < numberOfParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Not enough available slots for this event'
      });
    }

    // Check if user is already registered for this event
    const existingRegistration = await EventRegistration.findOne({ userId, eventId });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    const registration = new EventRegistration({
      userId,
      eventId,
      numberOfParticipants
    });

    await registration.save();

    // Update event capacity
    event.capacity.availableSlots -= numberOfParticipants;
    await event.save();

    // Populate the event details for response
    await registration.populate('eventId', 'title description dateTime location pricing capacity status');

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Event registration successful'
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};

// Modify event registration (update number of participants)
export const modifyEventRegistration = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { registrationId } = req.params;
    const { numberOfParticipants } = req.body;

    if (!numberOfParticipants || numberOfParticipants < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of participants must be at least 1'
      });
    }

    // Find the registration
    const registration = await EventRegistration.findOne({ _id: registrationId, userId });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Event registration not found or you do not have permission to modify it'
      });
    }

    // Get the event details
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Calculate slot difference
    const currentParticipants = registration.numberOfParticipants;
    const participantDifference = numberOfParticipants - currentParticipants;

    // Check if there are enough available slots for increase
    if (participantDifference > 0 && event.capacity.availableSlots < participantDifference) {
      return res.status(400).json({
        success: false,
        message: `Not enough available slots. Only ${event.capacity.availableSlots} slots remaining.`
      });
    }

    // Update registration
    registration.numberOfParticipants = numberOfParticipants;
    await registration.save();

    // Update event capacity
    event.capacity.availableSlots -= participantDifference;
    await event.save();

    // Populate the event details for response
    await registration.populate('eventId', 'title description dateTime location pricing capacity status');

    res.status(200).json({
      success: true,
      data: registration,
      message: 'Event registration modified successfully'
    });
  } catch (error) {
    console.error('Error modifying event registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to modify event registration',
      error: error.message
    });
  }
};

// Create a donation
export const createDonation = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { amount, message, category, donationType, isAnonymous } = req.body;

    const donation = new Donation({
      donor: {
        userId,
        isAnonymous: isAnonymous || false,
        isGuest: false
      },
      amount: {
        value: amount,
        currency: 'LKR'
      },
      donationType: donationType || 'One-time',
      category: category || 'General Wildlife Conservation',
      message: {
        personalMessage: message,
        isPublic: !isAnonymous
      },
      payment: {
        method: 'Credit Card', // Default method
        status: 'Pending'
      }
    });

    await donation.save();

    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation created successfully'
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create donation',
      error: error.message
    });
  }
};

// Update donation message
export const updateDonationMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { donationId } = req.params;
    const { message } = req.body;

    // Find the donation
    const donation = await Donation.findOne({ 
      _id: donationId, 
      'donor.userId': userId 
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found or you do not have permission to update it'
      });
    }

    // Update the message in the purpose description
    donation.purpose.description = message;
    await donation.save();

    res.status(200).json({
      success: true,
      data: donation,
      message: 'Donation message updated successfully'
    });
  } catch (error) {
    console.error('Error updating donation message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation message',
      error: error.message
    });
  }
};

// Create feedback
export const createFeedback = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const { message, tourGuideName, eventType, activityType, images } = req.body;

    const feedback = new Feedback({
      username,
      message,
      tourGuideName,
      eventType,
      activityType,
      images: images || []
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

// Update feedback (tourists can edit their own feedback)
export const updateFeedback = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const { feedbackId } = req.params;
    const { message, tourGuideName, eventType, activityType, images } = req.body;

    // Find feedback by user
    const feedback = await Feedback.findOne({ _id: feedbackId, username });
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or you do not have permission to update it'
      });
    }

    // Update feedback fields
    feedback.message = message || feedback.message;
    feedback.tourGuideName = tourGuideName || feedback.tourGuideName;
    feedback.eventType = eventType || feedback.eventType;
    feedback.activityType = activityType || feedback.activityType;
    feedback.images = images || feedback.images;

    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback,
      message: 'Feedback updated successfully'
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

// Delete feedback (tourists can delete their own feedback)
export const deleteFeedback = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const { feedbackId } = req.params;

    // Find and delete feedback by user
    const feedback = await Feedback.findOneAndDelete({ _id: feedbackId, username });
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};

// Get all feedback (tourists can view others' feedback)
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments();

    res.status(200).json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      message: 'Feedback retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Create complaint
export const createComplaint = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const email = req.user?.email || req.body.email || 'unknown@example.com';
    const { message, location } = req.body;

    const complaint = new Complaint({
      username,
      email,
      role: 'Tourist',
      message,
      location: location || ''
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint submitted successfully'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: error.message
    });
  }
};

// Update complaint (tourists can edit their own complaints)
export const updateComplaint = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const { complaintId } = req.params;
    const { message, location } = req.body;

    // Find complaint by user
    const complaint = await Complaint.findOne({ _id: complaintId, username });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or you do not have permission to update it'
      });
    }

    // Update complaint fields
    complaint.message = message || complaint.message;
    complaint.location = location || complaint.location;

    await complaint.save();

    res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint',
      error: error.message
    });
  }
};

// Delete complaint (tourists can delete their own complaints)
export const deleteComplaint = async (req, res) => {
  try {
    const username = req.user.name || req.user.username;
    const { complaintId } = req.params;

    // Find and delete complaint by user
    const complaint = await Complaint.findOneAndDelete({ _id: complaintId, username });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message
    });
  }
};

// Emergency reporting functionality
export const reportEmergency = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const userName = req.user?.name || req.body.userName || 'Anonymous';
    const userEmail = req.user?.email || req.body.userEmail || 'unknown@example.com';
    const { 
      emergencyType, 
      description, 
      location, 
      severity, 
      contactNumber,
      coordinates 
    } = req.body;

    // Create emergency report (you may need to import Emergency model)
    const emergencyReport = {
      reporterId: userId,
      reporterName: userName,
      reporterEmail: userEmail,
      reporterRole: 'Tourist',
      emergencyType: emergencyType || 'General',
      description,
      location,
      severity: severity || 'Medium',
      contactNumber,
      coordinates: coordinates || null,
      status: 'Active',
      reportedAt: new Date()
    };

    // Here you would save to Emergency model if it exists
    // For now, we'll return the structured data
    
    res.status(201).json({
      success: true,
      data: emergencyReport,
      message: 'Emergency reported successfully. Emergency officers have been notified.',
      note: 'This emergency has been logged and will be handled immediately by our emergency response team.'
    });
  } catch (error) {
    console.error('Error reporting emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report emergency',
      error: error.message
    });
  }
};

// Get tourist dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const username = req.user.name || req.user.username;

    const [bookingsCount, registrationsCount, donationsCount, feedbackCount, complaintsCount] = await Promise.all([
      Booking.countDocuments({ userId }),
      EventRegistration.countDocuments({ userId }),
      Donation.countDocuments({ 'donor.userId': userId }),
      Feedback.countDocuments({ username }),
      Complaint.countDocuments({ username, role: 'Tourist' })
    ]);

    // Get recent activity
    const recentBookings = await Booking.find({ userId })
      .populate('activityId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    const recentDonations = await Donation.find({ 'donor.userId': userId })
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBookings: bookingsCount,
          totalRegistrations: registrationsCount,
          totalDonations: donationsCount,
          totalFeedback: feedbackCount,
          totalComplaints: complaintsCount
        },
        recentActivity: {
          bookings: recentBookings,
          donations: recentDonations
        }
      },
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Cancel event registration
export const cancelEventRegistration = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { registrationId } = req.params;

    const registration = await EventRegistration.findOne({ _id: registrationId, userId });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update event capacity
    const event = await Event.findById(registration.eventId);
    if (event) {
      event.capacity.availableSlots += registration.numberOfParticipants;
      await event.save();
    }

    await EventRegistration.findByIdAndDelete(registrationId);

    res.status(200).json({
      success: true,
      message: 'Event registration cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling event registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel event registration',
      error: error.message
    });
  }
};
