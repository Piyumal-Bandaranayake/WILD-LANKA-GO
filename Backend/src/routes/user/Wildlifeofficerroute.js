import express from 'express';
import { registerWildlifeOfficer ,getWildlifeOfficers,getWildlifeOfficerById} from '../../controllers/user/Wildlifeofficercontroller.js';

const router = express.Router();

// Register route for wildlife officer (admin assigns username and password)
router.post('/register', registerWildlifeOfficer);

// Get all Wildlife Officers
router.get('/', getWildlifeOfficers);

// Get Wildlife Officer by ID
router.get('/:id', getWildlifeOfficerById);

export default router;