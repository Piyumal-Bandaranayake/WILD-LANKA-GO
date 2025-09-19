import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    unique: true,
  },
  donor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For anonymous or guest donations
    guestInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      country: { type: String },
    },
    isAnonymous: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false },
  },
  amount: {
    value: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'LKR' },
    exchangeRate: { type: Number, default: 1 }, // For foreign currencies
    amountInLKR: { type: Number }, // Converted amount
  },
  donationType: {
    type: String,
    enum: ['One-time', 'Monthly', 'Annual', 'Memorial', 'Corporate', 'Emergency'],
    default: 'One-time',
  },
  category: {
    type: String,
    enum: [
      'General Wildlife Conservation',
      'Animal Medical Treatment',
      'Habitat Restoration',
      'Anti-Poaching Operations',
      'Research Programs',
      'Education Programs',
      'Equipment Purchase',
      'Emergency Fund',
      'Specific Animal Sponsorship',
      'Other'
    ],
    default: 'General Wildlife Conservation',
  },
  purpose: {
    title: { type: String },
    description: { type: String },
    targetAmount: { type: Number },
    currentAmount: { type: Number, default: 0 },
  },
  message: {
    personalMessage: { type: String, maxlength: 1000 },
    isPublic: { type: Boolean, default: false },
    dedicatedTo: { type: String }, // Memorial donations
  },
  payment: {
    method: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Mobile Payment', 'Cash', 'Cheque'],
      required: true,
    },
    transactionId: { type: String, unique: true },
    gatewayTransactionId: { type: String },
    gateway: { type: String }, // PayPal, Stripe, local gateway
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    paidAt: { type: Date },
    failureReason: { type: String },
    refund: {
      amount: { type: Number, default: 0 },
      reason: { type: String },
      refundedAt: { type: Date },
      refundTransactionId: { type: String },
    },
  },
  receipt: {
    receiptNumber: { type: String, unique: true },
    issued: { type: Boolean, default: false },
    issuedAt: { type: Date },
    receiptUrl: { type: String }, // PDF receipt URL
    taxDeductible: { type: Boolean, default: true },
    fiscalYear: { type: String },
  },
  communication: {
    acknowledgmentSent: { type: Boolean, default: false },
    acknowledgmentSentAt: { type: Date },
    thankYouEmailSent: { type: Boolean, default: false },
    newsletterOptIn: { type: Boolean, default: false },
    followUpEmailsSent: { type: Number, default: 0 },
    lastContactDate: { type: Date },
  },
  recurringDetails: {
    isRecurring: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Annually'],
    },
    nextDonationDate: { type: Date },
    totalRecurringDonations: { type: Number, default: 0 },
    recurringDonationIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    }],
    isActive: { type: Boolean, default: true },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  campaign: {
    campaignId: { type: String },
    campaignName: { type: String },
    source: { type: String }, // Website, email, social media, etc.
    medium: { type: String }, // Campaign medium
    referrer: { type: String },
  },
  corporateDetails: {
    isCorporateDonation: { type: Boolean, default: false },
    companyName: { type: String },
    registrationNumber: { type: String },
    contactPerson: { type: String },
    taxIdNumber: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
  },
  utilization: {
    allocated: { type: Boolean, default: false },
    allocatedTo: [{
      project: { type: String },
      amount: { type: Number },
      allocatedAt: { type: Date },
      description: { type: String },
    }],
    impactReport: {
      reported: { type: Boolean, default: false },
      reportUrl: { type: String },
      reportSentAt: { type: Date },
      description: { type: String },
    },
  },
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceType: { type: String },
    location: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
    },
    timezone: { type: String },
  },
  adminNotes: [{
    note: { type: String },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: { type: Date, default: Date.now },
  }],
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: { type: Date },
    flagged: { type: Boolean, default: false },
    flaggedReason: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to generate donation ID and receipt number
donationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastDonation = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastDonation && lastDonation.donationId) {
      const lastId = parseInt(lastDonation.donationId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.donationId = `DON-${String(nextId).padStart(6, '0')}`;
    
    // Generate receipt number
    const year = new Date().getFullYear();
    this.receipt.receiptNumber = `RCP-${year}-${String(nextId).padStart(6, '0')}`;
    this.receipt.fiscalYear = year.toString();
  }
  
  // Convert amount to LKR if needed
  if (this.amount.currency !== 'LKR') {
    this.amount.amountInLKR = this.amount.value * this.amount.exchangeRate;
  } else {
    this.amount.amountInLKR = this.amount.value;
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.currency} ${this.amount.value.toLocaleString()}`;
});

// Virtual for tax-deductible amount
donationSchema.virtual('taxDeductibleAmount').get(function() {
  return this.receipt.taxDeductible ? this.amount.amountInLKR : 0;
});

// Indexes for better performance
donationSchema.index({ 'donor.userId': 1 });
donationSchema.index({ donationType: 1 });
donationSchema.index({ category: 1 });
donationSchema.index({ 'payment.status': 1 });
donationSchema.index({ 'payment.transactionId': 1 });
donationSchema.index({ 'receipt.receiptNumber': 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ 'amount.amountInLKR': -1 });
donationSchema.index({ 'recurringDetails.isRecurring': 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;