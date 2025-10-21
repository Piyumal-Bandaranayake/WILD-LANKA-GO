import express from 'express';
import { createActivity, getAllActivities, deleteActivity, updateActivity } from '../../controllers/Activity Management/Activitycontroller.js';
import multer from 'multer';
import path from 'path';

// Set up multer for image uploads (multiple images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store images in the 'uploads/activities' folder
    cb(null, './uploads/activities');
  },
  filename: function (req, file, cb) {
    // Set the file name with timestamp and original extension
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const isValidExtname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMimetype = allowedFileTypes.test(file.mimetype);

    if (isValidExtname && isValidMimetype) {
      return cb(null, true);  // Accept the file
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
    }
  }
});

const router = express.Router();

// POST - Create a new activity with image upload (multiple images allowed)
router.post('/create', upload.array('images', 5), createActivity);  // Allows up to 5 images

// GET - Fetch all activities
router.get('/', getAllActivities);

// DELETE - Delete an activity by its ID
router.delete('/:id', deleteActivity);

// PUT - Update an activity by its ID, with optional image upload (multiple images allowed)
router.put('/:id', upload.array('images', 5), updateActivity);  // Allows up to 5 images

export default router;
