const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  // Treatment ID
  treatmentId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Case Reference
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnimalCase',
    required: true,
  },
  
  // Treatment Details
  treatment: {
    type: String,
    required: [true, 'Treatment type is required'],
    trim: true,
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
  },
  // Legacy single medication fields (kept for backward compatibility)
  medication: {
    type: String,
    trim: true,
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
  },
  medicationQuantity: {
    type: Number,
    min: [0, 'Medication quantity cannot be negative'],
    default: 0,
  },
  
  // Multiple medications support
  medications: [{
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Medication quantity cannot be negative'],
    },
    dosage: {
      type: String,
      trim: true,
    },
    frequency: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    }
  }],
  dosage: {
    type: String,
    trim: true,
  },
  frequency: {
    type: String,
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
  },
  
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Active',
  },
  
  // Images/Documents
  images: [{
    url: String,
    description: String,
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  
  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedVet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
treatmentSchema.index({ caseId: 1 });
treatmentSchema.index({ status: 1 });
treatmentSchema.index({ createdBy: 1 });
treatmentSchema.index({ assignedVet: 1 });
treatmentSchema.index({ startDate: 1 });
treatmentSchema.index({ endDate: 1 });

// Instance method to update status
treatmentSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  return this.save();
};

// Static method to find treatments by case
treatmentSchema.statics.findByCase = function(caseId) {
  return this.find({ caseId }).populate('createdBy', 'firstName lastName email');
};

// Static method to find active treatments
treatmentSchema.statics.findActive = function() {
  return this.find({ status: 'Active' }).populate('caseId', 'caseId animalType status');
};

// Static method to generate unique treatment ID
treatmentSchema.statics.generateTreatmentId = function() {
  const prefix = 'TR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = mongoose.model('Treatment', treatmentSchema);
