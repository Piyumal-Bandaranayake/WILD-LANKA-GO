import express from 'express';
import { createEvent, getAllEvents } from '../../controllers/Activity Management/eventcontroller.js';

const router = express.Router();

// POST - Create a new event
router.post('/create', createEvent);

// GET - Fetch all events
router.get('/', getAllEvents);

export default router;
