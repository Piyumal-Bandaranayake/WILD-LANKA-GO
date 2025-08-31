import Tour from '../../models/tourmanagement/tour.js';
import TourGuide from '../../models/User/tourGuide.js';
import SafariDriver from '../../models/User/safariDriver.js'; // Make sure this path is correct

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

    const tour = await Tour.findOne({ bookingId });
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found for this booking' });
    }

    // Assign and update tour
    tour.assignedTourGuide = assignedTourGuide;
    tour.assignedDriver = assignedDriver;
    tour.status = 'Confirmed';
    await tour.save();

    // Update Tour Guide availability
    await TourGuide.findByIdAndUpdate(assignedTourGuide, {
      Availability: 'Assigned'
    });

    // Update Safari Driver availability
    await SafariDriver.findByIdAndUpdate(assignedDriver, {
      Availability: 'Assigned'
    });

    res.status(200).json({
      message: 'Driver and guide assigned successfully, availability updated',
      tour
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning driver and guide', error: error.message });
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

export {
  createTour,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver
};
