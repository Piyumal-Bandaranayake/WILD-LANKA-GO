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
    getAllTreatments,
    deleteAnimalCase
} from '../../controllers/animalCare/animalCareController.js';
import {
    createTreatment,
    getTreatmentsByCase,
    updateTreatment,
    getTreatmentById,
    deleteTreatmentImage,
    generateTreatmentReport
} from '../../controllers/animalCare/treatmentController.js';

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
router.get('/', getAnimalCases);
router.get('/dashboard/stats', getVetDashboardStats);
router.get('/treatments', getAllTreatments);
router.post('/', upload.array('images', 10), createAnimalCase);
router.put('/:id', upload.array('images', 10), updateAnimalCase);
router.put('/:id/assign', assignCaseToVet);
router.delete('/:id/images/:imageId', deleteImageFromCase);
router.delete('/:id', deleteAnimalCase);
router.get('/:id', getAnimalCaseById);

// Treatment Routes
router.get('/:caseId/treatments', getTreatmentsByCase);
router.post('/:caseId/treatments', upload.array('treatmentImages', 10), createTreatment);
router.get('/treatments/:id', getTreatmentById);
router.put('/treatments/:id', upload.array('treatmentImages', 10), updateTreatment);
router.delete('/treatments/:id/images/:imageId', deleteTreatmentImage);
router.get('/:caseId/treatments/report', generateTreatmentReport);

export default router;
