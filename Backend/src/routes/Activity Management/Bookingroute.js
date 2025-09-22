import express from 'express';
import { createBooking, getAllBookings, getBookingById } from '../../controllers/Activity Management/Bookingcontroller.js';

const router = express.Router();

// POST - Create a new booking
router.post('/create', createBooking);

// GET - Fetch all bookings (for officers/admins to manage)
router.get('/', getAllBookings);

// GET - Fetch a single booking by ID
router.get('/:id', getBookingById);

export default router;
