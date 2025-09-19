import mongoose from 'mongoose';

// Define the Animal Case Schema
const animalCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
  },
  animalType: {
    type: String,
    required: true, // Select animal type (e.g., Elephant, Tiger, etc.)
  },
  speciesScientificName: {
    type: String,
    required: true, // Scientific name (e.g., Elephas maximus)
  },
  ageSize: {
    type: String,
    enum: ['Adult', 'Juvenile', 'Calf'],
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: true,
  },
  location: {
    type: String,
    required: true, // Location details (e.g., national park, coordinates)
  },
  reportedBy: {
    type: String,
    required: true, // Name and role of the person reporting
  },
  primaryCondition: {
    type: String,
    required: true, // Brief description of the primary injury/condition
  },
  symptomsObservations: {
    type: String,
    required: true, // Detailed observations (behavior, symptoms)
  },
  initialTreatmentPlan: {
    type: String,
    required: true, // Immediate treatment steps and interventions
  },
  additionalNotes: {
    type: String,
    default: '', // Additional notes, if any
  },
  photosDocumentation: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    description: { type: String, default: '' },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: { type: String, default: '' },
    file_size: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    }
  }],
  assignedVet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedDate: {
    type: Date,
    default: null,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['Unassigned', 'Assigned', 'In Progress', 'Completed'],
    default: 'Unassigned',
    required: true,
  },
  completedDate: {
    type: Date,
    default: null,
  },
  collaboratingVets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  collaborationComments: [{
    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  }],
  collaborationHistory: [{
    action: {
      type: String,
      enum: ['shared', 'transferred', 'collaboration_removed', 'access_granted'],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetVet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    previousVet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: { type: String },
    message: { type: String },
    accessLevel: {
      type: String,
      enum: ['view', 'edit', 'full'],
      default: 'view',
    },
    timestamp: { type: Date, default: Date.now },
  }],
  estimatedRecoveryTime: {
    type: String,
    default: '',
  },
  treatmentCost: {
    type: Number,
    default: 0,
  },
  medications: [{
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
    },
    dosage: { type: String },
    frequency: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
  }],
  gpsTracking: {
    isActive: { type: Boolean, default: false },
    deviceId: { type: String, default: '' },
    enabledAt: { type: Date },
    enabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disabledAt: { type: Date },
    disabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disabledReason: { type: String },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      timestamp: { type: Date },
    },
    locationHistory: [{
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      batteryLevel: { type: Number }, // GPS device battery percentage
      signalStrength: { type: Number }, // Signal strength percentage
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    safeZone: {
      center: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      radius: { type: Number }, // in meters
    },
    alerts: [{
      type: {
        type: String,
        enum: ['geofence_violation', 'no_movement', 'low_battery', 'device_offline'],
      },
      message: { type: String },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      timestamp: { type: Date, default: Date.now },
      acknowledged: { type: Boolean, default: false },
      acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      acknowledgedAt: { type: Date },
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


// Pre-save middleware to generate a unique case ID
animalCaseSchema.pre('save', async function (next) {
  if (this.isNew) {

    const lastCase = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastCase && lastCase.caseId) {
      const lastId = parseInt(lastCase.caseId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.caseId = `CASE-${String(nextId).padStart(5, '0')}`;
  }
  next();
});

const AnimalCase = mongoose.model('AnimalCase', animalCaseSchema);

export default AnimalCase;
