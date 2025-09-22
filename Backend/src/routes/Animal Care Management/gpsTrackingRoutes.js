import express from 'express';
import {
  updateGPSLocation,
  enableGPSTracking,
  disableGPSTracking,
  getGPSLocation,
  getGPSHistory,
  updateSafeZone,
  getActiveTrackedAnimals,
  getGPSAlerts
} from '../../controllers/animalCare/gpsTrackingController.js';

const router = express.Router();

// GPS tracking management
router.post('/:caseId/enable', enableGPSTracking);
router.post('/:caseId/disable', disableGPSTracking);
router.put('/:caseId/location', updateGPSLocation);
router.put('/:caseId/safe-zone', updateSafeZone);

// GPS data retrieval
router.get('/active-animals', getActiveTrackedAnimals);
router.get('/alerts', getGPSAlerts);
router.get('/:caseId', getGPSLocation);
router.get('/:caseId/history', getGPSHistory);

export default router;