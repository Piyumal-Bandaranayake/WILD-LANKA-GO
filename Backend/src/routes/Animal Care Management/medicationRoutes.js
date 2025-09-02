import express from 'express';
import { addMedication, updateMedicationStock, orderMedication, getAllMedications, getMedicationById, updateMedication, deleteMedication } from '../../controllers/Animal care Management/medicationController.js';

const router = express.Router();

// Add new medication to inventory
router.post('/', addMedication);

// Update medication stock after receiving new stock
router.put('/update-stock', updateMedicationStock);

// Order medication from supplier when stock is low
router.post('/order', orderMedication);

// Get all medications
router.get('/', getAllMedications);

// Get medication by ID
router.get('/:id', getMedicationById);

// Update medication
router.put('/:id', updateMedication);

// Delete medication
router.delete('/:id', deleteMedication);

export default router;
