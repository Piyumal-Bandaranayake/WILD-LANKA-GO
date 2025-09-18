import express from 'express';
import {
  registerEmergencyOfficer,
  getEmergencyOfficers,
  getEmergencyOfficerById,
  updateEmergencyOfficer,
  deleteEmergencyOfficer,
  toggleAvailability,
  getAvailableOfficers
} from '../../controllers/user/EmergencyOfficercontroller.js';

const router = express.Router();

// Register route for emergency officer
router.post('/register', registerEmergencyOfficer);

// Get all emergency officers
router.get('/', getEmergencyOfficers);

// Get available emergency officers
router.get('/available', getAvailableOfficers);

// Get emergency officer by ID
router.get('/:id', getEmergencyOfficerById);

// Update emergency officer profile
router.put('/:id', updateEmergencyOfficer);

// Toggle emergency officer availability
router.patch('/:id/availability', toggleAvailability);

// Delete emergency officer profile
router.delete('/:id', deleteEmergencyOfficer);

export default router;