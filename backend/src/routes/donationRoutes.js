const express = require('express');
const {
  getDonations,
  getDonationById,
  createDonation,
  updateDonationStatus,
  getDonationStatistics,
  getRecentDonations,
  getMyDonations,
  processDonationPayment,
  createStripeCheckoutSession,
  recordDonationFromSession,
  deleteDonation
} = require('../controllers/donationController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const {
  // imported above: createStripeCheckoutSession
} = require('../controllers/donationController');

const router = express.Router();

// Public routes
router.get('/recent', getRecentDonations);
router.post('/create-checkout-session', createStripeCheckoutSession);
// Public endpoint: fetch session info (used by success page)
router.get('/session/:id', async (req, res, next) => {
  try {
    const { sendSuccess, sendError } = require('../utils/response');
    const logger = require('../../config/logger');
    const donationCtrl = require('../controllers/donationController');
    const stripeInstance = (donationCtrl.__stripe || null);
    // Access stripe via require to avoid circular export; fallback to direct require using same key logic
    let stripeLocal = stripeInstance;
    if (!stripeLocal) {
      const fallbackStripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51SAwZY2NwRD0CNlVxEb73vTp03j0VLmaqR7w64zfBIeQ8Cxjc1L2Tqs27ryPfNntKi3uO3X2RL3E0oyFODcpD7630014JfLYrR';
      stripeLocal = require('stripe')(fallbackStripeKey);
    }
    const session = await stripeLocal.checkout.sessions.retrieve(req.params.id);
    return sendSuccess(res, { session }, 'Stripe session retrieved');
  } catch (err) {
    const { sendError } = require('../utils/response');
    return sendError(res, err?.message || 'Failed to fetch Stripe session', 500);
  }
});

// Public: record donation in DB from Stripe session (user is matched by email)
// Use optionalAuth to handle both logged in and logged out users
router.post('/record-from-session', optionalAuth, recordDonationFromSession);

// Protected routes (require authentication)
router.use(authenticate);

// Tourist routes
router.get('/my-donations', authorize('tourist'), getMyDonations);
router.post('/', authorize('tourist'), validate(schemas.donationCreation), createDonation);
router.post('/:id/process', authorize('tourist'), processDonationPayment);

// Admin and Wildlife Officer routes
router.get('/statistics', authorize('admin', 'wildlifeOfficer'), getDonationStatistics);
router.get('/', authorize('admin', 'wildlifeOfficer'), getDonations);
router.get('/:id', authorize('admin', 'wildlifeOfficer'), getDonationById);
router.put('/:id/status', authorize('admin', 'wildlifeOfficer'), updateDonationStatus);
router.delete('/:id', authorize('admin'), deleteDonation);

module.exports = router;
