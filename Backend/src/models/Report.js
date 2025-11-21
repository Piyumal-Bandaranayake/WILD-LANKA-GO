const mongoose = require('mongoose');
const { REPORT_TYPES, REPORT_STATUS, PRIORITY_LEVELS } = require('../utils/constants');

const reportSchema = new mongoose.Schema({
  // Basic Information
  reportId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Report Details
  type: {
    type: String,
    enum: Object.values(REPORT_TYPES),
    required: [true, 'Report type is required'],
  },
  status: {
    type: String,
    enum: Object.values(REPORT_STATUS),
    default: REPORT_STATUS.SUBMITTED,
  },
  priority: {
    type: String,
    enum: Object.values(PRIORITY_LEVELS),
    default: PRIORITY_LEVELS.MEDIUM,
  },
  
  // Reporter Information
  reportedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For anonymous reports
    name: String,
    email: String,
    phone: String,
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  
  // Incident Details
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  
  // Location Information
  location: {
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Location latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Location longitude is required'],
      },
    },
    address: String,
    landmark: String,
    description: String,
    accessInstructions: String,
  },
  
  // Date and Time
  incidentDate: {
    type: Date,
    required: [true, 'Incident date is required'],
  },
  incidentTime: {
    type: String,
    required: [true, 'Incident time is required'],
  },
  reportDate: {
    type: Date,
    default: Date.now,
  },
  
  // Wildlife Information (for animal-related reports)
  wildlife: {
    species: String,
    count: {
      type: Number,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['healthy', 'injured', 'sick', 'dead', 'distressed', 'unknown'],
    },
    behavior: String,
    ageGroup: {
      type: String,
      enum: ['juvenile', 'adult', 'mixed', 'unknown'],
    },
  },
  
  // Evidence and Documentation
  photos: [{
    url: String,
    description: String,
    dateTaken: Date,
  }],
  videos: [{
    url: String,
    description: String,
    dateTaken: Date,
  }],
  documents: [{
    type: String,
    url: String,
    description: String,
  }],
  
  // Witnesses
  witnesses: [{
    name: String,
    contact: String,
    statement: String,
  }],
  
  // Environmental Conditions
  weather: {
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'unknown'],
    },
    temperature: Number,
    visibility: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'very_poor'],
    },
  },
  
  // Response and Investigation
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  responseTeam: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String,
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Investigation Details
  investigation: {
    findings: String,
    evidence: [{
      type: String,
      description: String,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      collectionDate: Date,
    }],
    interviews: [{
      person: String,
      date: Date,
      summary: String,
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  },
  
  // Actions Taken
  actions: [{
    type: {
      type: String,
      required: true,
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    outcome: String,
  }],
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Resolution
  resolution: {
    summary: String,
    outcome: {
      type: String,
      enum: ['resolved', 'partially_resolved', 'unresolved', 'referred', 'duplicate'],
    },
    recommendations: [String],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedDate: Date,
  },
  
  // Related Cases
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  }],
  relatedAnimals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
  }],
  
  // Administrative
  tags: [String],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  internalNotes: {
    type: String,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
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

// Indexes
reportSchema.index({ reportId: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ incidentDate: -1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ createdAt: -1 });

// Pre-save middleware to generate report ID
reportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Different prefixes for different report types
    const prefixMap = {
      [REPORT_TYPES.RESCUE]: 'RS',
      [REPORT_TYPES.SIGHTING]: 'ST',
      [REPORT_TYPES.INJURY]: 'IN',
      [REPORT_TYPES.EMERGENCY]: 'EM',
      [REPORT_TYPES.POACHING]: 'PO',
      [REPORT_TYPES.HABITAT_DAMAGE]: 'HD',
    };
    
    const prefix = prefixMap[this.type] || 'RP';
    this.reportId = `${prefix}-${year}${month}${day}-${random}`;
  }
  next();
});

// Virtual for days since report
reportSchema.virtual('daysSinceReport').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.reportDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for response time (if assigned)
reportSchema.virtual('responseTime').get(function() {
  if (!this.assignedTo || !this.responseTeam.length) return null;
  
  const firstResponse = this.responseTeam[0].assignedDate;
  const diffTime = Math.abs(firstResponse - this.reportDate);
  return Math.ceil(diffTime / (1000 * 60 * 60)); // in hours
});

// Instance method to assign to user
reportSchema.methods.assignTo = function(userId, assignedBy) {
  this.assignedTo = userId;
  this.status = REPORT_STATUS.UNDER_REVIEW;
  this.updatedBy = assignedBy;
  return this.save();
};

// Instance method to add action
reportSchema.methods.addAction = function(actionData) {
  this.actions.push({
    ...actionData,
    date: actionData.date || new Date(),
  });
  return this.save();
};

// Instance method to resolve report
reportSchema.methods.resolve = function(resolutionData, resolvedBy) {
  this.status = REPORT_STATUS.RESOLVED;
  this.resolution = {
    ...resolutionData,
    resolvedBy,
    resolvedDate: new Date(),
  };
  this.updatedBy = resolvedBy;
  return this.save();
};

// Static method to find reports by location (within radius)
reportSchema.statics.findByLocation = function(latitude, longitude, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInKm * 1000, // Convert to meters
      },
    },
  });
};

// Static method to find urgent reports
reportSchema.statics.findUrgent = function() {
  return this.find({
    $or: [
      { priority: PRIORITY_LEVELS.CRITICAL },
      { type: REPORT_TYPES.EMERGENCY },
      { 
        status: REPORT_STATUS.SUBMITTED,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    ],
  }).sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Report', reportSchema);
