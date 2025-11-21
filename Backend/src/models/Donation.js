const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous donations
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [1, 'Donation amount must be at least $1'],
  },
  currency: {
    type: String,
    default: 'LKR',
    enum: ['USD', 'LKR', 'EUR', 'GBP'],
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'stripe'],
    required: [true, 'Payment method is required'],
  },
  paymentId: {
    type: String, // Payment gateway transaction ID
    sparse: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  purpose: {
    type: String,
    enum: [
      'general', 
      'wildlife_conservation', 
      'habitat_restoration', 
      'animal_rescue', 
      'education', 
      'research',
      // New causes from frontend form
      'Wildlife Conservation',
      'Habitat Protection', 
      'Anti-Poaching Efforts',
      'Research & Education',
      'Community Development',
      'Emergency Wildlife Rescue',
      'Park Maintenance',
      'General Support',
      'Monthly Donation'
    ],
    default: 'General Support',
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  
  // Donor information (for display purposes)
  donorName: {
    type: String,
    trim: true,
  },
  donorEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  taxDeductible: {
    type: Boolean,
    default: true,
  },
  
  // Payment details
  paymentDetails: {
    gateway: String, // stripe, paypal, etc.
    transactionId: String,
    sessionId: String, // Add sessionId field for Stripe sessions
    paymentDate: Date,
    processingFee: {
      type: Number,
      default: 0,
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
}, {
  timestamps: true,
});

// Indexes
donationSchema.index({ donor: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ purpose: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ amount: 1 });
donationSchema.index({ 'paymentDetails.sessionId': 1 }, { unique: true, sparse: true });

// Pre-save middleware to generate receipt number
donationSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed' && !this.receiptNumber) {
    const year = new Date().getFullYear();
    
    // Generate unique receipt number with retry logic
    let receiptNumber;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      // Use a more robust approach: get the highest existing receipt number for this year
      const lastDonation = await this.constructor.findOne({
        receiptNumber: { $regex: `^WLG-${year}-` },
        status: 'completed'
      }).sort({ receiptNumber: -1 });
      
      let nextNumber = 1;
      if (lastDonation && lastDonation.receiptNumber) {
        const lastNumber = parseInt(lastDonation.receiptNumber.split('-')[2]);
        nextNumber = lastNumber + 1 + attempts;
      } else {
        nextNumber = 1 + attempts;
      }
      
      receiptNumber = `WLG-${year}-${String(nextNumber).padStart(6, '0')}`;
      
      // Double-check if this receipt number already exists
      const existing = await this.constructor.findOne({ receiptNumber });
      if (!existing) {
        break;
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based receipt number with additional randomness
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      receiptNumber = `WLG-${year}-${timestamp}${random}`;
    }
    
    this.receiptNumber = receiptNumber;
  }
  next();
});

// Instance method to mark as completed
donationSchema.methods.markCompleted = function(paymentDetails) {
  this.status = 'completed';
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails,
    paymentDate: new Date()
  };
  return this.save();
};

// Instance method to mark as failed
donationSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.paymentDetails = {
    ...this.paymentDetails,
    failureReason: reason
  };
  return this.save();
};

// Static method to get donation statistics
donationSchema.statics.getStatistics = async function(startDate, endDate) {
  const matchStage = {
    status: 'completed'
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalDonations: { $sum: 1 },
        averageDonation: { $avg: '$amount' },
        maxDonation: { $max: '$amount' },
        minDonation: { $min: '$amount' }
      }
    }
  ]);
  
  const purposeStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$purpose',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  return {
    overall: stats[0] || {
      totalAmount: 0,
      totalDonations: 0,
      averageDonation: 0,
      maxDonation: 0,
      minDonation: 0
    },
    byPurpose: purposeStats
  };
};

// Static method to find donations by donor
donationSchema.statics.findByDonor = function(donorId) {
  return this.find({ donor: donorId })
    .populate('donor', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find recent donations
donationSchema.statics.findRecent = function(limit = 10) {
  return this.find({ status: 'completed' })
    .populate('donor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Donation', donationSchema);
