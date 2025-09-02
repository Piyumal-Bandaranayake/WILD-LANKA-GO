// src/routes/user/adminroute.js
import express from 'express';
import { registerAdmin } from '../../controllers/user/admincontroller.js';

const router = express.Router();

router.post('/create-initial-admin', registerAdmin);

export default router;
