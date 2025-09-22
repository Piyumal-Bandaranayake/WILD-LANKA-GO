import express from 'express';
import {
  createTour,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver,
  acceptTour,
  rejectTour
} from '../../controllers/tourmanagement/tourcontroller.js';
import flexibleAuthMiddleware from '../../middleware/flexibleAuthMiddleware.js';

const router = express.Router();

router.post('/create', createTour);
router.put('/assign', assignDriverAndGuide);
router.put('/:id/accept', flexibleAuthMiddleware, acceptTour);
router.put('/:id/reject', flexibleAuthMiddleware, rejectTour);

router.get('/', flexibleAuthMiddleware, getAllTours);  // Protected to filter by user
router.get('/guide/:guideId', getToursByGuide);   // <-- before /:id
router.get('/driver/:driverId', getToursByDriver); // <-- before /:id
router.get('/:id', getTourById);


export default router;
