import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getAnimalCases,
    getAnimalCaseById,
    createAnimalCase,
    updateAnimalCase,
    assignCaseToVet,
    deleteImageFromCase,
    getVetDashboardStats,
    getAllTreatments
} from '../../controllers/animalCare/animalCareController.js';
import {
    createTreatment,
    getTreatmentsByCase,
    updateTreatment,
    getTreatmentById,
    deleteTreatmentImage,
    generateTreatmentReport
} from '../../controllers/animalCare/treatmentController.js';
import flexibleAuth from '../../middleware/flexibleAuthMiddleware.js';
import { authorizeRoles } from '../../middleware/rolesMiddleware.js';

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for temporary file storage (Cloudinary will handle permanent storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
        }
    }
});

// Animal Case Routes
router.get('/', flexibleAuth, getAnimalCases);
router.get('/dashboard/stats', flexibleAuth, getVetDashboardStats);
router.get('/treatments', flexibleAuth, getAllTreatments);
router.get('/:id', flexibleAuth, getAnimalCaseById);
router.post('/', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), upload.array('images', 10), createAnimalCase);
router.put('/:id', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), upload.array('images', 10), updateAnimalCase);
router.put('/:id/with-images', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), upload.array('images', 10), updateAnimalCase);
router.put('/:id/assign', flexibleAuth, authorizeRoles('WildlifeOfficer', 'admin'), assignCaseToVet);
router.delete('/:id/images/:imageId', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), deleteImageFromCase);

// Treatment Routes
router.get('/:caseId/treatments', flexibleAuth, getTreatmentsByCase);
router.post('/:caseId/treatments', flexibleAuth, authorizeRoles('vet', 'admin'), upload.array('treatmentImages', 10), createTreatment);
router.get('/treatments/:id', flexibleAuth, getTreatmentById);
router.put('/treatments/:id', flexibleAuth, authorizeRoles('vet', 'admin'), upload.array('treatmentImages', 10), updateTreatment);
router.delete('/treatments/:id/images/:imageId', flexibleAuth, authorizeRoles('vet', 'admin'), deleteTreatmentImage);
router.get('/:caseId/treatments/report', flexibleAuth, generateTreatmentReport);

// Treatment Plan Routes
router.post('/treatment-plans', flexibleAuth, authorizeRoles('vet', 'admin'), (req, res) => {
  // For now, treatment plans are stored as treatments with special type
  const treatmentPlanData = {
    ...req.body,
    treatmentType: 'Treatment Plan',
    treatmentStatus: 'Planned'
  };
  req.body = treatmentPlanData;
  
  // Since createTreatment expects caseId in params, we need to handle it differently
  if (req.body.caseId) {
    req.params.caseId = req.body.caseId;
    createTreatment(req, res);
  } else {
    res.status(400).json({ message: 'Case ID is required for treatment plan' });
  }
});
router.get('/treatment-plans', flexibleAuth, getAllTreatments);

export default router;
