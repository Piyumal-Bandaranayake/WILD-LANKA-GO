const Booking = require('../models/Booking');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { sendSuccess, sendError, sendBadRequest } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

let stripe = null;
try {
  // Lazy-init Stripe to avoid requiring it if not installed yet
  const fallbackStripeKey = 'sk_test_51SAwZY2NwRD0CNlVxEb73vTp03j0VLmaqR7w64zfBIeQ8Cxjc1L2Tqs27ryPfNntKi3uO3X2RL3E0oyFODcpD7630014JfLYrR';
  const stripeSecret = process.env.STRIPE_SECRET_KEY || fallbackStripeKey;
  if (stripeSecret) {
    // eslint-disable-next-line global-require
    stripe = require('stripe')(stripeSecret);
  }
} catch (e) {
  // Stripe not installed or misconfigured; we'll handle gracefully in the route
  stripe = null;
}

/**
 * Create Stripe checkout session for booking payment
 * POST /api/bookings/create-checkout-session
 */
const createBookingCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    return sendError(res, 'Stripe is not configured on the server', 500);
  }

  const {
    bookingId,
    amount,
    currency = 'lkr',
    customerName,
    customerEmail,
    activityTitle,
    bookingDate,
    participants
  } = req.body;

  if (!bookingId || !amount || !customerEmail) {
    return sendBadRequest(res, 'Booking ID, amount, and customer email are required');
  }

  // Find the booking
  const booking = await Booking.findOne({ bookingId }).populate('customer');
  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  // Check if booking is already paid
  if (booking.payment.status === 'paid') {
    return sendError(res, 'Booking is already paid', 400);
  }

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Handle currency conversion for Stripe
  const requestedCurrency = currency.toLowerCase();
  const effectiveCurrency = requestedCurrency === 'lkr' ? 'usd' : requestedCurrency;
  const isZeroDecimal = ['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','vuv','xaf','xof','xpf'].includes(effectiveCurrency);
  const unitAmount = isZeroDecimal ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: customerEmail,
      locale: 'en',
      line_items: [
        {
          price_data: {
            currency: effectiveCurrency,
            unit_amount: unitAmount,
            product_data: {
              name: `Activity Booking - ${activityTitle}`,
              description: (
                `Activity: ${activityTitle} on ${new Date(bookingDate).toLocaleDateString()} • Participants: ${participants}` +
                (customerName ? ` • Customer: ${customerName}` : '') +
                (requestedCurrency === 'lkr' ? ` • Original currency: LKR ${Number(amount).toLocaleString()}` : '')
              ),
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendBaseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/activities?canceled=1`,
      metadata: {
        bookingId: bookingId,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        activityTitle: activityTitle || '',
        bookingDate: bookingDate || '',
        participants: participants || '',
        originalCurrency: requestedCurrency,
        originalAmount: amount.toString(),
      },
      billing_address_collection: 'auto',
      automatic_tax: { enabled: false },
    });

    // Update booking with session ID
    booking.payment.transactionId = session.id;
    await booking.save();

    logger.info(`Booking checkout session created: ${session.id} for booking ${bookingId}`);

    return sendSuccess(res, { id: session.id, url: session.url }, 'Booking checkout session created');
  } catch (err) {
    logger.error(`Stripe booking session creation failed: ${err.message}`);
    return sendError(res, err?.message || 'Failed to create booking checkout session', 500);
  }
});

/**
 * Record booking payment from Stripe session
 * POST /api/bookings/record-payment
 */
const recordBookingPayment = asyncHandler(async (req, res) => {
  if (!stripe) {
    return sendError(res, 'Stripe is not configured on the server', 500);
  }

  const { sessionId } = req.body || {};
  if (!sessionId) {
    return sendError(res, 'sessionId is required', 400);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session || session.payment_status !== 'paid') {
    return sendError(res, 'Session not paid or not found', 400);
  }

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    return sendError(res, 'Booking ID not found in session metadata', 400);
  }

  // Find the booking
  const booking = await Booking.findOne({ bookingId });
  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  // Check if booking is already paid
  if (booking.payment.status === 'paid') {
    return sendSuccess(res, { bookingId: booking._id }, 'Booking payment already recorded');
  }

  const currency = String(session.currency || 'usd').toUpperCase();
  const zeroDecimalCurrencies = new Set(['BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);
  const divisor = zeroDecimalCurrencies.has(currency) ? 1 : 100;
  const amount = (session.amount_total || 0) / divisor;

  // Update booking payment status
  booking.payment.status = 'paid';
  booking.payment.method = 'card';
  booking.payment.transactionId = session.payment_intent || session.id;
  booking.payment.paidAmount = amount;
  booking.payment.paymentDate = new Date();
  booking.status = 'confirmed';

  await booking.save();

  logger.info(`Booking payment recorded: ${bookingId} - Amount: ${amount} ${currency}`);

  return sendSuccess(res, { bookingId: booking._id }, 'Booking payment recorded');
});

/**
 * Get booking payment status
 * GET /api/bookings/:bookingId/payment-status
 */
const getBookingPaymentStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findOne({ bookingId }).populate('customer', 'firstName lastName email');
  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  return sendSuccess(res, {
    bookingId: booking.bookingId,
    status: booking.status,
    paymentStatus: booking.payment.status,
    paidAmount: booking.payment.paidAmount,
    totalPrice: booking.pricing.totalPrice,
    currency: booking.pricing.currency,
    customer: booking.customer
  }, 'Booking payment status retrieved');
});

module.exports = {
  createBookingCheckoutSession,
  recordBookingPayment,
  getBookingPaymentStatus
};
