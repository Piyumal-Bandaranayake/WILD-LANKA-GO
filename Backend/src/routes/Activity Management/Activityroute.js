import express from 'express';
import { createActivity, getAllActivities, deleteActivity, updateActivity, uploadActivityImage } from '../../controllers/Activity Management/Activitycontroller.js';
import upload from '../../utils/multerConfig.js';

const router = express.Router();

// POST - Create a new activity with image upload
router.post('/create', upload.single('image'), createActivity);

// GET - Fetch all activities
router.get('/', getAllActivities);

// DELETE - Delete an activity by its ID
router.delete('/:id', deleteActivity);

// PUT - Update an activity by its ID, with optional image upload
router.put('/:id', upload.single('image'), updateActivity);  // Handles both activity and image update


export default router;
