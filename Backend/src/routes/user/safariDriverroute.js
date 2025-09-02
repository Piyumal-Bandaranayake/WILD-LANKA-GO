import express from 'express';

import { registerSafariDriver, getSafariDrivers,getSafariDriverById, updateDriverAvailability } from '../../controllers/user/safariDrivercontroller.js';


const router = express.Router();

// Register safari driver route
router.post('/register', registerSafariDriver);

// Get all safari drivers
router.get('/', getSafariDrivers);
// Get safari driver by ID
router.get('/:id', getSafariDriverById);

// ✅ Update ONLY availability
router.patch('/:id/availability', updateDriverAvailability);

export default router;
