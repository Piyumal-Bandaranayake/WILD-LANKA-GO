const express = require('express');
const {
  createBookingCheckoutSession,
  recordBookingPayment,
  getBookingPaymentStatus
} = require('../controllers/bookingPaymentController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for booking payments
router.post('/create-checkout-session', optionalAuth, createBookingCheckoutSession);
router.post('/record-payment', optionalAuth, recordBookingPayment);

// Protected routes
router.use(authenticate);
router.get('/:bookingId/payment-status', getBookingPaymentStatus);

module.exports = router;
