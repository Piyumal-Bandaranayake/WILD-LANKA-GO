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

const router = express.Router();

// Medication CRUD routes
router.get('/', getMedications);
router.get('/alerts', getMedicationAlerts);
router.get('/restock-requests', getRestockRequests);
router.get('/usage-report', generateUsageReport);
router.get('/:id', getMedicationById);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);

// Medication usage and inventory management
router.post('/:id/use', useMedication);
router.post('/:id/restock-request', requestRestock);
router.put('/:id/restock-requests/:requestId', handleRestockRequest);
router.post('/bulk-update', bulkUpdateQuantities);

export default router;
