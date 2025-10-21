import express from 'express';
import {
    createEventRegistration,
    modifyEventRegistration,
    deleteEventRegistration,
    getAllRegistrations,
    getRegistrationById,
} from '../../controllers/Activity Management/eventRegistrationcontroller.js';

const router = express.Router();

// POST - User registers for an event
router.post('/', createEventRegistration);

// PUT - User modifies their event registration
router.put('/:id', modifyEventRegistration);

// DELETE - User deletes their event registration
router.delete('/:id', deleteEventRegistration);

// GET - Admin gets all event registrations
router.get('/', getAllRegistrations);

// GET - Get a single event registration by ID
router.get('/:id', getRegistrationById);

export default router;
