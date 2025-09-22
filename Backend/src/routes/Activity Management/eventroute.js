import express from 'express';
import { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById } from '../../controllers/Activity Management/eventcontroller.js';
import multer from 'multer';
import path from 'path';

// Set up multer for image uploads (multiple images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store images in the 'uploads/events' folder
    cb(null, './uploads/events');
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

// POST - Admin creates a new event with image upload (multiple images allowed)
router.post('/create', upload.array('images', 5), createEvent);  // Allows up to 5 images

// PUT - Admin updates an existing event (including image upload, multiple images allowed)
router.put('/update/:id', upload.array('images', 5), updateEvent);  // Allows up to 5 images

// DELETE - Admin deletes an event
router.delete('/delete/:id', deleteEvent);

// GET - Admin retrieves all events
router.get('/', getAllEvents);

// GET - Admin retrieves a specific event by ID
router.get('/:id', getEventById);  // Get a specific event by ID

export default router;
