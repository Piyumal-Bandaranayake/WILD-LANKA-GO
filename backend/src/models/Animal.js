const mongoose = require('mongoose');
const { ANIMAL_STATUS, PRIORITY_LEVELS } = require('../utils/constants');

const animalSchema = new mongoose.Schema({
  // Basic Information
  caseId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Animal Details
  species: {
    type: String,
    required: [true, 'Species is required'],
    trim: true,
  },
  commonName: {
    type: String,
    trim: true,
  },
  scientificName: {
    type: String,
    trim: true,
  },
  age: {
    estimated: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      enum: ['juvenile', 'adult', 'elderly', 'unknown'],
      default: 'unknown',
    },
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown',
  },
  weight: {
    type: Number,
    min: 0,
  },
  size: {
    length: Number,
    height: Number,
    wingspan: Number, // for birds
  },
  
  // Identification
  markings: [{
    type: String,
    description: String,
  }],
  tags: [{
    type: String,
    number: String,
    dateApplied: Date,
  }],
  microchipId: {
    type: String,
    sparse: true,
  },
  
  // Status and Condition
  status: {
    type: String,
    enum: Object.values(ANIMAL_STATUS),
    default: ANIMAL_STATUS.RESCUED,
  },
  condition: {
    type: String,
    enum: ['critical', 'serious', 'stable', 'good', 'excellent'],
    required: [true, 'Condition is required'],
  },
  priority: {
    type: String,
    enum: Object.values(PRIORITY_LEVELS),
    default: PRIORITY_LEVELS.MEDIUM,
  },
  
  // Location Information
  rescueLocation: {
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Rescue latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Rescue longitude is required'],
      },
    },
    address: String,
    description: String,
    habitat: {
      type: String,
      enum: ['forest', 'wetland', 'grassland', 'urban', 'coastal', 'mountain', 'other'],
    },
  },
  currentLocation: {
    facility: {
      type: String,
      required: [true, 'Current facility is required'],
    },
    enclosure: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  
  // Medical Information
  injuries: [{
    type: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'critical'],
      required: true,
    },
    description: String,
    treatmentRequired: Boolean,
    dateIdentified: {
      type: Date,
      default: Date.now,
    },
  }],
  diseases: [{
    name: String,
    diagnosis: String,
    contagious: Boolean,
    treatmentPlan: String,
    dateIdentified: {
      type: Date,
      default: Date.now,
    },
  }],
  medications: [{
    name: {
      type: String,
      required: true,
    },
    dosage: String,
    frequency: String,
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  
  // Care Team
  assignedVet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned veterinarian is required'],
  },
  caregivers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String,
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Documentation
  photos: [{
    url: String,
    description: String,
    dateTaken: {
      type: Date,
      default: Date.now,
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  documents: [{
    type: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Treatment History
  treatments: [{
    date: {
      type: Date,
      required: true,
    },
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
    outcome: String,
    notes: String,
  }],
  
  // Important Dates
  rescueDate: {
    type: Date,
    required: [true, 'Rescue date is required'],
    default: Date.now,
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  releaseDate: Date,
  deathDate: Date,
  
  // Release Information
  releaseLocation: {
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    address: String,
    description: String,
    suitabilityAssessment: String,
  },
  releaseConditions: [{
    type: String,
  }],
  postReleaseMonitoring: {
    required: {
      type: Boolean,
      default: false,
    },
    duration: Number, // in days
    method: String,
    responsiblePerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  // Administrative
  reportedBy: {
    name: String,
    contact: String,
    relationship: String, // e.g., 'public', 'ranger', 'researcher'
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
animalSchema.index({ caseId: 1 });
animalSchema.index({ species: 1 });
animalSchema.index({ status: 1 });
animalSchema.index({ assignedVet: 1 });
animalSchema.index({ rescueDate: -1 });
animalSchema.index({ priority: 1 });
animalSchema.index({ condition: 1 });

// Pre-save middleware to generate case ID
animalSchema.pre('save', function(next) {
  if (!this.caseId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.caseId = `AC-${year}${month}${day}-${random}`;
  }
  next();
});

// Virtual for days in care
animalSchema.virtual('daysInCare').get(function() {
  const startDate = this.admissionDate || this.rescueDate;
  const endDate = this.releaseDate || this.deathDate || new Date();
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to add treatment
animalSchema.methods.addTreatment = function(treatmentData) {
  this.treatments.push({
    ...treatmentData,
    date: treatmentData.date || new Date(),
  });
  return this.save();
};

// Instance method to update status
animalSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  
  // Set appropriate dates based on status
  if (newStatus === ANIMAL_STATUS.RELEASED) {
    this.releaseDate = new Date();
  } else if (newStatus === ANIMAL_STATUS.DECEASED) {
    this.deathDate = new Date();
  }
  
  return this.save();
};

// Static method to find animals by status
animalSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find animals requiring attention
animalSchema.statics.findRequiringAttention = function() {
  return this.find({
    $or: [
      { condition: 'critical' },
      { priority: PRIORITY_LEVELS.CRITICAL },
      { status: ANIMAL_STATUS.UNDER_TREATMENT },
    ],
  }).populate('assignedVet', 'firstName lastName email');
};

module.exports = mongoose.model('Animal', animalSchema);
