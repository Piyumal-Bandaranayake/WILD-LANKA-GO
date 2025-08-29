import express from 'express';
import { registerTourist } from '../../controllers/user/touristcontroller.js';  // Correct path to controller

const router = express.Router();

// Register tourist route
router.post('/register', registerTourist);

export default router;
