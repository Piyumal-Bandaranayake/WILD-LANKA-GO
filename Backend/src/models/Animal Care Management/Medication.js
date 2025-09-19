import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  medicationId: {
    type: String,
    unique: true,
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
  },
  genericName: {
    type: String,
    trim: true,
  },
  description: { 
    type: String, 
    required: true 
  },
  category: {
    type: String,
    enum: ['Antibiotic', 'Painkiller', 'Anti-inflammatory', 'Anesthetic', 'Vaccine', 'Supplement', 'Other'],
    required: true,
  },
  form: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical', 'Powder', 'Other'],
    required: true,
  },
  strength: {
    type: String,
    required: true, // e.g., "500mg", "10ml"
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0,
  },
  unit: { 
    type: String, 
    required: true,
    enum: ['tablets', 'capsules', 'ml', 'bottles', 'vials', 'ampules', 'grams', 'kg', 'units'],
  },
  threshold: { 
    type: Number, 
    required: true,
    min: 0,
  },
  batchNumber: {
    type: String,
    required: true,
  },
  manufacturingDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  supplier: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
  },
  storageConditions: {
    temperature: { type: String }, // e.g., "2-8°C", "Room temperature"
    humidity: { type: String },
    special: { type: String }, // e.g., "Keep away from light"
  },
  usageLog: [{
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnimalCase',
    },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treatment',
    },
    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    quantityUsed: { type: Number, required: true },
    dateUsed: { type: Date, default: Date.now },
    notes: { type: String },
  }],
  restockRequests: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantityRequested: { type: Number, required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    reason: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Ordered', 'Received'],
      default: 'Pending',
    },
    requestDate: { type: Date, default: Date.now },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedDate: { type: Date },
    notes: { type: String },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  alerts: {
    lowStock: { type: Boolean, default: false },
    nearExpiry: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Pre-save middleware to generate medication ID and calculate total cost
medicationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastMedication = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastMedication && lastMedication.medicationId) {
      const lastId = parseInt(lastMedication.medicationId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.medicationId = `MED-${String(nextId).padStart(5, '0')}`;
  }
  
  // Calculate total cost
  this.totalCost = this.quantity * this.costPerUnit;
  
  // Update alerts
  this.alerts.lowStock = this.quantity <= this.threshold;
  
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  this.alerts.nearExpiry = this.expiryDate <= thirtyDaysFromNow && this.expiryDate > now;
  this.alerts.expired = this.expiryDate <= now;
  
  this.updatedAt = new Date();
  
  next();
});

// Virtual for days until expiry
medicationSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for better query performance
medicationSchema.index({ name: 1 });
medicationSchema.index({ category: 1 });
medicationSchema.index({ expiryDate: 1 });
medicationSchema.index({ 'alerts.lowStock': 1 });
medicationSchema.index({ 'alerts.nearExpiry': 1 });
medicationSchema.index({ 'alerts.expired': 1 });

const Medication = mongoose.model('Medication', medicationSchema);

export default Medication;
