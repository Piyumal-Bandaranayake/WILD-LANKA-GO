import express from 'express';
import { systemLogin } from '../../controllers/auth/systemLoginController.js';

const router = express.Router();

// POST /api/system/login
router.post('/login', systemLogin);

export default router;
