import express from 'express';
import { makeDonation, getDonationHistory, getAllDonations ,updateDonationMessage} from '../../controllers/Activity Management/donationcontroller.js';

const router = express.Router();

// POST - Tourist makes a donation
router.post('/donate', makeDonation);

// GET - Tourist can view their donation history
router.get('/history/:touristId', getDonationHistory);

// GET - Admin can view all donations made by all tourists
router.get('/all', getAllDonations);

// PUT - Tourist can update their donation message
router.put('/update/:id', updateDonationMessage);

export default router;
