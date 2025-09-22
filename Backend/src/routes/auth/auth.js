import express from 'express';
import { handleLogin, getUserProfile, updateUserProfile } from '../../controllers/auth/authController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

// Apply Auth0 middleware to all auth routes
router.use(auth0UserInfoMiddleware);

router.post('/login', handleLogin);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

export default router;
