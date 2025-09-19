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
    getVetDashboardStats
} from '../../controllers/animalCare/animalCareController.js';
import {
    createTreatment,
    getTreatmentsByCase,
    updateTreatment,
    getTreatmentById,
    deleteTreatmentImage,
    generateTreatmentReport
} from '../../controllers/animalCare/treatmentController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

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
router.get('/', auth0UserInfoMiddleware, getAnimalCases);
router.get('/dashboard/stats', auth0UserInfoMiddleware, getVetDashboardStats);
router.get('/:id', auth0UserInfoMiddleware, getAnimalCaseById);
router.post('/', auth0UserInfoMiddleware, upload.array('images', 10), createAnimalCase);
router.put('/:id', auth0UserInfoMiddleware, upload.array('images', 10), updateAnimalCase);
router.put('/:id/assign', auth0UserInfoMiddleware, assignCaseToVet);
router.delete('/:id/images/:imageId', auth0UserInfoMiddleware, deleteImageFromCase);

// Treatment Routes
router.get('/:caseId/treatments', auth0UserInfoMiddleware, getTreatmentsByCase);
router.post('/:caseId/treatments', auth0UserInfoMiddleware, upload.array('treatmentImages', 10), createTreatment);
router.get('/treatments/:id', auth0UserInfoMiddleware, getTreatmentById);
router.put('/treatments/:id', auth0UserInfoMiddleware, upload.array('treatmentImages', 10), updateTreatment);
router.delete('/treatments/:id/images/:imageId', auth0UserInfoMiddleware, deleteTreatmentImage);
router.get('/:caseId/treatments/report', auth0UserInfoMiddleware, generateTreatmentReport);

export default router;
