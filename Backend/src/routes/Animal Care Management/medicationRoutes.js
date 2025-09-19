import express from 'express';
import {
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  useMedication,
  requestRestock,
  handleRestockRequest,
  getRestockRequests,
  getMedicationAlerts,
  generateUsageReport,
  deleteMedication,
  bulkUpdateQuantities
} from '../../controllers/animalCare/medicationController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

// Medication CRUD routes
router.get('/', auth0UserInfoMiddleware, getMedications);
router.get('/alerts', auth0UserInfoMiddleware, getMedicationAlerts);
router.get('/restock-requests', auth0UserInfoMiddleware, getRestockRequests);
router.get('/usage-report', auth0UserInfoMiddleware, generateUsageReport);
router.get('/:id', auth0UserInfoMiddleware, getMedicationById);
router.post('/', auth0UserInfoMiddleware, createMedication);
router.put('/:id', auth0UserInfoMiddleware, updateMedication);
router.delete('/:id', auth0UserInfoMiddleware, deleteMedication);

// Medication usage and inventory management
router.post('/:id/use', auth0UserInfoMiddleware, useMedication);
router.post('/:id/restock-request', auth0UserInfoMiddleware, requestRestock);
router.put('/:id/restock-requests/:requestId', auth0UserInfoMiddleware, handleRestockRequest);
router.post('/bulk-update', auth0UserInfoMiddleware, bulkUpdateQuantities);

export default router;
