const Donation = require('../models/Donation');
const User = require('../models/User');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
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
 * Get all donations (Admin view)
 * GET /api/donations
 */
const getDonations = asyncHandler(async (req, res) => {
  const { status, purpose, page = 1, limit = 10, startDate, endDate } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  if (purpose) filter.purpose = purpose;
  
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const donations = await Donation.find(filter)
    .populate('donor', 'firstName lastName email phone')
    .populate('processedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Donation.countDocuments(filter);
  
  return sendSuccess(res, {
    donations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Donations retrieved successfully');
});

/**
 * Get single donation by ID
 * GET /api/donations/:id
 */
const getDonationById = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)
    .populate('donor', 'firstName lastName email phone')
    .populate('processedBy', 'firstName lastName email');
  
  if (!donation) {
    return sendNotFound(res, 'Donation not found');
  }
  
  return sendSuccess(res, { donation }, 'Donation retrieved successfully');
});

/**
 * Create new donation
 * POST /api/donations
 */
const createDonation = asyncHandler(async (req, res) => {
  const {
    amount,
    currency = 'LKR',
    paymentMethod = 'cash',
    purpose,
    cause, // Allow 'cause' as an alias for 'purpose'
    message,
    isAnonymous = false,
    donorName,
    donorEmail
  } = req.body;
  
  // Use 'cause' if provided, otherwise use 'purpose'
  const finalPurpose = cause || purpose || 'General Support';
  
  const donation = new Donation({
    donor: req.user._id,
    amount: parseFloat(amount),
    currency,
    paymentMethod,
    purpose: finalPurpose,
    message: message || '',
    isAnonymous,
    donorName: donorName || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
    donorEmail: donorEmail || req.user.email,
    createdBy: req.user._id,
    status: 'completed' // Auto-complete donations for now (no payment gateway integration)
  });
  
  await donation.save();
  
  await donation.populate('donor', 'firstName lastName email');
  
  logger.info(`New donation created: Rs. ${amount} for ${finalPurpose} by ${req.user.email}`);
  
  // Format the response to match frontend expectations
  const formattedDonation = {
    _id: donation._id,
    amount: donation.amount,
    cause: donation.purpose,
    message: donation.message,
    date: donation.createdAt,
    status: donation.status,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    receiptNumber: donation.receiptNumber
  };
  
  return sendSuccess(res, { 
    donation: formattedDonation,
    message: 'Thank you for your donation! Your contribution helps protect Sri Lanka\'s wildlife.'
  }, 'Donation created successfully', 201);
});

/**
 * Update donation status
 * PUT /api/donations/:id/status
 */
const updateDonationStatus = asyncHandler(async (req, res) => {
  const { status, paymentDetails } = req.body;
  
  const donation = await Donation.findById(req.params.id);
  
  if (!donation) {
    return sendNotFound(res, 'Donation not found');
  }
  
  if (status === 'completed') {
    await donation.markCompleted(paymentDetails);
  } else if (status === 'failed') {
    await donation.markFailed(paymentDetails?.failureReason);
  } else {
    donation.status = status;
    donation.processedBy = req.user._id;
    await donation.save();
  }
  
  await donation.populate('donor processedBy', 'firstName lastName email');
  
  logger.info(`Donation status updated: ${donation._id} -> ${status} by ${req.user.email}`);
  
  return sendSuccess(res, { donation }, 'Donation status updated successfully');
});

/**
 * Get donation statistics
 * GET /api/donations/statistics
 */
const getDonationStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const statistics = await Donation.getStatistics(startDate, endDate);
  
  return sendSuccess(res, { statistics }, 'Donation statistics retrieved successfully');
});

/**
 * Get recent donations
 * GET /api/donations/recent
 */
const getRecentDonations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const donations = await Donation.findRecent(parseInt(limit));
  
  return sendSuccess(res, { donations }, 'Recent donations retrieved successfully');
});

/**
 * Get user's donations (Tourist view)
 * GET /api/donations/my-donations
 */
const getMyDonations = asyncHandler(async (req, res) => {
  console.log('🔍 getMyDonations called - User ID:', req.user._id, 'Email:', req.user.email);
  const { page = 1, limit = 50 } = req.query; // Increased default limit from 10 to 50
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Find donations by user ID first
  let donations = await Donation.findByDonor(req.user._id)
    .skip(skip)
    .limit(parseInt(limit));
  
  // If no donations found by userId, try to find by email (fallback for donations with null donor)
  if (donations.length === 0) {
    console.log('🔍 getMyDonations - No donations found by userId, trying email lookup...');
    const donationsByEmail = await Donation.find({ 
      donorEmail: req.user.email,
      donor: null // Only get donations that weren't properly linked
    }).skip(skip).limit(parseInt(limit));
    
    if (donationsByEmail.length > 0) {
      // Update these donations to link them to the current user
      console.log('🔍 getMyDonations - Updating donations to link to user...');
      await Donation.updateMany(
        { _id: { $in: donationsByEmail.map(d => d._id) } },
        { donor: req.user._id, createdBy: req.user._id }
      );
      console.log('🔍 getMyDonations - Updated donations linked to user');
      
      // Fetch the updated donations
      donations = await Donation.findByDonor(req.user._id)
        .skip(skip)
        .limit(parseInt(limit));
    }
  }
  
  // Calculate total including both linked and unlinked donations by email
  const totalByUserId = await Donation.countDocuments({ donor: req.user._id });
  const totalByEmail = await Donation.countDocuments({ 
    donorEmail: req.user.email,
    donor: null 
  });
  const total = totalByUserId + totalByEmail;
  
  // Format donations for frontend compatibility
  const formattedDonations = donations.map(donation => ({
    _id: donation._id,
    amount: donation.amount,
    cause: donation.purpose,
    message: donation.message,
    date: donation.createdAt,
    status: donation.status,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    receiptNumber: donation.receiptNumber,
    currency: donation.currency
  }));
  
  console.log('🔍 getMyDonations - Returning', formattedDonations.length, 'donations out of', total, 'total');
  
  return sendSuccess(res, {
    data: formattedDonations, // Frontend expects data.data or data
    donations: formattedDonations, // Also provide as donations for compatibility
    count: formattedDonations.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Your donations retrieved successfully');
});

/**
 * Create Stripe Checkout Session
 * POST /api/donations/create-checkout-session
 */
const createStripeCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    return sendError(res, 'Stripe is not configured on the server', 500);
  }

  const { amount, currency = 'lkr', donorEmail, donorName, isMonthly, message, cause } = req.body || {};

  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return sendError(res, 'Invalid amount', 400);
  }

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // If an unsupported currency like LKR is passed, fall back to USD (for testing)
  const requestedCurrency = String(currency).toLowerCase();
  const effectiveCurrency = requestedCurrency === 'lkr' ? 'usd' : requestedCurrency;

  // Stripe expects zero-decimal currency amounts without multiplying by 100
  const zeroDecimalCurrencies = new Set(['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','vuv','xaf','xof','xpf']);
  const isZeroDecimal = zeroDecimalCurrencies.has(effectiveCurrency);
  const unitAmount = isZeroDecimal ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: donorEmail,
      locale: 'en', // Explicitly set locale to avoid localization issues
      line_items: [
        {
          price_data: {
            currency: effectiveCurrency,
            unit_amount: unitAmount,
            product_data: {
              name: `Donation - ${isMonthly ? 'Monthly' : 'One-time'}`,
              description: (
                (message || 'Wild Lanka Go Donation') +
                (donorName ? ` • Donor: ${donorName}` : '') +
                (requestedCurrency === 'lkr' ? ` • Original currency: LKR ${Number(amount).toLocaleString()}` : '')
              ),
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendBaseUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/donation?canceled=1`,
      metadata: {
        donorEmail: donorEmail || '',
        donorName: donorName || '',
        isMonthly: String(!!isMonthly),
        message: message || '',
        cause: cause || '',
      },
      // Add billing address collection for better compliance
      billing_address_collection: 'auto',
      // Add automatic tax calculation if needed
      automatic_tax: { enabled: false },
    });

    return sendSuccess(res, { id: session.id, url: session.url }, 'Checkout session created');
  } catch (err) {
    // Log server-side for diagnosis
    logger.error(`Stripe session creation failed: ${err.message}`);
    return sendError(res, err?.message || 'Failed to create Stripe session', 500);
  }
});

/**
 * Record a donation in DB from a Stripe Checkout session
 * POST /api/donations/record-from-session
 */
const recordDonationFromSession = asyncHandler(async (req, res) => {
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

  const donorEmail = session.customer_details?.email || session.customer_email;
  const donorName = session.customer_details?.name || session.metadata?.donorName || '';
  const currency = String(session.currency || 'usd').toUpperCase();
  const zeroDecimalCurrencies = new Set(['BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);
  const divisor = zeroDecimalCurrencies.has(currency) ? 1 : 100;
  const amount = (session.amount_total || 0) / divisor;

  // Try to map to current user; fallback to user by email
  let donorId = req.user?._id;
  console.log('🔍 recordDonationFromSession - req.user:', req.user ? { id: req.user._id, email: req.user.email } : 'No user');
  console.log('🔍 recordDonationFromSession - donorEmail:', donorEmail);
  
  if (!donorId && donorEmail) {
    const existingUser = await User.findOne({ email: donorEmail });
    donorId = existingUser?._id;
    console.log('🔍 recordDonationFromSession - Found user by email:', existingUser ? { id: existingUser._id, email: existingUser.email } : 'No user found');
  }
  
  console.log('🔍 recordDonationFromSession - Final donorId:', donorId);

  // Check if donation already exists for this session
  const existingDonation = await Donation.findOne({ 
    'paymentDetails.sessionId': sessionId 
  });
  
  if (existingDonation) {
    console.log('🔍 recordDonationFromSession - Donation already exists for session:', sessionId);
    return sendSuccess(res, { donationId: existingDonation._id }, 'Donation already recorded');
  }

  const donation = new Donation({
    donor: donorId || undefined,
    amount,
    currency,
    paymentMethod: 'stripe',
    purpose: session.metadata?.isMonthly === 'true' ? 'Monthly Donation' : 'General Support',
    message: session.metadata?.message || '',
    isAnonymous: !donorName && !donorEmail,
    donorName: donorName || 'Anonymous',
    donorEmail: donorEmail || '',
    createdBy: donorId || undefined,
    status: 'completed',
    paymentDetails: {
      gateway: 'stripe',
      transactionId: session.payment_intent || session.id,
      sessionId: session.id,
    }
  });

  console.log('🔍 recordDonationFromSession - Saving donation with donorId:', donorId);
  console.log('🔍 recordDonationFromSession - Donation object before save:', {
    donor: donation.donor,
    donorEmail: donation.donorEmail,
    donorName: donation.donorName
  });

  try {
    await donation.save();
    
    console.log('🔍 recordDonationFromSession - Donation saved with ID:', donation._id);
    console.log('🔍 recordDonationFromSession - Final donation donor field:', donation.donor);

    return sendSuccess(res, { donationId: donation._id }, 'Donation recorded');
  } catch (saveError) {
    console.error('🔍 recordDonationFromSession - Error saving donation:', saveError);
    
    // If it's a duplicate key error, try to find the existing donation
    if (saveError.code === 11000) {
      console.log('🔍 recordDonationFromSession - Duplicate key detected:', saveError.keyPattern);
      
      // Check if it's a duplicate sessionId
      if (saveError.keyPattern?.['paymentDetails.sessionId']) {
        console.log('🔍 recordDonationFromSession - Duplicate sessionId detected, finding existing donation');
        
        const existingDonation = await Donation.findOne({ 
          'paymentDetails.sessionId': sessionId 
        });
        
        if (existingDonation) {
          console.log('🔍 recordDonationFromSession - Found existing donation for session:', existingDonation._id);
          return sendSuccess(res, { donationId: existingDonation._id }, 'Donation already recorded');
        }
      }
      
      // Check if it's a duplicate receipt number
      if (saveError.keyPattern?.receiptNumber) {
        console.log('🔍 recordDonationFromSession - Duplicate receipt number detected, checking for existing donation');
        
        // Try to find if there's already a donation for this session
        const existingDonation = await Donation.findOne({ 
          'paymentDetails.sessionId': sessionId 
        });
        
        if (existingDonation) {
          console.log('🔍 recordDonationFromSession - Found existing donation for session:', existingDonation._id);
          return sendSuccess(res, { donationId: existingDonation._id }, 'Donation already recorded');
        }
      }
    }
    
    // Re-throw the error if we can't handle it
    throw saveError;
  }
});

/**
 * Process donation payment
 * POST /api/donations/:id/process
 */
const processDonationPayment = asyncHandler(async (req, res) => {
  const { paymentId, gateway, transactionId, processingFee } = req.body;
  
  const donation = await Donation.findById(req.params.id);
  
  if (!donation) {
    return sendNotFound(res, 'Donation not found');
  }
  
  if (donation.status !== 'pending') {
    return sendError(res, 'Donation is not in pending status', 400);
  }
  
  try {
    // Here you would integrate with payment gateway
    // For now, we'll simulate successful payment processing
    
    await donation.markCompleted({
      gateway,
      transactionId,
      paymentId,
      processingFee: processingFee || 0
    });
    
    await donation.populate('donor', 'firstName lastName email');
    
    logger.info(`Donation payment processed: ${donation._id} - $${donation.amount}`);
    
    return sendSuccess(res, { 
      donation,
      message: 'Payment processed successfully'
    }, 'Donation payment processed successfully');
    
  } catch (error) {
    await donation.markFailed(error.message);
    
    logger.error(`Donation payment failed: ${donation._id} - ${error.message}`);
    
    return sendError(res, 'Payment processing failed', 400);
  }
});

/**
 * Delete donation (Admin only)
 * DELETE /api/donations/:id
 */
const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  
  if (!donation) {
    return sendNotFound(res, 'Donation not found');
  }
  
  if (donation.status === 'completed') {
    return sendError(res, 'Cannot delete completed donation', 400);
  }
  
  await Donation.findByIdAndDelete(req.params.id);
  
  logger.info(`Donation deleted: ${donation._id} by ${req.user.email}`);
  
  return sendSuccess(res, null, 'Donation deleted successfully');
});

module.exports = {
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
};
