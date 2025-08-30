import express from 'express';
import { registerSafariDriver, getSafariDrivers } from '../../controllers/user/safariDrivercontroller.js';

const router = express.Router();
// Register safari driver route
router.post('/register', registerSafariDriver);
// Get all safari drivers
router.get('/', getSafariDrivers);

export default router;

    