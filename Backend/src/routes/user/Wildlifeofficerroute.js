import express from 'express';
import {
  registerWildlifeOfficer,
  getWildlifeOfficers,
  getWildlifeOfficerById,
  updateWildlifeOfficer,
  deleteWildlifeOfficer,
  toggleAvailability,
  updateOfficerStatus,
  getAvailableOfficers
} from '../../controllers/user/Wildlifeofficercontroller.js';

const router = express.Router();

// Register route for wildlife officer
router.post('/register', registerWildlifeOfficer);

// Get all Wildlife Officers
router.get('/', getWildlifeOfficers);

// Get available Wildlife Officers
router.get('/available', getAvailableOfficers);

// Get Wildlife Officer by ID
router.get('/:id', getWildlifeOfficerById);

// Update Wildlife Officer profile
router.put('/:id', updateWildlifeOfficer);

// Toggle Wildlife Officer availability
router.patch('/:id/availability', toggleAvailability);

// Update Wildlife Officer status
router.patch('/:id/status', updateOfficerStatus);

// Delete Wildlife Officer profile
router.delete('/:id', deleteWildlifeOfficer);

export default router;