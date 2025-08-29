import express from 'express';
import { registerWildlifeOfficer } from '../../controllers/user/Wildlifeofficercontroller.js';

const router = express.Router();

// Register route for wildlife officer (admin assigns username and password)
router.post('/register', registerWildlifeOfficer);

export default router;
