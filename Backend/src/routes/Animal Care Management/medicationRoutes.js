import express from 'express';
import { 
  addMedication,
  updateMedicationStock,
  orderMedication,  // Order medication when stock is low
  updateMedication,
  getAllMedications,
  getMedicationById,
  deleteMedication
} from '../../controllers/Animal Care Management/medicationController.js';

const router = express.Router();

// Add new medication to inventory
router.post('/', addMedication);

// Update medication stock after receiving new stock
router.put('/update-stock', updateMedicationStock);

// Order medication from supplier when stock is low
router.post('/order', orderMedication);  // POST request to order medication

// Get all medications
router.get('/', getAllMedications);

// Get medication by ID
router.get('/:id', getMedicationById);

// Update medication
router.put('/:id', updateMedication);

// Delete medication
router.delete('/:id', deleteMedication);

export default router;
