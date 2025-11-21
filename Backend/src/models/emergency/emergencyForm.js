const mongoose = require('mongoose');

// Define allowed emergency types (match frontend exactly)
const EMERGENCY_TYPES = [
  'animal',
  'physical',
  'unethical',
  'human',
  'wildlife',
  'medical',
  'fire',
  'accident',
  'flood',
  'other'
];

const emergencyFormSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  property_name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  emergency_type: {
    type: String,
    enum: EMERGENCY_TYPES, // <-- Enum validation
    required: true
  },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending',  'in-progress', 'resolved'],
    default: 'pending'
  },
 assignedTo: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignedTo.userModel',
      default: null
    },
    userModel: {
      type: String,
      enum: ['SystemUser', 'Tourist'],
      default: 'SystemUser'
    },
  },
  callOperatorNotes: { type: String, maxlength: 500 },
  responseTime: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Normalize priority and emergency_type before save
emergencyFormSchema.pre('save', function(next) {
  if (this.priority) this.priority = this.priority.toLowerCase().trim();
  if (this.emergency_type) this.emergency_type = this.emergency_type.toLowerCase().trim();
  this.updatedAt = new Date();
  next();
});

const EmergencyForm = mongoose.model('EmergencyForm', emergencyFormSchema);
module.exports = EmergencyForm;
