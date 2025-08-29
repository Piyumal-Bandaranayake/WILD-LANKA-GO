import express from 'express';
import { adminLogin } from '../../controllers/user/admincontroller.js';  // Correct path to controller

const router = express.Router();

// Admin login route
router.post('/login', adminLogin);

export default router;
