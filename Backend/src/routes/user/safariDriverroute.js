import express from 'express';
import { registerSafariDriver } from '../../controllers/user/safariDrivercontroller.js';  // Correct path to controller

const router = express.Router();
// Register safari driver route
router.post('/register', registerSafariDriver);
export default router;

    