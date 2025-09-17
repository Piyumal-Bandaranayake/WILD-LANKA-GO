import express from "express";
import { 
  registerVet, 
  getVets, 
  getVetById, 
  updateVet, 
  deleteVet, 
  toggleAvailability,
  getAvailableVets 
} from "../../controllers/user/vetcontroller.js";

const router = express.Router();

// Register Vet route
router.post('/register', registerVet);

// Get all active vets
router.get('/', getVets);

// Get available vets
router.get('/available', getAvailableVets);

// Get Vet by ID
router.get('/:id', getVetById);

// Update Vet profile
router.put('/:id', updateVet);

// Delete Vet profile (soft delete)
router.delete('/:id', deleteVet);

// Toggle vet availability
router.patch('/:id/availability', toggleAvailability);

export default router;