import express from 'express';
import { reportEmergency, updateEmergencyStatus } from '../../controllers/emergency/emergencyController.js';
import Emergency from '../../models/emergency/emergency.js';  // Import Emergency model

const router = express.Router();

// Endpoint for reporting an emergency (POST)
router.post('/report', reportEmergency);

// Endpoint for getting all emergencies (GET)
router.get('/', async (req, res) => {
    try {
        const emergencies = await Emergency.find();  // Fetch all emergencies
        res.status(200).json(emergencies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emergencies', error: error.message });
    }
});

// Endpoint for getting an emergency by case_id (GET)
router.get('/:case_id', async (req, res) => {
    try {
        const emergency = await Emergency.findOne({ case_id: req.params.case_id });
        if (!emergency) {
            return res.status(404).json({ message: 'Emergency not found' });
        }
        res.status(200).json(emergency);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emergency', error: error.message });
    }
});

// Endpoint for updating the status of an emergency (PUT)
router.put('/update-status', updateEmergencyStatus);

export default router;
