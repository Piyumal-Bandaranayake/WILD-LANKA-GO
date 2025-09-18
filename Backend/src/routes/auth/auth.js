import express from 'express';
import { handleLogin, getUserProfile, updateUserProfile } from '../../controllers/auth/authController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

router.post('/login', auth0UserInfoMiddleware, handleLogin);
router.get('/profile', auth0UserInfoMiddleware, getUserProfile);
router.put('/profile', auth0UserInfoMiddleware, updateUserProfile);

export default router;
