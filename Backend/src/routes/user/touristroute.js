// routes/user/touristroute.js
import express from 'express';
import { 
  registerTourist, 
  getTourists, 
  getTouristById, 
  updateTourist, 
  deleteTourist 
} from '../../controllers/user/touristcontroller.js';
import { resetTouristPassword } from '../../controllers/auth/touristresetPasswordController.js';

const router = express.Router();

// ---------------- Public Routes ---------------- //
router.post('/register', registerTourist);   // Anyone can register
router.put('/reset-password', resetTouristPassword); // Password reset (username-based)

// ---------------- Tourist Management Routes ---------------- //
router.get('/', getTourists);       // Get all tourists
router.get('/:id', getTouristById); // Get tourist by ID
router.put('/:id', updateTourist);  // Update tourist profile
router.delete('/:id', deleteTourist); // Delete tourist profile

export default router;