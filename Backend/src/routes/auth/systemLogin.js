import express from 'express';
import { systemResetPassword } from '../../controllers/auth/systemResetPasswordController.js';



const router = express.Router();

// Logged-in system user profile
router.get('/profile/me', (req, res) => {
  res.status(200).json({ message: 'System profile fetched', user: null });

});
router.put('/reset-password', systemResetPassword);




export default router;
