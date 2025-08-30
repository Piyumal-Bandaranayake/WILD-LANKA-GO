import express, { Router } from "express";
import { registerTourGuide, getTourGuides, getTourGuideById} from "../../controllers/user/tourGuidecontroller.js";


const router=express.Router();


router.post('/register', registerTourGuide);

// Get all Tour Guides
router.get('/', getTourGuides);

// Get Tour Guide by ID
router.get('/:id', getTourGuideById);

export default router;