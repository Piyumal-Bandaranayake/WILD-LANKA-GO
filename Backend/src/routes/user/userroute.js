// routes/user/userroute.js
import express from 'express';
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../../controllers/user/usercontroller.js';
import { getUserProfile } from '../../controllers/auth/authController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

// ---------------- User Management Routes ---------------- //
router.get('/', getUsers);       // Get all users
router.get('/profile', auth0UserInfoMiddleware, getUserProfile); // Get current user profile (protected)
router.get('/:id', getUserById); // Get user by ID
router.put('/:id', updateUser);  // Update user profile
router.delete('/:id', deleteUser); // Delete user profile

export default router;