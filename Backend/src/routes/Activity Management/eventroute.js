import express from 'express';
import { createEvent, updateEvent, deleteEvent, getAllEvents, uploadEventImage } from '../../controllers/Activity Management/eventcontroller.js';
import upload from '../../utils/multerConfig.js';

const router = express.Router();

// POST - Admin creates a new event
router.post('/create', createEvent);

// POST - Admin uploads an image for an event
router.post('/upload-image/:id', upload.single('image'), uploadEventImage);  // 'image' is the name of the file input

// PUT - Admin updates an existing event (including image upload)
router.put('/update/:id', upload.single('image'), updateEvent);

// DELETE - Admin deletes an event
router.delete('/delete/:id', deleteEvent);

// GET - Admin retrieves all events
router.get('/', getAllEvents);

export default router;
