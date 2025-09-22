import express from 'express';
import {
  submitFuelClaim,
  getAllFuelClaims,
  getFuelClaimsByDriver
} from '../../controllers/tourmanagement/fuelClaimController.js';

const router = express.Router();

router.post('/submit', submitFuelClaim);         // Submit fuel claim
router.get('/', getAllFuelClaims);               // Get all fuel claims
router.get('/driver/:driverId', getFuelClaimsByDriver); // Get claims by driver

export default router;
