import express from 'express';
import { registerTourist, getTourists, getTouristById } from '../../controllers/user/touristcontroller.js';
import { touristLogin } from '../../controllers/auth/touristLoginController.js';
import { resetTouristPassword } from '../../controllers/auth/touristresetPasswordController.js';
import protect from '../../middleware/authMiddleware.js'; // ✅ import protect middleware

const router = express.Router();

// ---------------- Public Routes ---------------- //
router.post('/register', registerTourist);   // Anyone can register
router.post('/login', touristLogin);         // Anyone can login

// ---------------- Protected Routes ---------------- //
router.get('/', protect, getTourists);       // Only logged-in users can view all tourists
router.get('/:id', protect, getTouristById); // Only logged-in users can view tourist by ID
router.put('/reset-password', protect, resetTouristPassword); // Only logged-in users can reset password

export default router;
