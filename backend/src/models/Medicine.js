const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  // Medicine Identification
  medicineId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Medicine category is required'],
    enum: ['Antibiotic', 'Pain Relief', 'Anti-inflammatory', 'Vaccine', 'Supplements', 'Emergency', 'Other'],
    default: 'Other',
  },
  
  // Dosage Information
  form: {
    type: String,
    required: [true, 'Medicine form is required'],
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Ointment', 'Spray', 'Drops', 'Powder', 'Other'],
  },
  strength: {
    type: String,
    required: [true, 'Medicine strength is required'],
    trim: true,
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['mg', 'g', 'ml', 'cc', 'units', 'tablets', 'capsules', 'tubes', 'bottles'],
  },
  
  // Simple Inventory Information
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  minimumStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 10,
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Out of Stock'],
    default: 'Active',
  },
  
  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ currentStock: 1 });

// Virtual for stock status
medicineSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'Out of Stock';
  if (this.currentStock <= this.minimumStock) return 'Low Stock';
  return 'Normal';
});

// Static method to generate medicine ID
medicineSchema.statics.generateMedicineId = function() {
  const prefix = 'MED';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Method to check if stock is low
medicineSchema.methods.isLowStock = function() {
  return this.currentStock <= this.minimumStock;
};

// Pre-save middleware to generate medicine ID
medicineSchema.pre('save', function(next) {
  if (this.isNew && !this.medicineId) {
    this.medicineId = this.constructor.generateMedicineId();
  }
  next();
});

// Ensure virtual fields are serialized
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
