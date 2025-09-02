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

router.post('/create', createTour);
router.put('/assign', assignDriverAndGuide);

router.get('/', getAllTours);
router.get('/guide/:guideId', getToursByGuide);   // <-- before /:id
router.get('/driver/:driverId', getToursByDriver); // <-- before /:id
router.get('/:id', getTourById);


export default router;
