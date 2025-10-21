import express from 'express';
import { 
  registerSafariDriver, 
  getSafariDrivers, 
  getSafariDriverById,
  updateSafariDriver,
  toggleAvailability,
  updateDriverStatus,
  deleteSafariDriver,
  getAvailableDrivers,
  getApprovedDrivers,
  makeAllApprovedDriversAvailable
} from '../../controllers/user/safariDrivercontroller.js';

const router = express.Router();

// Register safari driver
router.post('/register', registerSafariDriver);

// Get all active safari drivers
router.get('/', getSafariDrivers);

// Get available safari drivers
router.get('/available', getAvailableDrivers);

// Get approved safari drivers
router.get('/approved', getApprovedDrivers);

// Get safari driver by ID
router.get('/:id', getSafariDriverById);

// Update safari driver profile
router.put('/:id', updateSafariDriver);

// Toggle driver availability (like Vet model)
router.patch('/:id/availability', toggleAvailability);

// Update driver status (approve/reject)
router.patch('/:id/status', updateDriverStatus);

// Delete safari driver profile (soft delete)
router.delete('/:id', deleteSafariDriver);

// Make all approved drivers available (bulk update)
router.patch('/bulk/available', makeAllApprovedDriversAvailable);

export default router;