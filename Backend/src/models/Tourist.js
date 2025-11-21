const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_STATUS } = require('../utils/constants');

const touristSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  
  // Role is always 'tourist' for this collection
  role: {
    type: String,
    default: 'tourist',
    immutable: true, // Cannot be changed after creation
  },
  
  // Status
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE,
  },
  
  // Tourist-specific Profile Information
  profileImage: {
    type: String,
    default: null,
  },
  dateOfBirth: {
    type: Date,
  },
  nationality: {
    type: String,
    default: 'Sri Lankan',
  },
  passportNumber: {
    type: String,
    sparse: true, // For international tourists
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Sri Lanka',
    },
  },
  
  // Tourist Preferences
  interests: [{
    type: String,
    enum: [
      'wildlife_photography',
      'bird_watching',
      'safari_tours',
      'conservation',
      'adventure_sports',
      'cultural_tours',
      'nature_walks',
      'educational_programs'
    ]
  }],
  
  // Travel Information
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  
  // Booking History References
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  }],
  
  // Feedback and Reviews
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  }],
  
  // System Information
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
  
  // Tourist-specific metrics
  totalBookings: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  
  // Metadata
  registrationSource: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web',
  },
  marketingOptIn: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'tourists', // Explicit collection name
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    },
  },
});

// Indexes for tourists
touristSchema.index({ nationality: 1 });
touristSchema.index({ status: 1 });
touristSchema.index({ createdAt: -1 });
touristSchema.index({ loyaltyPoints: -1 });
touristSchema.index({ totalSpent: -1 });

// Virtual for full name
touristSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
touristSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
touristSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update login info
touristSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Instance method to add loyalty points
touristSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

// Instance method to update booking stats
touristSchema.methods.updateBookingStats = function(amount) {
  this.totalBookings += 1;
  this.totalSpent += amount;
  // Add loyalty points (1 point per $10 spent)
  this.loyaltyPoints += Math.floor(amount / 10);
  return this.save();
};

// Static method to find by email
touristSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active tourists
touristSchema.statics.findActive = function() {
  return this.find({ status: USER_STATUS.ACTIVE });
};

// Static method to find tourists by nationality
touristSchema.statics.findByNationality = function(nationality) {
  return this.find({ nationality, status: USER_STATUS.ACTIVE });
};

module.exports = mongoose.model('Tourist', touristSchema);
