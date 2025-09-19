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
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

// GPS tracking management
router.post('/:caseId/enable', auth0UserInfoMiddleware, enableGPSTracking);
router.post('/:caseId/disable', auth0UserInfoMiddleware, disableGPSTracking);
router.put('/:caseId/location', auth0UserInfoMiddleware, updateGPSLocation);
router.put('/:caseId/safe-zone', auth0UserInfoMiddleware, updateSafeZone);

// GPS data retrieval
router.get('/active-animals', auth0UserInfoMiddleware, getActiveTrackedAnimals);
router.get('/alerts', auth0UserInfoMiddleware, getGPSAlerts);
router.get('/:caseId', auth0UserInfoMiddleware, getGPSLocation);
router.get('/:caseId/history', auth0UserInfoMiddleware, getGPSHistory);

export default router;