const mongoose = require('mongoose');

const animalCaseSchema = new mongoose.Schema({
  // Basic Information
  caseId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Animal Details
  animalType: {
    type: String,
    required: [true, 'Animal type is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  
  // Reporter Information
  reportedBy: {
    type: String,
    required: [true, 'Reporter name is required'],
    trim: true,
  },
  contactInfo: {
    type: String,
    trim: true,
  },
  
  // Medical Information
  symptoms: {
    type: String,
    trim: true,
  },
  estimatedAge: {
    type: String,
    trim: true,
  },
  weight: {
    type: String,
    trim: true,
  },
  
  // Documentation
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
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
animalCaseSchema.index({ animalType: 1 });
animalCaseSchema.index({ status: 1 });
animalCaseSchema.index({ priority: 1 });
animalCaseSchema.index({ createdBy: 1 });
animalCaseSchema.index({ assignedVet: 1 });

// Pre-save middleware to generate case ID
animalCaseSchema.pre('save', function(next) {
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

// Instance method to update status
animalCaseSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  return this.save();
};

// Static method to find cases by status
animalCaseSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find cases requiring attention
animalCaseSchema.statics.findRequiringAttention = function() {
  return this.find({
    $or: [
      { priority: 'Critical' },
      { priority: 'High' },
      { status: 'Open' },
    ],
  }).populate('assignedVet', 'firstName lastName email');
};

module.exports = mongoose.model('AnimalCase', animalCaseSchema);
