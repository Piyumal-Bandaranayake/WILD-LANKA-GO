import express from 'express';
import { createEventRegistration, modifyEventRegistration, removeEventRegistration ,getAllEventRegistrations,getEventRegistrationById} from '../../controllers/Activity Management/eventRegistrationcontroller.js';

const router = express.Router();

// POST - Tourist registers for an event
router.post('/create', createEventRegistration);

// PUT - Modify an existing event registration (e.g., change number of participants)
router.put('/modify/:id', modifyEventRegistration);

// DELETE - Tourist deletes their event registration
router.delete('/delete/:id', removeEventRegistration);

//get all event registrations
router.get('/', getAllEventRegistrations);

//get event registration by id
router.get('/:id', getEventRegistrationById);

export default router;
