import express from 'express';
import { registerEmergencyOfficer,getEmergencyOfficers,getEmergencyOfficerById} from '../../controllers/user/EmergencyOfficercontroller.js';  // Correct path to controller

const router = express.Router();

// Register route for emergency officer (admin assigns username and password)
router.post('/register', registerEmergencyOfficer);

// Get all emergency officers
router.get('/', getEmergencyOfficers);

// Get emergency officer by ID
router.get('/:id', getEmergencyOfficerById);

export default router;
