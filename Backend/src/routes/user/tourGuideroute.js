import express from "express";
import { 
  registerTourGuide, 
  getTourGuides, 
  getTourGuideById,
  updateGuideAvailability,
  updateGuideCurrentTourStatus
} from "../../controllers/user/tourGuidecontroller.js";

const router = express.Router();

router.post('/register', registerTourGuide);

// Get all Tour Guides
router.get('/', getTourGuides);

// Get Tour Guide by ID
router.get('/:id', getTourGuideById);

/* NEW: update only availability */
router.patch('/:id/availability', updateGuideAvailability);

/* NEW: update only currentTourStatus */
router.patch('/:id/currentTourStatus', updateGuideCurrentTourStatus);

export default router;
