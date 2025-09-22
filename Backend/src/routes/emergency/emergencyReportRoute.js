import express from 'express';
import { generateEmergencyReport } from '../../controllers/emergency/emergencyReportController.js';

const router = express.Router();

// Endpoint to generate and download an emergency report (GET)
router.get('/generate/:case_id', generateEmergencyReport);

export default router;
