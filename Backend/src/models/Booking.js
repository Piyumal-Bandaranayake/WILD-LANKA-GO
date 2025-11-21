const mongoose = require('mongoose');
const { BOOKING_STATUS, BOOKING_TYPES } = require('../utils/constants');

const bookingSchema = new mongoose.Schema({
  // Basic Information
  bookingId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tourist',
    required: [true, 'Customer is required'],
  },
  
  // Booking Details
  type: {
    type: String,
    enum: Object.values(BOOKING_TYPES),
    required: [true, 'Booking type is required'],
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
  },
  
  // Date and Time
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
  },
  duration: {
    type: Number, // in hours
    required: [true, 'Duration is required'],
  },
  
  // Participants
  numberOfAdults: {
    type: Number,
    required: [true, 'Number of adults is required'],
    min: 1,
  },
  numberOfChildren: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalParticipants: {
    type: Number,
    required: true,
  },
  
  // Location and Route
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required'],
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    description: String,
  },
  route: {
    startPoint: String,
    endPoint: String,
    waypoints: [String],
    estimatedDistance: Number, // in kilometers
  },
  
  // Staff Assignment
  tourGuide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  requestTourGuide: {
    type: Boolean,
    default: false,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  
  // Pricing
  pricing: {
    adultPrice: {
      type: Number,
      required: [true, 'Adult price is required'],
    },
    childPrice: {
      type: Number,
      default: 0,
    },
    guidePrice: {
      type: Number,
      default: 0,
    },
    vehiclePrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
    },
    currency: {
      type: String,
      default: 'LKR',
    },
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'online', 'bank_transfer'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
      default: 'pending',
    },
    transactionId: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: Date,
  },
  
  // Special Requirements
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters'],
  },
  dietaryRequirements: [String],
  accessibilityNeeds: [String],
  
  // Status Tracking
  confirmationDate: Date,
  cancellationDate: Date,
  cancellationReason: String,
  completionDate: Date,
  
  // Feedback and Rating
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
  },
  
  // Administrative
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes (bookingId index is created by unique: true, so we don't need to add it again)
bookingSchema.index({ customer: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ type: 1 });
bookingSchema.index({ tourGuide: 1 });
bookingSchema.index({ driver: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total participants
bookingSchema.pre('save', function(next) {
  this.totalParticipants = this.numberOfAdults + this.numberOfChildren;
  next();
});

// Pre-save middleware to generate booking ID
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `WLG-${year}${month}${day}-${random}`;
  }
  next();
});

// Virtual for booking duration in readable format
bookingSchema.virtual('durationFormatted').get(function() {
  if (this.duration < 1) {
    return `${Math.round(this.duration * 60)} minutes`;
  }
  return `${this.duration} hour${this.duration > 1 ? 's' : ''}`;
});

// Instance method to calculate total price
bookingSchema.methods.calculateTotalPrice = function() {
  const adultTotal = this.numberOfAdults * this.pricing.adultPrice;
  const childTotal = this.numberOfChildren * this.pricing.childPrice;
  const guideTotal = this.pricing.guidePrice || 0;
  const vehicleTotal = this.pricing.vehiclePrice || 0;
  
  this.pricing.totalPrice = adultTotal + childTotal + guideTotal + vehicleTotal;
  return this.pricing.totalPrice;
};

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);
  
  return hoursDifference > 24 && this.status === BOOKING_STATUS.CONFIRMED;
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    bookingDate: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

// Static method to find available guides for a date
bookingSchema.statics.findAvailableGuides = async function(date) {
  const User = mongoose.model('User');
  const bookedGuides = await this.distinct('tourGuide', {
    bookingDate: date,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] },
  });
  
  return User.find({
    role: 'tourGuide',
    status: 'active',
    _id: { $nin: bookedGuides },
  });
};

module.exports = mongoose.model('Booking', bookingSchema);
