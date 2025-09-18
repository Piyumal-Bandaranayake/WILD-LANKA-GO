import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createAnimalCase,
  getAnimalCaseById,
  getAllAnimalCases,
  updateAnimalCase,
  deleteAnimalCase,
  generateCaseReport
} from '../../controllers/Animal care Management/animalCaseController.js';


const router = express.Router();

// Multer configuration for file uploads (image handling)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    cb(null, 'uploads/animal-cases/'); // Set upload folder to 'uploads/animal-cases'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set filename to current timestamp
  }
});
const upload = multer({ storage });

// Create a new animal case
router.post('/cases', upload.array('photosDocumentation'), createAnimalCase);

// Get a specific animal case by ID
router.get('/cases/:id', getAnimalCaseById);

// Get all animal cases with optional filters for priority and status
router.get('/cases', getAllAnimalCases);

// Update an existing animal case (including animal data or photos)
router.put('/cases/:id', upload.array('photosDocumentation'), updateAnimalCase);

// Delete an animal case
router.delete('/cases/:id', deleteAnimalCase);

router.get('/cases/report/:id', generateCaseReport);

export default router;
