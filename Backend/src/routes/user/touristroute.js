import express from 'express';
import { registerTourist,getTourists,getTouristById } from '../../controllers/user/touristcontroller.js';  // Correct path to controller
import { touristLogin } from '../../controllers/auth/touristLoginController.js';
import { resetTouristPassword } from '../../controllers/auth/touristresetPasswordController.js';


const router = express.Router();

// Register tourist route
router.post('/register', registerTourist);

// Get all tourists
router.get('/', getTourists);

// Get tourist by ID
router.get('/:id', getTouristById);

router.post('/login', touristLogin);

router.put('/reset-password', resetTouristPassword);

export default router;

