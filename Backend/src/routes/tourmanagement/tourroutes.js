import express from 'express';
import {
    createTour,
    assignDriverAndGuide,
    getAllTours,
    getTourById,
    getToursByGuide,
    getToursByDriver
} from  '../../controllers/tourmanagement/tourcontroller.js';

const router = express.Router();

// Tourist submits a tour
router.post('/create', createTour);

// WPOC assigns driver and tour guide
router.put('/assign', assignDriverAndGuide);

// Get all tours
router.get('/', getAllTours);

// Get tour by Mongo ID
router.get('/:id', getTourById);

// Get tours assigned to a specific tour guide
router.get('/guide/:guideId', getToursByGuide);

// Get tours assigned to a specific driver
router.get('/driver/:driverId', getToursByDriver);

export default router;
