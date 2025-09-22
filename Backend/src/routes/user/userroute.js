// routes/user/userroute.js
import express from 'express';
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../../controllers/user/usercontroller.js';
import { getUserProfile } from '../../controllers/auth/authController.js';

const router = express.Router();

// ---------------- User Management Routes ---------------- //
router.get('/', getUsers);       // Get all users
router.get('/profile', getUserProfile); // Get current user profile
router.get('/:id', getUserById); // Get user by ID
router.put('/:id', updateUser);  // Update user profile
router.delete('/:id', deleteUser); // Delete user profile

export default router;