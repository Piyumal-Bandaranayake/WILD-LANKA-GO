import Tour from '../../models/tourmanagement/tour.js';
import TourGuide from '../../models/User/tourGuide.js';  // Use the User model consistently
import SafariDriver from '../../models/User/safariDriver.js';
import Notification from '../../models/tourmanagement/tourGuideNotification.js'; // ✅ Correct model
import Booking from '../../models/Activity Management/Booking.js';


// Create tour
const createTour = async (req, res) => {
  try {
    const { bookingId, preferredDate } = req.body;

    if (!bookingId || !preferredDate) {
      return res.status(400).json({ message: 'Booking ID and Preferred Date are required' });
    }

    const existingTour = await Tour.findOne({ bookingId });
    if (existingTour) {
      return res.status(400).json({ message: 'Tour already exists for this booking' });
    }

    const newTour = new Tour({ bookingId, preferredDate }); // Create the tour
    await newTour.save();

    // Update the booking with the new tourId
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.tourId = newTour._id; // Set the tourId in the booking
      booking.status = 'Confirmed';  // Set status to 'Confirmed'
      await booking.save();
    }

    res.status(201).json({ message: 'Tour created successfully', tour: newTour });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating tour', error: error.message });
  }
};



// Assign Tour Guide and Driver
const assignDriverAndGuide = async (req, res) => {
  try {
    const { bookingId, assignedTourGuide, assignedDriver } = req.body;

    const tour = await Tour.findOne({ bookingId });
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found for this booking' });
    }

    const [guideDoc, driverDoc] = await Promise.all([
      assignedTourGuide ? TourGuide.findById(assignedTourGuide) : null,
      assignedDriver ? SafariDriver.findById(assignedDriver) : null,
    ]);

    if (assignedTourGuide && !guideDoc) {
      return res.status(404).json({ message: 'Assigned tour guide not found' });
    }
    if (assignedDriver && !driverDoc) {
      return res.status(404).json({ message: 'Assigned driver not found' });
    }

    tour.assignedTourGuide = assignedTourGuide || tour.assignedTourGuide;
    tour.assignedDriver = assignedDriver || tour.assignedDriver;
    tour.status = 'Confirmed';
    await tour.save();

    // Update Tour Guide
    if (assignedTourGuide) {
      await TourGuide.findByIdAndUpdate(
        assignedTourGuide,
        {
          availability: 'Busy',
          currentTourStatus: 'Processing',
        },
        { new: true }
      );

      // ✅ Notify Tour Guide
      await Notification.create({
        userId: assignedTourGuide,
        userType: 'TourGuide',
        tourId: tour._id,
        type: 'ASSIGNED_TOUR',
        title: 'New tour assigned',
        message: `You have been assigned to a new tour (Tour ID: ${tour._id.toString()}).`,
        meta: {
          bookingId: bookingId?.toString?.() || String(bookingId),
          status: tour.status,
        },
      });
    }

    // Update Driver
    if (assignedDriver) {
      await SafariDriver.findByIdAndUpdate(
        assignedDriver,
        { availability: 'Busy' },
        { new: true }
      );

      // ✅ Notify Driver
      await Notification.create({
        userId: assignedDriver,
        userType: 'Driver',
        tourId: tour._id,
        type: 'ASSIGNED_TOUR',
        title: 'New tour assigned',
        message: `You have been assigned as the safari driver for tour (Tour ID: ${tour._id.toString()}).`,
        meta: {
          bookingId: bookingId?.toString?.() || String(bookingId),
          status: tour.status,
        },
      });
    }

    return res.status(200).json({
      message: 'Driver and guide assigned successfully, availability updated, notification sent',
      tour,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error assigning driver and guide',
      error: error.message,
    });
  }
};

// Get all tours
const getAllTours = async (req, res) => {
  try {
    let filter = {};
    
    // If request comes from a tour guide, filter by assigned guide
    if (req.user && req.user.role === 'tourGuide') {
      // Find the tour guide document to get the ID
      const tourGuide = await TourGuide.findOne({ email: req.user.email });
      if (tourGuide) {
        filter.assignedTourGuide = tourGuide._id;
      }
    }
    
    const tours = await Tour.find(filter)
      .populate('bookingId')
      .populate('assignedTourGuide', 'firstname lastname email')
      .populate('assignedDriver', 'firstname lastname email')
      .sort({ createdAt: -1 });
      
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tours', error: error.message });
  }
};

// Get tour by ID
const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('bookingId');
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.status(200).json(tour);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tour', error: error.message });
  }
};

// Get tours by tour guide ID
const getToursByGuide = async (req, res) => {
  try {
    const tours = await Tour.find({ assignedTourGuide: req.params.guideId }).populate('bookingId');
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guide tours', error: error.message });
  }
};

// Get tours by driver ID
const getToursByDriver = async (req, res) => {
  try {
    const tours = await Tour.find({ assignedDriver: req.params.driverId }).populate('bookingId');
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch driver tours', error: error.message });
  }
};

// Accept tour by tour guide
const acceptTour = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Update tour status
    tour.status = 'Accepted';
    await tour.save();

    // Update tour guide status
    if (tour.assignedTourGuide) {
      await TourGuide.findByIdAndUpdate(
        tour.assignedTourGuide,
        { currentTourStatus: 'Accepted' },
        { new: true }
      );
    }

    res.status(200).json({ 
      message: 'Tour accepted successfully', 
      tour 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error accepting tour', 
      error: error.message 
    });
  }
};

// Reject tour by tour guide
const rejectTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Update tour status
    tour.status = 'Rejected';
    tour.rejectionReason = reason;
    await tour.save();

    // Update tour guide status back to available
    if (tour.assignedTourGuide) {
      await TourGuide.findByIdAndUpdate(
        tour.assignedTourGuide,
        { 
          availability: 'Available',
          currentTourStatus: 'Available' 
        },
        { new: true }
      );
    }

    res.status(200).json({ 
      message: 'Tour rejected successfully', 
      tour 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error rejecting tour', 
      error: error.message 
    });
  }
};

export {
  createTour,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver,
  acceptTour,
  rejectTour,
};
