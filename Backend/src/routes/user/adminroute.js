// src/routes/user/adminroute.js
import express from 'express';
import {
  registerAdmin,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats,
  createUser,
  deactivateUser
} from '../../controllers/user/admincontroller.js';
import flexibleAuth from '../../middleware/flexibleAuthMiddleware.js';
import { authorizeRoles } from '../../middleware/rolesMiddleware.js';

const router = express.Router();

// Public route for initial admin creation
router.post('/create-initial-admin', registerAdmin);

// Protected admin routes
router.use(flexibleAuth);
router.use(authorizeRoles('admin'));

// User management endpoints
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/stats', getUserStats);
router.get('/stats', getUserStats);  // Also available as /admin/stats for frontend compatibility
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/deactivate', deactivateUser);
router.delete('/users/:userId', deleteUser);

export default router;
