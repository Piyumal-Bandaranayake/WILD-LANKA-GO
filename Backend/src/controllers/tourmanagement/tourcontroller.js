import Tour from  '../../models/tourmanagement/tour.js';

// Create new tour (submitted by tourist)
const createTour = async (req, res) => {
    try {
        const { tourId, touristNames, numberOfTourists, tourDate, tourLocation } = req.body;

        const existingTour = await Tour.findOne({ tourId });
        if (existingTour) {
            return res.status(400).json({ message: 'Tour ID already exists' });
        }

        const newTour = new Tour({
            tourId,
            touristNames,
            numberOfTourists,
            tourDate,
            tourLocation
        });

        await newTour.save();
        res.status(201).json({ message: 'Tour created successfully', tour: newTour });

    } catch (error) {
        res.status(500).json({ message: 'Server error while creating tour', error: error.message });
    }
};

// Assign tour guide and driver (by WPOC)
const assignDriverAndGuide = async (req, res) => {
    try {
        const { tourId, assignedTourGuide, assignedDriver } = req.body;

        // Use findOne() to find the tour by tourId (which is a string, not ObjectId)
        const tour = await Tour.findOne({ tourId });  // Use `findOne()` instead of `findById()`
        
        if (!tour) {
            return res.status(404).json({ message: 'Tour not found' });
        }

        // Assign the tour guide and driver
        tour.assignedTourGuide = assignedTourGuide;
        tour.assignedDriver = assignedDriver;
        tour.status = 'Confirmed';

        await tour.save();
        res.status(200).json({ message: 'Driver and guide assigned successfully', tour });

    } catch (error) {
        res.status(500).json({ message: 'Error assigning driver and guide', error: error.message });
    }
};

// Get all tours (admin/WPOC)
const getAllTours = async (req, res) => {
    try {
        const tours = await Tour.find().sort({ createdAt: -1 });
        res.status(200).json(tours);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tours', error: error.message });
    }
};

// Get tour by ID
const getTourById = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ message: 'Tour not found' });
        }
        res.status(200).json(tour);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour', error: error.message });
    }
};

// Get tours by guide ID/username
const getToursByGuide = async (req, res) => {
    try {
        const guideId = req.params.guideId;
        const tours = await Tour.find({ assignedTourGuide: guideId });
        res.status(200).json(tours);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tours for guide', error: error.message });
    }
};

// Get tours by driver ID/username
const getToursByDriver = async (req, res) => {
    try {
        const driverId = req.params.driverId;
        const tours = await Tour.find({ assignedDriver: driverId });
        res.status(200).json(tours);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tours for driver', error: error.message });
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
