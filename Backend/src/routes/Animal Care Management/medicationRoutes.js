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
import flexibleAuth from '../../middleware/flexibleAuthMiddleware.js';
import { authorizeRoles } from '../../middleware/rolesMiddleware.js';

const router = express.Router();

// Medication CRUD routes
router.get('/', flexibleAuth, getMedications);
router.get('/alerts', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getMedicationAlerts);
router.get('/restock-requests', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getRestockRequests);
router.get('/usage-report', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), generateUsageReport);
router.get('/:id', flexibleAuth, getMedicationById);
router.post('/', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), createMedication);
router.put('/:id', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), updateMedication);
router.delete('/:id', flexibleAuth, authorizeRoles('WildlifeOfficer', 'admin'), deleteMedication);

// Medication usage and inventory management
router.post('/:id/use', flexibleAuth, authorizeRoles('vet', 'admin'), useMedication);
router.post('/:id/restock-request', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), requestRestock);
router.put('/:id/restock-requests/:requestId', flexibleAuth, authorizeRoles('WildlifeOfficer', 'admin'), handleRestockRequest);
router.post('/bulk-update', flexibleAuth, authorizeRoles('WildlifeOfficer', 'admin'), bulkUpdateQuantities);

export default router;
