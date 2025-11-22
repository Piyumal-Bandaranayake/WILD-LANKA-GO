const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format'],
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
  },
  maxSlots: {
    type: Number,
    required: [true, 'Maximum slots is required'],
    min: [1, 'Must have at least 1 slot'],
  },
  availableSlots: {
    type: Number,
    required: true,
    min: [0, 'Available slots cannot be negative'],
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative'],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  images: [{
    type: String,
  }],
  duration: {
    type: String,
    default: '3 hours',
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  category: {
    type: String,
    enum: ['workshop', 'seminar', 'conservation', 'educational', 'community', 'fundraising', 'Other'],
    default: 'Other',
  },
  requirements: [{
    type: String,
    trim: true,
  }],
  includes: [{
    type: String,
    trim: true,
  }],
  organizer: {
    name: {
      type: String,
      default: 'Wild Lanka Go',
    },
    contact: {
      type: String,
      default: '+94 XX XXX XXXX',
    },
    email: {
      type: String,
      default: 'info@wildlankago.com',
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    }
  },
  // Registrations are now stored in separate EventRegistration collection
  // This field is kept for backward compatibility but should not be used
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
}, {
  timestamps: true,
});

// Indexes
eventSchema.index({ title: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });

// Virtual for registration count (using separate collection)
eventSchema.virtual('registrationCount', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'event',
  count: true,
  match: { status: 'registered' }
});

// Virtual to populate registrations from separate collection
eventSchema.virtual('registrations', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'event'
});

// Pre-save middleware to set availableSlots initially
eventSchema.pre('save', function(next) {
  if (this.isNew && this.availableSlots === undefined) {
    this.availableSlots = this.maxSlots;
  }
  next();
});

// Instance method to register user for event (using separate collection)
eventSchema.methods.registerUser = async function(userId, participantCount = 1) {
  const EventRegistration = mongoose.model('EventRegistration');
  const Tourist = mongoose.model('Tourist');
  
  if (this.availableSlots < participantCount) {
    throw new Error(`Not enough available slots. Only ${this.availableSlots} slots remaining, but ${participantCount} participants requested.`);
  }
  
  // Check if user is already registered
  const existingRegistration = await EventRegistration.isUserRegistered(this._id, userId);
  if (existingRegistration) {
    throw new Error('User is already registered for this event');
  }
  
  // Get user details for contact info
  console.log('Looking for user with ID:', userId);
  const user = await Tourist.findById(userId);
  if (!user) {
    console.error('User not found in Tourist collection:', userId);
    // Try to find in SystemUser collection as fallback
    const SystemUser = mongoose.model('SystemUser');
    const systemUser = await SystemUser.findById(userId);
    if (systemUser) {
      console.error('User found in SystemUser collection but not in Tourist collection:', {
        id: systemUser._id,
        email: systemUser.email,
        role: systemUser.role
      });
      throw new Error('User is not a tourist. Only tourists can register for events.');
    }
    throw new Error('User not found in any collection');
  }
  
  console.log('User found for registration:', {
    id: user._id,
    email: user.email,
    phone: user.phone,
    hasEmergencyContact: !!user.emergencyContact,
    role: user.role,
    status: user.status
  });
  
  // Validate required user fields
  if (!user.email) {
    throw new Error('User email is required for registration');
  }
  
  // Ensure phone is available or provide fallback
  const phoneNumber = user.phone || 'Not provided';
  console.log('Phone number for registration:', phoneNumber);
  
  // Create new registration
  const registration = new EventRegistration({
    event: this._id,
    user: userId,
    participants: participantCount,
    contactInfo: {
      email: user.email,
      phone: phoneNumber,
      emergencyContact: user.emergencyContact || {}
    },
    payment: {
      amount: 0,
      status: 'waived',
      method: 'free'
    }
  });
  
  // Generate registration ID before validation
  if (!registration.registrationId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    registration.registrationId = `EVT-${year}${month}${day}-${random}`;
  }
  
  console.log('Attempting to save registration:', {
    eventId: this._id,
    userId,
    participants: participantCount,
    registrationId: registration.registrationId,
    contactInfo: registration.contactInfo,
    payment: registration.payment
  });
  
  // Validate registration object before saving
  const validationError = registration.validateSync();
  if (validationError) {
    console.error('Registration validation error:', validationError);
    throw new Error(`Registration validation failed: ${validationError.message}`);
  }
  
  try {
    await registration.save();
    console.log('Registration saved successfully:', registration._id);
  } catch (saveError) {
    console.error('Error saving registration:', {
      message: saveError.message,
      name: saveError.name,
      errors: saveError.errors,
      stack: saveError.stack
    });
    
    // Handle specific MongoDB errors
    if (saveError.name === 'ValidationError') {
      const errorMessages = Object.values(saveError.errors).map(err => err.message);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    
    if (saveError.code === 11000) {
      throw new Error('Registration ID already exists. Please try again.');
    }
    
    throw new Error(`Failed to save registration: ${saveError.message}`);
  }
  
  // Update available slots
  this.availableSlots -= participantCount;
  await this.save();
  
  return registration;
};

// Instance method to cancel registration (using separate collection)
eventSchema.methods.cancelRegistration = async function(userId) {
  const EventRegistration = mongoose.model('EventRegistration');
  
  const registration = await EventRegistration.findOne({
    event: this._id,
    user: userId,
    status: 'registered'
  });
  
  if (!registration) {
    throw new Error('Registration not found');
  }
  
  const participantCount = registration.participants;
  
  // Cancel the registration
  await registration.cancel('Cancelled by user');
  
  // Restore available slots
  this.availableSlots += participantCount;
  await this.save();
  
  return registration;
};

// Instance method to recalculate available slots based on actual registrations
eventSchema.methods.recalculateAvailableSlots = async function() {
  const EventRegistration = mongoose.model('EventRegistration');
  
  // Count total participants from active registrations
  const registrations = await EventRegistration.find({
    event: this._id,
    status: 'registered'
  });
  
  const totalRegisteredParticipants = registrations.reduce((sum, reg) => sum + reg.participants, 0);
  
  // Recalculate available slots
  this.availableSlots = this.maxSlots - totalRegisteredParticipants;
  
  console.log(`Recalculated slots for event ${this.title}:`, {
    maxSlots: this.maxSlots,
    registeredParticipants: totalRegisteredParticipants,
    availableSlots: this.availableSlots
  });
  
  return this.save();
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function() {
  return this.find({ 
    date: { $gte: new Date() },
    status: 'upcoming'
  }).sort({ date: 1 });
};

// Static method to find by category
eventSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category,
    date: { $gte: new Date() },
    status: 'upcoming'
  }).sort({ date: 1 });
};

// Static method to recalculate available slots for all events
eventSchema.statics.recalculateAllAvailableSlots = async function() {
  const events = await this.find({});
  const results = [];
  
  for (const event of events) {
    try {
      await event.recalculateAvailableSlots();
      results.push({
        eventId: event._id,
        title: event.title,
        status: 'success',
        availableSlots: event.availableSlots
      });
    } catch (error) {
      results.push({
        eventId: event._id,
        title: event.title,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('Event', eventSchema);
