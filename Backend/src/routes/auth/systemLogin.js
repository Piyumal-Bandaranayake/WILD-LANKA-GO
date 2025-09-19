import express from 'express';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';
import { systemResetPassword } from '../../controllers/auth/systemResetPasswordController.js';



const router = express.Router();

// Logged-in system user profile
router.get('/profile/me', auth0UserInfoMiddleware, (req, res) => {
  res.status(200).json({ message: 'System profile fetched', user: req.auth.payload });

});
router.put('/reset-password', systemResetPassword);




export default router;
