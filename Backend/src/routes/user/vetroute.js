import express from "express";
import { registerVet,getVets,getVetById } from "../../controllers/user/vetcontroller.js";


const router = express.Router();
// Register Vet route
router.post('/register', registerVet);

// Get all Vets
router.get('/', getVets);

// Get Vet by ID
router.get('/:id', getVetById);

export default router;