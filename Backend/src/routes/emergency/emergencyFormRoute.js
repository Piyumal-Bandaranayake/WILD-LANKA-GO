import express from 'express';
import { submitEmergencyForm } from '../../controllers/emergency/emergencyFormController.js';
import EmergencyForm from '../../models/emergency/emergencyForm.js';  // Import the EmergencyForm model

const router = express.Router();

// Endpoint for submitting an emergency form (POST)
router.post('/submit', submitEmergencyForm);

// Endpoint for getting all emergency forms (GET)
router.get('/', async (req, res) => {
    try {
        const forms = await EmergencyForm.find();  // Fetch all emergency forms
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emergency forms', error: error.message });
    }
});

// Endpoint for getting an emergency form by ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const form = await EmergencyForm.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Emergency form not found' });
        }
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emergency form', error: error.message });
    }
});

// **New Endpoint to delete an emergency form by ID (DELETE)**
router.delete('/:id', async (req, res) => {
  try {
    const form = await EmergencyForm.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ message: 'Emergency form not found' });
    res.status(200).json({ message: 'Emergency form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting emergency form', error: error.message });
  }
});

export default router;
