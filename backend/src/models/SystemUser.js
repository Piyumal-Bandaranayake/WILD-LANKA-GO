const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, USER_STATUS } = require('../utils/constants');

// Define system user roles (excluding tourist)
const SYSTEM_USER_ROLES = {
  ADMIN: 'admin',
  WILDLIFE_OFFICER: 'wildlifeOfficer',
  VET: 'vet',
  TOUR_GUIDE: 'tourGuide',
  SAFARI_DRIVER: 'safariDriver',
  CALL_OPERATOR: 'callOperator',
  EMERGENCY_OFFICER: 'emergencyOfficer',
};

const systemUserSchema = new mongoose.Schema({
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
    default: '0000000000'
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  
  // Role and Status (excluding tourist)
  role: {
    type: String,
    enum: Object.values(SYSTEM_USER_ROLES),
    required: [true, 'User role is required'],
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE,
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null,
  },
  dateOfBirth: {
    type: Date,
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
  
  // Employee Information
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  department: {
    type: String,
    enum: [
      'administration',
      'wildlife_conservation',
      'veterinary_services',
      'tourism_operations',
      'emergency_services',
      'call_center',
      'field_operations'
    ],
    default: 'tourism_operations'
  },
  position: {
    type: String,
  },
  hireDate: {
    type: Date,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  
  // Role-specific Information
  // For Tour Guides - Enhanced with all guide-specific features
  guideInfo: {
    // Registration Information
    guideRegistrationNo: {
      type: String,
      sparse: true, // Allows multiple null values
    },
    registrationExpiryDate: {
      type: Date,
    },
    registrationIssuedDate: {
      type: Date,
    },
    issuingAuthority: {
      type: String,
    },
    
    // Experience and Skills
    experienceYears: {
      type: Number,
      min: 0,
    },
    languages: [{
      type: String,
    }],
    specializations: [{
      type: String,
    }],
    areasOfExpertise: [{
      type: String,
      trim: true,
    }],
    
    // Current Tour Assignment
    currentTour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      default: null,
    },
    
    // Unavailable Dates
    unavailableDates: [{
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      reason: {
        type: String,
      },
    }],
    
    // Tour History & Performance
    tourHistory: [{
      tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      touristRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: {
        type: String,
      },
      groupSize: {
        type: Number,
      },
      tourType: {
        type: String,
      },
    }],
    
    // Performance Metrics
    performance: {
      totalToursCompleted: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      onTimePercentage: {
        type: Number,
        default: 100,
      },
      customerSatisfactionScore: {
        type: Number,
        default: 0,
      },
      repeatCustomerRate: {
        type: Number,
        default: 0,
      },
    },
    
    // Previous Employment
    previousEmployers: [{
      companyName: {
        type: String,
      },
      position: {
        type: String,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      description: {
        type: String,
      },
    }],
    
    // Additional Certifications
    certifications: [{
      name: {
        type: String,
      },
      issuedBy: {
        type: String,
      },
      issuedDate: {
        type: Date,
      },
      expiryDate: {
        type: Date,
      },
      certificateUrl: {
        type: String,
      },
    }],
    
    // Tour Materials
    tourMaterials: [{
      materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TourMaterial',
      },
      title: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['Audio', 'Video', 'Document', 'Presentation', 'Map', 'Other'],
        required: true,
      },
      fileUrl: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    }],
    
    // Detailed Ratings
    ratings: [{
      touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
      },
      tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
      },
      knowledge: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      friendliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: {
        type: String,
      },
      ratedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Tour Assignments
    tourAssignments: [{
      tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SystemUser',
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['Assigned', 'Accepted', 'Rejected', 'Completed'],
        default: 'Assigned',
      },
      response: {
        type: String, // Response message if rejected
      },
      responseAt: {
        type: Date,
      },
    }],
    
    // Availability Settings
    availabilitySettings: {
      preferredAreas: [{
        type: String,
      }], // Preferred parks/areas
      maxToursPerDay: {
        type: Number,
        default: 2,
      },
      workingHours: {
        start: {
          type: String,
          default: '05:00',
        },
        end: {
          type: String,
          default: '19:00',
        },
      },
    },
    
    // Performance Metrics (Enhanced)
    performance: {
      totalToursCompleted: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      onTimePercentage: {
        type: Number,
        default: 100,
      },
      customerSatisfactionScore: {
        type: Number,
        default: 0,
      },
      repeatCustomerRate: {
        type: Number,
        default: 0,
      },
      knowledgeRating: {
        type: Number,
        default: 0,
      },
      communicationRating: {
        type: Number,
        default: 0,
      },
    },
    
    // Documentation
    documentation: {
      registrationCertificate: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      resume: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      certificates: [{
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
        description: {
          type: String,
        },
        issuedDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
      }],
      medicalCertificate: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
        expiryDate: {
          type: Date,
        },
      },
    },
    
    // Banking Information
    bankDetails: {
      accountNumber: {
        type: String,
      },
      bankName: {
        type: String,
      },
      branchCode: {
        type: String,
      },
      accountHolderName: {
        type: String,
      },
    },
    
    // Settings
    settings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: true,
      },
      tourReminders: {
        type: Boolean,
        default: true,
      },
      ratingNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  
  // For Safari Drivers - Enhanced with all driver-specific features
  driverInfo: {
    // License Information
    licenseNumber: {
      type: String,
      sparse: true,
    },
    licenseType: {
      type: String,
      sparse: true,
    },
    licenseExpiryDate: {
      type: Date,
    },
    licenseIssuedDate: {
      type: Date,
    },
    issuingAuthority: {
      type: String,
    },
    
    // Vehicle Information
    vehicleInfo: {
      vehicleType: {
        type: String,
        enum: ['Safari Jeep', 'Bus', 'Van', 'Truck', 'Other'],
      },
      vehicleNumber: {
        type: String,
      },
      vehicleModel: {
        type: String,
      },
      vehicleYear: {
        type: Number,
      },
      capacity: {
        type: Number,
      },
      fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
        default: 'Diesel'
      },
      averageFuelConsumption: {
        type: Number, // km per liter
      },
    },
    
    // Current Tour Assignment
    currentTour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      default: null,
    },
    
    // Unavailable Dates
    unavailableDates: [{
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      reason: {
        type: String,
      },
    }],
    
    // Tour History & Performance
    tourHistory: [{
      tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      distance: {
        type: Number,
      },
      touristRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: {
        type: String,
      },
    }],
    
    // Performance Metrics
    performance: {
      totalToursCompleted: {
        type: Number,
        default: 0,
      },
      totalDistanceDriven: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      onTimePercentage: {
        type: Number,
        default: 100,
      },
      fuelEfficiencyRating: {
        type: Number,
        default: 0,
      },
    },
    
    // Fuel Management
    fuelClaims: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FuelClaim',
    }],
    
    // Odometer Tracking
    odometerTracking: {
      currentReading: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
      },
      maintenanceAlerts: [{
        type: {
          type: String,
        },
        message: {
          type: String,
        },
        dueAt: {
          type: Number, // odometer reading
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      }],
    },
    
    // GPS Tracking
    gpsTracking: {
      isActive: {
        type: Boolean,
        default: false,
      },
      currentLocation: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
        accuracy: {
          type: Number, // in meters
        },
        timestamp: {
          type: Date,
        },
        speed: {
          type: Number, // km/h
        },
        heading: {
          type: Number, // degrees
        },
      },
      locationHistory: [{
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        accuracy: {
          type: Number,
        },
        speed: {
          type: Number,
        },
        heading: {
          type: Number,
        },
        tourId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tour',
        },
      }],
      deviceInfo: {
        deviceId: {
          type: String,
        },
        batteryLevel: {
          type: Number, // percentage
        },
        signalStrength: {
          type: Number, // dBm
        },
        lastSeen: {
          type: Date,
        },
      },
      safeZones: [{
        name: {
          type: String,
        },
        center: {
          latitude: {
            type: Number,
          },
          longitude: {
            type: Number,
          },
        },
        radius: {
          type: Number, // in meters
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      }],
      alerts: [{
        type: {
          type: String,
          enum: ['outside_safe_zone', 'low_battery', 'no_signal', 'speed_alert', 'route_deviation'],
        },
        message: {
          type: String,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    
    // Documentation
    documentation: {
      licenseImage: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      vehicleImages: [{
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
        description: {
          type: String,
        },
      }],
      medicalCertificate: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
        expiryDate: {
          type: Date,
        },
      },
    },
    
    // Banking Information
    bankDetails: {
      accountNumber: {
        type: String,
      },
      bankName: {
        type: String,
      },
      branchCode: {
        type: String,
      },
      accountHolderName: {
        type: String,
      },
    },
  },
  
  // For Vets
  veterinaryLicense: {
    type: String,
    sparse: true,
  },
  qualifications: [{
    type: String,
  }],
  
  // Availability and Scheduling
  isAvailable: {
    type: Boolean,
    default: true,
  },
  // Day-specific availability tracking
  dailyAvailability: {
    type: Map,
    of: {
      isAvailable: { type: Boolean, default: true },
      assignedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
      lastUpdated: { type: Date, default: Date.now }
    },
    default: new Map()
  },
  workingHours: {
    start: String, // e.g., "08:00"
    end: String,   // e.g., "17:00"
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  
  // Performance Metrics
  performanceRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  
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
  
  // Permissions and Access
  permissions: [{
    type: String,
  }],
  accessLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 1,
  },
  
  // Role-specific Notifications
  notifications: [{
    type: {
      type: String,
      enum: [
        'Tour Assignment', 
        'Fuel Claim Update', 
        'Maintenance Alert', 
        'System Alert',
        'Schedule Change',
        'Performance Review',
        'Document Expiry',
        'Payment Update'
      ],
    },
    message: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedType: {
      type: String,
      enum: ['Tour', 'FuelClaim', 'Document', 'Payment'],
    },
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
}, {
  timestamps: true,
  collection: 'systemusers', // Explicit collection name
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

// Indexes for system users
systemUserSchema.index({ role: 1 });
systemUserSchema.index({ status: 1 });
systemUserSchema.index({ department: 1 });
systemUserSchema.index({ isAvailable: 1 });
systemUserSchema.index({ createdAt: -1 });
// Note: driverInfo.licenseNumber and guideInfo.guideRegistrationNo indexes are automatically created due to sparse: true
systemUserSchema.index({ 'driverInfo.currentTour': 1 });
systemUserSchema.index({ 'guideInfo.currentTour': 1 });
systemUserSchema.index({ 'notifications.isRead': 1 });

// Virtual for full name
systemUserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
systemUserSchema.pre('save', async function(next) {
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

// Pre-save middleware to generate employee ID
systemUserSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    try {
      // Generate employee ID based on role and timestamp
      const rolePrefix = {
        admin: 'ADM',
        wildlifeOfficer: 'WLO',
        vet: 'VET',
        tourGuide: 'TGD',
        safariDriver: 'SDR',
        callOperator: 'COP',
        emergencyOfficer: 'EMO',
      };
      
      const prefix = rolePrefix[this.role] || 'USR';
      const timestamp = Date.now().toString().slice(-6);
      this.employeeId = `${prefix}${timestamp}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Instance method to check password
systemUserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update login info
systemUserSchema.methods.updateLoginInfo = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  
  // Reset daily availability on login
  await this.resetDailyAvailability();
  
  return this.save();
};

// Instance method to toggle availability
systemUserSchema.methods.toggleAvailability = function() {
  this.isAvailable = !this.isAvailable;
  return this.save();
};

// Instance method to set user as unavailable (for logout)
systemUserSchema.methods.setUnavailable = function() {
  this.isAvailable = false;
  return this.save();
};

// Instance method to check availability for a specific date
systemUserSchema.methods.isAvailableForDate = function(date) {
  const dateString = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
  const dailyData = this.dailyAvailability.get(dateString);
  return dailyData ? dailyData.isAvailable : true; // Default to available if no data
};

// Instance method to set availability for a specific date
systemUserSchema.methods.setAvailabilityForDate = function(date, isAvailable, tourId = null) {
  const dateString = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
  const currentData = this.dailyAvailability.get(dateString) || { isAvailable: true, assignedTours: [], lastUpdated: new Date() };
  
  currentData.isAvailable = isAvailable;
  currentData.lastUpdated = new Date();
  
  if (tourId) {
    if (isAvailable) {
      // Remove tour from assigned tours if making available
      currentData.assignedTours = currentData.assignedTours.filter(id => id.toString() !== tourId.toString());
    } else {
      // Add tour to assigned tours if making unavailable
      if (!currentData.assignedTours.includes(tourId)) {
        currentData.assignedTours.push(tourId);
      }
    }
  }
  
  this.dailyAvailability.set(dateString, currentData);
  return this.save();
};

// Instance method to reset daily availability (called on login)
systemUserSchema.methods.resetDailyAvailability = async function() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Check if user has any active tours for today
  const Tour = require('./tourmanagement/tour');
  const todayTours = await Tour.find({
    $or: [
      { assignedDriver: this._id },
      { assignedTourGuide: this._id }
    ],
    preferredDate: {
      $gte: new Date(today + 'T00:00:00.000Z'),
      $lt: new Date(today + 'T23:59:59.999Z')
    },
    status: { $in: ['Confirmed', 'Processing', 'Started'] }
  });
  
  // If user has active tours today, keep them unavailable
  if (todayTours.length > 0) {
    this.isAvailable = false;
    await this.setAvailabilityForDate(today, false);
  } else {
    // No active tours today, make them available
    this.isAvailable = true;
    await this.setAvailabilityForDate(today, true);
  }
  
  return this.save();
};

// Instance method to update performance
systemUserSchema.methods.updatePerformance = function(rating) {
  this.performanceRating = rating;
  this.completedTasks += 1;
  return this.save();
};

// Static method to find by email
systemUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users by role
systemUserSchema.statics.findActiveByRole = function(role) {
  return this.find({ role, status: USER_STATUS.ACTIVE });
};

// Static method to find available users by role
systemUserSchema.statics.findAvailableByRole = function(role) {
  return this.find({ 
    role, 
    status: USER_STATUS.ACTIVE, 
    isAvailable: true 
  });
};

// Static method to reset availability for staff with ended tours
systemUserSchema.statics.resetAvailabilityForEndedTours = async function() {
  try {
    console.log('🔄 Auto-resetting availability for staff with ended tours...');
    
    const Tour = require('./tourmanagement/tour');
    
    // Find all tours with "Ended" status
    const endedTours = await Tour.find({ status: 'Ended' });
    console.log(`📊 Found ${endedTours.length} ended tours for auto-reset`);
    
    let resetCount = 0;
    
    for (const tour of endedTours) {
      try {
        // Reset driver availability
        if (tour.assignedDriver) {
          const driver = await this.findById(tour.assignedDriver);
          if (driver && !driver.isAvailable) {
            await driver.setAvailabilityForDate(tour.preferredDate, true);
            driver.isAvailable = true;
            await driver.save();
            console.log(`✅ Auto-reset: Driver ${driver.firstName} ${driver.lastName} availability reset`);
            resetCount++;
          }
        }

        // Reset guide availability
        if (tour.assignedTourGuide) {
          const guide = await this.findById(tour.assignedTourGuide);
          if (guide && !guide.isAvailable) {
            await guide.setAvailabilityForDate(tour.preferredDate, true);
            guide.isAvailable = true;
            await guide.save();
            console.log(`✅ Auto-reset: Guide ${guide.firstName} ${guide.lastName} availability reset`);
            resetCount++;
          }
        }
      } catch (error) {
        console.error(`⚠️ Error auto-resetting availability for tour ${tour._id}:`, error);
      }
    }
    
    if (resetCount > 0) {
      console.log(`✅ Auto-reset completed: ${resetCount} staff members availability reset from ended tours`);
    }
    
    return resetCount;
  } catch (error) {
    console.error('❌ Error in auto-reset availability for ended tours:', error);
    return 0;
  }
};

// Static method to find by department
systemUserSchema.statics.findByDepartment = function(department) {
  return this.find({ department, status: USER_STATUS.ACTIVE });
};

// Static method to find by employee ID
systemUserSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId });
};

// Driver-specific instance methods
systemUserSchema.methods.setCurrentTour = function(tourId) {
  if (this.role === 'safariDriver' && this.driverInfo) {
    this.driverInfo.currentTour = tourId;
    this.isAvailable = false;
    return this.save();
  }
  throw new Error('User is not a safari driver');
};

systemUserSchema.methods.clearCurrentTour = function() {
  if (this.role === 'safariDriver' && this.driverInfo) {
    this.driverInfo.currentTour = null;
    this.isAvailable = true;
    return this.save();
  }
  throw new Error('User is not a safari driver');
};

systemUserSchema.methods.addTourToHistory = function(tourData) {
  if (this.role === 'safariDriver' && this.driverInfo) {
    this.driverInfo.tourHistory.push(tourData);
    this.driverInfo.performance.totalToursCompleted += 1;
    return this.save();
  } else if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.tourHistory.push(tourData);
    this.guideInfo.performance.totalToursCompleted += 1;
    return this.save();
  }
  throw new Error('User is not a driver or tour guide');
};

systemUserSchema.methods.updatePerformance = function(rating, earnings = 0) {
  if (this.role === 'safariDriver' && this.driverInfo) {
    const perf = this.driverInfo.performance;
    const totalTours = perf.totalToursCompleted;
    perf.averageRating = ((perf.averageRating * totalTours) + rating) / (totalTours + 1);
    perf.totalEarnings += earnings;
    return this.save();
  } else if (this.role === 'tourGuide' && this.guideInfo) {
    const perf = this.guideInfo.performance;
    const totalTours = perf.totalToursCompleted;
    perf.averageRating = ((perf.averageRating * totalTours) + rating) / (totalTours + 1);
    perf.totalEarnings += earnings;
    return this.save();
  }
  throw new Error('User is not a driver or tour guide');
};

systemUserSchema.methods.addUnavailableDate = function(startDate, endDate, reason) {
  if (this.role === 'safariDriver' && this.driverInfo) {
    this.driverInfo.unavailableDates.push({ startDate, endDate, reason });
    return this.save();
  } else if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.unavailableDates.push({ startDate, endDate, reason });
    return this.save();
  }
  throw new Error('User is not a driver or tour guide');
};

systemUserSchema.methods.addNotification = function(type, message, priority = 'medium', relatedId = null, relatedType = null) {
  this.notifications.push({
    type,
    message,
    priority,
    relatedId,
    relatedType
  });
  return this.save();
};

systemUserSchema.methods.markNotificationAsRead = function(notificationId) {
  const notification = this.notifications.id(notificationId);
  if (notification) {
    notification.isRead = true;
    return this.save();
  }
  throw new Error('Notification not found');
};

systemUserSchema.methods.getUnreadNotifications = function() {
  return this.notifications.filter(notification => !notification.isRead);
};

// Tour Guide-specific instance methods
systemUserSchema.methods.setCurrentTourGuide = function(tourId) {
  if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.currentTour = tourId;
    this.isAvailable = false;
    return this.save();
  }
  throw new Error('User is not a tour guide');
};

systemUserSchema.methods.clearCurrentTourGuide = function() {
  if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.currentTour = null;
    this.isAvailable = true;
    return this.save();
  }
  throw new Error('User is not a tour guide');
};

systemUserSchema.methods.addTourMaterial = function(materialData) {
  if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.tourMaterials.push(materialData);
    return this.save();
  }
  throw new Error('User is not a tour guide');
};

systemUserSchema.methods.addRating = function(ratingData) {
  if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.ratings.push(ratingData);
    
    // Recalculate performance metrics
    const ratings = this.guideInfo.ratings;
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, rating) => sum + rating.overall, 0);
      this.guideInfo.performance.averageRating = totalRating / ratings.length;
      
      const knowledgeTotal = ratings.reduce((sum, rating) => sum + rating.knowledge, 0);
      this.guideInfo.performance.knowledgeRating = knowledgeTotal / ratings.length;
      
      const communicationTotal = ratings.reduce((sum, rating) => sum + rating.communication, 0);
      this.guideInfo.performance.communicationRating = communicationTotal / ratings.length;
    }
    
    return this.save();
  }
  throw new Error('User is not a tour guide');
};

systemUserSchema.methods.addTourAssignment = function(assignmentData) {
  if (this.role === 'tourGuide' && this.guideInfo) {
    this.guideInfo.tourAssignments.push(assignmentData);
    return this.save();
  }
  throw new Error('User is not a tour guide');
};

systemUserSchema.methods.updateAssignmentStatus = function(assignmentId, status, response = null) {
  if (this.role === 'tourGuide' && this.guideInfo) {
    const assignment = this.guideInfo.tourAssignments.id(assignmentId);
    if (assignment) {
      assignment.status = status;
      if (response) assignment.response = response;
      assignment.responseAt = new Date();
      return this.save();
    }
    throw new Error('Assignment not found');
  }
  throw new Error('User is not a tour guide');
};


module.exports = mongoose.model('SystemUser', systemUserSchema);
