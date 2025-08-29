 import express from 'express';
import { registerCallOperator } from '../../controllers/user/callOperatorcontroller.js';  // Correct path to controller

const router = express.Router();

// Register route for call operator (admin assigns username and password)
router.post('/register', registerCallOperator);

export default router;
