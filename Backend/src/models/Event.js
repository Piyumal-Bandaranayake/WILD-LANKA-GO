import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Wildlife Workshop', 'Conservation Talk', 'Photography Tour', 'Night Safari', 'Bird Watching', 'Educational Program', 'Special Occasion', 'Other'],
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Public', 'Private', 'VIP', 'Educational', 'Corporate'],
    default: 'Public',
  },
  dateTime: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true },   // HH:MM format
  },
  location: {
    venue: { type: String, required: true },
    address: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    meetingPoint: { type: String },
  },
  capacity: {
    maxSlots: { type: Number, required: true, min: 1 },
    availableSlots: { type: Number, required: true },
    reservedSlots: { type: Number, default: 0 },
    minimumParticipants: { type: Number, default: 1 },
  },
  pricing: {
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    discounts: [{
      type: { type: String }, // 'Early Bird', 'Group', 'Student', etc.
      percentage: { type: Number, min: 0, max: 100 },
      amount: { type: Number, min: 0 },
      validUntil: { type: Date },
      minParticipants: { type: Number, default: 1 },
    }],
    includes: [{ type: String }], // What's included in the price
    excludes: [{ type: String }], // What's not included
  },
  organizers: [{
    name: { type: String, required: true },
    role: { type: String },
    contact: { type: String },
    bio: { type: String },
  }],
  requirements: {
    ageRestriction: {
      minimum: { type: Number, default: 0 },
      maximum: { type: Number },
    },
    fitnessLevel: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging', 'Extreme'],
      default: 'Easy',
    },
    equipment: [{ type: String }], // Required equipment
    recommendations: [{ type: String }], // Recommended items to bring
  },
  media: {
    images: [{
      public_id: { type: String, required: true },
      url: { type: String, required: true },
      thumbnail_url: { type: String },
      description: { type: String },
      isPrimary: { type: Boolean, default: false },
    }],
    videos: [{
      public_id: { type: String },
      url: { type: String },
      thumbnail_url: { type: String },
      description: { type: String },
    }],
  },
  registrations: [{
    registrationId: { type: String, unique: true },
    tourist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: {
      adults: { type: Number, default: 1, min: 0 },
      children: { type: Number, default: 0, min: 0 },
      seniors: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 1 },
    },
    contactInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    specialRequests: { type: String },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Confirmed', 'Pending', 'Cancelled', 'Waitlist'],
      default: 'Confirmed',
    },
    payment: {
      amount: { type: Number, required: true },
      method: { type: String },
      transactionId: { type: String },
      paymentDate: { type: Date },
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending',
      },
    },
    cancellation: {
      cancelledAt: { type: Date },
      reason: { type: String },
      refundAmount: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['Not Applicable', 'Pending', 'Processed', 'Rejected'],
        default: 'Not Applicable',
      },
    },
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Active', 'Cancelled', 'Completed', 'Postponed'],
    default: 'Draft',
  },
  cancellationPolicy: {
    type: String,
    default: 'Cancellations allowed up to 24 hours before the event.',
  },
  weatherDependent: {
    type: Boolean,
    default: false,
  },
  tags: [{ type: String }], // For search and categorization
  seoData: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to generate event ID and manage slots
eventSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastEvent = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastEvent && lastEvent.eventId) {
      const lastId = parseInt(lastEvent.eventId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.eventId = `EVT-${String(nextId).padStart(5, '0')}`;
    
    // Initialize available slots
    this.capacity.availableSlots = this.capacity.maxSlots;
  }
  
  // Calculate available slots based on registrations
  const totalRegistered = this.registrations
    .filter(reg => reg.status === 'Confirmed')
    .reduce((sum, reg) => sum + reg.participants.total, 0);
  
  this.capacity.availableSlots = this.capacity.maxSlots - totalRegistered;
  this.capacity.reservedSlots = totalRegistered;
  
  // Generate unique registration IDs for new registrations
  this.registrations.forEach((registration, index) => {
    if (!registration.registrationId) {
      registration.registrationId = `${this.eventId}-REG-${String(index + 1).padStart(3, '0')}`;
    }
  });
  
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.capacity.availableSlots <= 0;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.dateTime.startDate > new Date();
});

// Virtual for checking if event is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.dateTime.startDate <= now && this.dateTime.endDate >= now;
});

// Indexes for better performance
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ 'dateTime.startDate': 1 });
eventSchema.index({ 'capacity.availableSlots': 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;