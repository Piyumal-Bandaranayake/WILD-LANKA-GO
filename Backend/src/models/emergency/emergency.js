import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  emergencyId: {
    type: String,
    unique: true,
  },
  type: {
    type: String,
    enum: ['Human', 'Animal', 'Physical', 'Unethical', 'Equipment', 'Natural Disaster'],
    required: true,
  },
  category: {
    type: String,
    enum: [
      // Human emergencies
      'Medical Emergency', 'Injury', 'Lost Tourist', 'Accident',
      // Animal emergencies
      'Injured Animal', 'Aggressive Animal', 'Trapped Animal', 'Sick Animal',
      // Physical emergencies
      'Fire', 'Flood', 'Infrastructure Damage', 'Vehicle Breakdown',
      // Unethical
      'Poaching', 'Illegal Activity', 'Vandalism', 'Trespassing',
      // Equipment
      'Equipment Failure', 'Communication Breakdown',
      // Natural
      'Storm', 'Landslide', 'Other Natural Disaster'
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Reported',
  },
  reporter: {
    // For registered users
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For phone calls or anonymous reports
    guestInfo: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      role: { type: String }, // Tourist, Guide, Driver, etc.
    },
    reportMethod: {
      type: String,
      enum: ['App Form', 'Phone Call', 'Radio', 'In Person', 'Email'],
      required: true,
    },
  },
  incident: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      name: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      area: { type: String }, // Park section/zone
      landmarks: { type: String },
      accessibility: { type: String }, // How to reach the location
    },
    timeOfIncident: { type: Date, required: true },
    timeReported: { type: Date, default: Date.now },
    witnessCount: { type: Number, default: 0 },
    witnessDetails: [{ type: String }],
  },
  severity: {
    injuryLevel: {
      type: String,
      enum: ['None', 'Minor', 'Moderate', 'Severe', 'Life Threatening'],
    },
    propertyDamage: {
      type: String,
      enum: ['None', 'Minor', 'Moderate', 'Severe', 'Total Loss'],
    },
    environmentalImpact: {
      type: String,
      enum: ['None', 'Minor', 'Moderate', 'Severe', 'Critical'],
    },
    affectedPersons: { type: Number, default: 0 },
    affectedAnimals: { type: Number, default: 0 },
  },
  media: {
    images: [{
      public_id: { type: String },
      url: { type: String },
      thumbnail_url: { type: String },
      description: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    videos: [{
      public_id: { type: String },
      url: { type: String },
      description: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    audioRecordings: [{
      public_id: { type: String },
      url: { type: String },
      description: { type: String },
      duration: { type: Number }, // in seconds
      uploadedAt: { type: Date, default: Date.now },
    }],
  },
  assignment: {
    callOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedRole: {
      type: String,
      enum: ['Emergency Officer', 'Veterinarian', 'Wild Park Officer', 'Admin'],
    },
    assignedAt: { type: Date },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    estimatedArrivalTime: { type: Date },
    actualArrivalTime: { type: Date },
  },
  response: {
    acknowledgedAt: { type: Date },
    responseStarted: { type: Date },
    responseCompleted: { type: Date },
    responseTime: { type: Number }, // in minutes
    actions: [{
      action: { type: String, required: true },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      performedAt: { type: Date, default: Date.now },
      notes: { type: String },
      effectiveness: {
        type: String,
        enum: ['Successful', 'Partially Successful', 'Unsuccessful'],
      },
    }],
    resources: [{
      type: { type: String }, // Personnel, Equipment, Vehicle, etc.
      description: { type: String },
      quantity: { type: Number },
      assignedAt: { type: Date, default: Date.now },
    }],
    outcome: {
      type: String,
      enum: ['Resolved', 'Partially Resolved', 'Escalated', 'Referred', 'Ongoing'],
    },
    casualties: {
      human: {
        injured: { type: Number, default: 0 },
        hospitalized: { type: Number, default: 0 },
        fatalities: { type: Number, default: 0 },
      },
      animal: {
        injured: { type: Number, default: 0 },
        relocated: { type: Number, default: 0 },
        fatalities: { type: Number, default: 0 },
      },
    },
  },
  followUp: {
    required: { type: Boolean, default: false },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    notes: { type: String },
    preventiveMeasures: [{ type: String }],
  },
  communication: {
    updates: [{
      message: { type: String, required: true },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: { type: Date, default: Date.now },
      recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      method: {
        type: String,
        enum: ['App Notification', 'SMS', 'Email', 'Radio', 'Phone Call'],
      },
    }],
    externalNotifications: [{
      organization: { type: String }, // Police, Hospital, Fire Department, etc.
      contact: { type: String },
      notifiedAt: { type: Date },
      response: { type: String },
    }],
  },
  costs: {
    personnel: { type: Number, default: 0 },
    equipment: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' },
  },
  investigation: {
    required: { type: Boolean, default: false },
    investigator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    findings: { type: String },
    recommendations: [{ type: String }],
    reportUrl: { type: String }, // Investigation report PDF
  },
  adminNotes: [{
    note: { type: String },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false },
  }],
  tags: [{ type: String }], // For categorization and search
  
  // Legacy fields for backward compatibility
  description: { type: String },
  location: { type: String },
  date: { type: Date },
  time: { type: String },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to generate emergency ID and calculate costs
emergencySchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastEmergency = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastEmergency && lastEmergency.emergencyId) {
      const lastId = parseInt(lastEmergency.emergencyId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.emergencyId = `EMG-${String(nextId).padStart(6, '0')}`;
  }
  
  // Backward compatibility: populate new fields from legacy fields
  if (this.description && !this.incident.description) {
    this.incident.description = this.description;
    this.incident.title = this.description.substring(0, 50) + '...';
  }
  if (this.location && !this.incident.location.name) {
    this.incident.location.name = this.location;
  }
  if (this.date && !this.incident.timeOfIncident) {
    this.incident.timeOfIncident = this.date;
  }
  
  // Calculate total costs
  this.costs.total = this.costs.personnel + this.costs.equipment + 
                     this.costs.medical + this.costs.transportation + this.costs.other;
  
  // Calculate response time if both start and completion times exist
  if (this.response.responseStarted && this.response.responseCompleted) {
    const diffMs = this.response.responseCompleted - this.response.responseStarted;
    this.response.responseTime = Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if emergency is critical
emergencySchema.virtual('isCritical').get(function() {
  return this.priority === 'Critical' || 
         this.severity.injuryLevel === 'Life Threatening' ||
         this.severity.environmentalImpact === 'Critical';
});

// Virtual for checking if emergency is overdue
emergencySchema.virtual('isOverdue').get(function() {
  if (this.status === 'Resolved' || this.status === 'Closed') return false;
  
  const now = new Date();
  const reportTime = this.incident.timeReported;
  const hoursDiff = (now - reportTime) / (1000 * 60 * 60);
  
  // Critical emergencies should be responded to within 1 hour
  if (this.priority === 'Critical' && hoursDiff > 1) return true;
  // High priority within 4 hours
  if (this.priority === 'High' && hoursDiff > 4) return true;
  // Medium priority within 24 hours
  if (this.priority === 'Medium' && hoursDiff > 24) return true;
  // Low priority within 72 hours
  if (this.priority === 'Low' && hoursDiff > 72) return true;
  
  return false;
});

// Indexes for better performance
emergencySchema.index({ type: 1 });
emergencySchema.index({ category: 1 });
emergencySchema.index({ priority: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ 'assignment.assignedTo': 1 });
emergencySchema.index({ 'assignment.callOperator': 1 });
emergencySchema.index({ 'incident.timeReported': -1 });
emergencySchema.index({ 'incident.location.coordinates': '2dsphere' });
emergencySchema.index({ tags: 1 });

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;
