import express from "express";
import { 
    registerTourGuide, 
    getTourGuides, 
    getTourGuideById,
    updateTourGuide,
    updateGuideStatus,
    updateGuideAvailability,
    updateGuideCurrentTourStatus,
   
    getAvailableGuides
} from "../../controllers/user/tourGuidecontroller.js";

const router = express.Router();

router.post('/register', registerTourGuide);

// Get all Tour Guides
router.get('/', getTourGuides);

// Get available Tour Guides
router.get('/available', getAvailableGuides);

// Get Tour Guide by ID
router.get('/:id', getTourGuideById);

// Update Tour Guide profile
router.put('/:id', updateTourGuide);

// Update Guide Status
router.patch('/:id/status', updateGuideStatus);

// Update availability
router.patch('/:id/availability', updateGuideAvailability);

// Update current tour status
router.patch('/:id/currentTourStatus', updateGuideCurrentTourStatus);

// Delete Tour Guide profile


export default router;