import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
  treatmentId: {
    type: String,
    unique: true,
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnimalCase',
    required: true,
  },
  assignedVet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  treatmentType: {
    type: String,
    enum: ['Medical', 'Surgical', 'Emergency', 'Rehabilitation', 'Preventive'],
    required: true,
  },
  treatmentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  treatmentPlan: {
    type: String,
    required: true,
  },
  medicationsUsed: [{
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
    },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String, default: '' }
  }],
  procedures: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String },
    complications: { type: String, default: '' },
    success_rate: { type: String, default: '' }
  }],
  treatmentImages: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    description: { type: String, default: '' },
    image_type: { 
      type: String, 
      enum: ['before', 'during', 'after', 'xray', 'scan', 'other'],
      default: 'other'
    },
    uploaded_at: { type: Date, default: Date.now }
  }],
  vitalSigns: {
    temperature: { type: Number },
    heart_rate: { type: Number },
    respiratory_rate: { type: Number },
    blood_pressure: { type: String },
    weight: { type: Number },
    recorded_at: { type: Date, default: Date.now }
  },
  treatmentStatus: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Follow-up Required'],
    default: 'Planned',
  },
  outcome: {
    type: String,
    enum: ['Successful', 'Partially Successful', 'Unsuccessful', 'Ongoing'],
    default: 'Ongoing',
  },
  recoveryNotes: {
    type: String,
    default: '',
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
  },
  complications: {
    type: String,
    default: '',
  },
  cost: {
    medication_cost: { type: Number, default: 0 },
    procedure_cost: { type: Number, default: 0 },
    total_cost: { type: Number, default: 0 }
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Pre-save middleware to generate treatment ID
treatmentSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastTreatment = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastTreatment && lastTreatment.treatmentId) {
      const lastId = parseInt(lastTreatment.treatmentId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.treatmentId = `TRT-${String(nextId).padStart(5, '0')}`;
  }
  
  // Calculate total cost
  this.cost.total_cost = this.cost.medication_cost + this.cost.procedure_cost;
  
  next();
});

// Index for better query performance
treatmentSchema.index({ caseId: 1 });
treatmentSchema.index({ assignedVet: 1 });
treatmentSchema.index({ treatmentStatus: 1 });
treatmentSchema.index({ treatmentDate: -1 });

const Treatment = mongoose.model('Treatment', treatmentSchema);

export default Treatment;