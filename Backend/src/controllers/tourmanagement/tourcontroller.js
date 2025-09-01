import Tour from '../../models/tourmanagement/tour.js';
import TourGuide from '../../models/User/tourGuide.js';
import SafariDriver from '../../models/User/safariDriver.js';
import TourGuideNotification from '../../models/tourmanagement/tourGuideNotification.js';


// Create new tour (based on a booking)
const createTour = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const existingTour = await Tour.findOne({ bookingId });
    if (existingTour) {
      return res.status(400).json({ message: 'Tour already exists for this booking' });
    }

    const newTour = new Tour({ bookingId });
    await newTour.save();

    res.status(201).json({ message: 'Tour created successfully', tour: newTour });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating tour', error: error.message });
  }
};

// Assign Tour Guide and Driver
const assignDriverAndGuide = async (req, res) => {
  try {
    const { bookingId, assignedTourGuide, assignedDriver } = req.body;

    // 1) Find the tour by bookingId
    const tour = await Tour.findOne({ bookingId });
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found for this booking' });
    }

    // 2) (Optional but safer) ensure the guide/driver exist before updating them
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

    // 3) Update tour
    tour.assignedTourGuide = assignedTourGuide || tour.assignedTourGuide;
    tour.assignedDriver = assignedDriver || tour.assignedDriver;
    tour.status = 'Confirmed';
    await tour.save();

    // 4) Update Tour Guide availability + currentTourStatus
    if (assignedTourGuide) {
      await TourGuide.findByIdAndUpdate(
        assignedTourGuide,
        {
          availability: 'Busy',
          currentTourStatus: 'Processing',
        },
        { new: true }
      );

      // 5) Create a notification for the guide
      await TourGuideNotification.create({
        tourGuideId: assignedTourGuide,
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

    // 6) Update Safari Driver availability if provided
    if (assignedDriver) {
      await SafariDriver.findByIdAndUpdate(
        assignedDriver,
        { availability: 'Busy' },
        { new: true }
      );
    }

    return res.status(200).json({
      message:
        'Driver and guide assigned successfully, availability updated, notification sent',
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
    const tours = await Tour.find().populate('bookingId').sort({ createdAt: -1 });
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
    const tours = await Tour.find({ assignedTourGuide: req.params.guideId }).populate(
      'bookingId'
    );
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guide tours', error: error.message });
  }
};

// Get tours by driver ID
const getToursByDriver = async (req, res) => {
  try {
    const tours = await Tour.find({ assignedDriver: req.params.driverId }).populate(
      'bookingId'
    );
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch driver tours', error: error.message });
  }
};

export {
  createTour,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver,
};
