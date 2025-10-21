import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic Auth0 Information
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },

  // Extended Auth0 Profile Data
  picture: {
    type: String,
    default: null,
  },
  nickname: {
    type: String,
    default: null,
  },
  given_name: {
    type: String,
    default: null,
  },
  family_name: {
    type: String,
    default: null,
  },
  locale: {
    type: String,
    default: null,
  },

  // Email Verification
  email_verified: {
    type: Boolean,
    default: false,
  },

  // System Role
  role: {
    type: String,
    enum: ['admin', 'callOperator', 'EmergencyOfficer', 'safariDriver', 'tourGuide', 'tourist', 'vet', 'WildlifeOfficer'],
    default: 'tourist',
  },

  // Authentication Metadata
  auth_metadata: {
    last_login: {
      type: Date,
      default: Date.now,
    },
    login_count: {
      type: Number,
      default: 1,
    },
    last_ip: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    auth_provider: {
      type: String,
      default: 'auth0',
    },
  },

  // Profile Completion
  profile_complete: {
    type: Boolean,
    default: false,
  },

  // Additional Profile Information
  phone: {
    type: String,
    default: null,
  },
  address: {
    street: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postal_code: { type: String, default: null },
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: null },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active',
  },

  // Terms and Privacy
  terms_accepted: {
    type: Boolean,
    default: false,
  },
  terms_accepted_date: {
    type: Date,
    default: null,
  },
  privacy_accepted: {
    type: Boolean,
    default: false,
  },
  privacy_accepted_date: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.given_name && this.family_name) {
    return `${this.given_name} ${this.family_name}`;
  }
  return this.name;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletionPercentage').get(function () {
  let completed = 0;
  const total = 10;

  if (this.name) completed++;
  if (this.email) completed++;
  if (this.picture) completed++;
  if (this.phone) completed++;
  if (this.address.city) completed++;
  if (this.address.country) completed++;
  if (this.preferences.timezone) completed++;
  if (this.email_verified) completed++;
  if (this.terms_accepted) completed++;
  if (this.privacy_accepted) completed++;

  return Math.round((completed / total) * 100);
});

// Index for better query performance
userSchema.index({ auth0Id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'auth_metadata.last_login': -1 });

// Pre-save middleware to update profile completion
userSchema.pre('save', function (next) {
  this.profile_complete = this.profileCompletionPercentage >= 80;
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
