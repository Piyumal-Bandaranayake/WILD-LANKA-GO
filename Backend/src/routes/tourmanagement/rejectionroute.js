import express from 'express';
import { submitRejection } from '../../controllers/tourmanagement/rejectioncontroller.js';

const router = express.Router();

router.post('/submit', submitRejection); // POST /api/tour-rejection/submit

export default router;
