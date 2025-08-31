import express from 'express';
import {
  createTour,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver
} from '../../controllers/tourmanagement/tourcontroller.js';

const router = express.Router();

// Create new tour (after booking)
router.post('/create', createTour);

// Assign driver and tour guide
router.put('/assign', assignDriverAndGuide); // ✅ YOU NEED THIS

// Get all tours
router.get('/', getAllTours);

// Get tour by ID
router.get('/:id', getTourById);

// Get tours by tour guide
router.get('/guide/:guideId', getToursByGuide);

// Get tours by driver
router.get('/driver/:driverId', getToursByDriver);

export default router;
