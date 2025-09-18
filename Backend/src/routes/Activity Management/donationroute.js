import express from 'express';
import {
    makeDonation,
    getDonationHistory,
    getAllDonations,
    updateDonationMessage,
} from '../../controllers/Activity Management/donationcontroller.js';

const router = express.Router();

// GET - Get all donations (for public display)
router.get('/', getAllDonations);

// POST - User makes a donation
router.post('/', makeDonation);

// GET - User can view their donation history
router.get('/history/:userId', getDonationHistory);

// GET - Admin can view all donations made by all users
router.get('/all', getAllDonations);

// PUT - User can update their donation message
router.put('/:id', updateDonationMessage);

export default router;
