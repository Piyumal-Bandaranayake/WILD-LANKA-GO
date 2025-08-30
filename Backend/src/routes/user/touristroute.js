import express from 'express';
import { registerTourist,getTourists,getTouristById } from '../../controllers/user/touristcontroller.js';  // Correct path to controller

const router = express.Router();

// Register tourist route
router.post('/register', registerTourist);

// Get all tourists
router.get('/', getTourists);

// Get tourist by ID
router.get('/:id', getTouristById);

export default router;
