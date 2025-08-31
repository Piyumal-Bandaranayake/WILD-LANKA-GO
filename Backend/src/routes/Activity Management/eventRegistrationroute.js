import express from 'express';
import { createEventRegistration, modifyEventRegistration, removeEventRegistration } from '../../controllers/Activity Management/eventRegistrationcontroller.js';

const router = express.Router();

// POST - Tourist registers for an event
router.post('/create', createEventRegistration);

// PUT - Modify an existing event registration (e.g., change number of participants)
router.put('/modify/:id', modifyEventRegistration);

// DELETE - Tourist deletes their event registration
router.delete('/remove/:id', removeEventRegistration);

export default router;
