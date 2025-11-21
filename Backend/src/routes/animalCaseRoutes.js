const express = require('express');
const {
  getAnimalCases,
  getAnimalCaseById,
  createAnimalCase,
  createAnimalCaseWithImages,
  updateAnimalCase,
  deleteAnimalCase,
  getVetDashboardStats,
  // Treatment functions
  createTreatment,
  getTreatmentsByCase,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment
} = require('../controllers/animalCaseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadMultiple, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// Get vet dashboard stats
router.get('/dashboard/stats', authenticate, authorize('vet', 'admin'), getVetDashboardStats);

// Resolve image URL - find actual filename for stored URL
router.get('/resolve-image/:filename', authenticate, authorize('vet', 'admin', 'wildlifeOfficer'), require('../controllers/animalCaseController').resolveImageUrl);

// Get all animal cases
router.get('/', authenticate, authorize('vet', 'admin', 'wildlifeOfficer'), getAnimalCases);

// Get animal case by ID
router.get('/:id', authenticate, authorize('vet', 'admin', 'wildlifeOfficer'), getAnimalCaseById);

// Create new animal case (without images)
router.post('/', 
  authenticate, 
  authorize('vet', 'admin'), 
  createAnimalCase
);

// Create new animal case with images
router.post('/with-images',
  authenticate,
  authorize('vet', 'admin'),
  uploadMultiple('images', 10), // Allow up to 10 images like events
  uploadToCloudinary,
  createAnimalCaseWithImages
);

// Update animal case
router.put('/:id', 
  authenticate, 
  authorize('vet', 'admin'), 
  updateAnimalCase
);

// Update animal case with images
router.put('/:id/with-images',
  authenticate,
  authorize('vet', 'admin'),
  uploadMultiple('images', 10),
  uploadToCloudinary,
  updateAnimalCase
);

// Delete animal case
router.delete('/:id', 
  authenticate, 
  authorize('vet', 'admin'), 
  deleteAnimalCase
);

// Treatment routes

// Create treatment for animal case
router.post('/:caseId/treatments',
  authenticate,
  authorize('vet', 'admin'),
  createTreatment
);

// Get treatments for a specific case
router.get('/:caseId/treatments',
  authenticate,
  authorize('vet', 'admin', 'wildlifeOfficer'),
  getTreatmentsByCase
);

// Get all treatments
router.get('/treatments',
  authenticate,
  authorize('vet', 'admin', 'wildlifeOfficer'),
  getTreatments
);

// Get treatment by ID
router.get('/treatments/:id',
  authenticate,
  authorize('vet', 'admin', 'wildlifeOfficer'),
  getTreatmentById
);

// Update treatment
router.put('/treatments/:id',
  authenticate,
  authorize('vet', 'admin'),
  updateTreatment
);

// Delete treatment
router.delete('/treatments/:id',
  authenticate,
  authorize('vet', 'admin'),
  deleteTreatment
);

module.exports = router;
