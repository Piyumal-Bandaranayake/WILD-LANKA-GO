import express from 'express';
import { registerEmergencyOfficer } from '../../controllers/user/EmergencyOfficercontroller.js';  // Correct path to controller

const router = express.Router();

// Register route for emergency officer (admin assigns username and password)
router.post('/register', registerEmergencyOfficer);

export default router;
