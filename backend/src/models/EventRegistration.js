const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  // Registration ID
  registrationId: {
    type: String,
    unique: true,
    required: true,
  },
  
  // References
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tourist',
    required: [true, 'User is required'],
  },
  
  // Registration Details
  participants: {
    type: Number,
    required: [true, 'Number of participants is required'],
    min: [1, 'Must have at least 1 participant'],
  },
  
  // Status
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled', 'no_show'],
    default: 'registered',
  },
  
  // Dates
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  cancellationDate: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
  },
  attendanceDate: {
    type: Date,
  },
  
  // Contact Information (at time of registration)
  contactInfo: {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
      default: 'Not provided',
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  
  // Special Requirements
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters'],
  },
  dietaryRequirements: [String],
  accessibilityNeeds: [String],
  
  // Payment Information (if event has a fee)
  payment: {
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'waived'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'online', 'bank_transfer', 'free'],
      default: 'free',
    },
    transactionId: String,
    paymentDate: Date,
  },
  
  // Feedback and Rating (post-event)
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [1000, 'Feedback comment cannot exceed 1000 characters'],
    },
    submittedAt: Date,
  },
  
  // Administrative
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
}, {
  timestamps: true,
  collection: 'eventregistrations', // Explicit collection name
});

// Indexes (registrationId index is created by unique: true, so we don't need to add it again)
eventRegistrationSchema.index({ event: 1 });
eventRegistrationSchema.index({ user: 1 });
eventRegistrationSchema.index({ status: 1 });
eventRegistrationSchema.index({ registrationDate: -1 });
eventRegistrationSchema.index({ event: 1, user: 1 }); // Compound index for checking duplicates
eventRegistrationSchema.index({ createdAt: -1 });

// Pre-save middleware to generate registration ID
eventRegistrationSchema.pre('save', function(next) {
  if (!this.registrationId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.registrationId = `EVT-${year}${month}${day}-${random}`;
  }
  next();
});

// Virtual for registration age in days
eventRegistrationSchema.virtual('registrationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.registrationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to check if registration can be cancelled
eventRegistrationSchema.methods.canBeCancelled = function() {
  if (this.status !== 'registered') {
    return false;
  }
  
  // Allow cancellation up to 24 hours before event
  const Event = mongoose.model('Event');
  return Event.findById(this.event).then(event => {
    if (!event) return false;
    
    const now = new Date();
    const eventDateTime = new Date(event.date);
    const hoursDifference = (eventDateTime - now) / (1000 * 60 * 60);
    
    return hoursDifference > 24;
  });
};

// Instance method to cancel registration
eventRegistrationSchema.methods.cancel = function(reason = '') {
  this.status = 'cancelled';
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Instance method to mark as attended
eventRegistrationSchema.methods.markAttended = function() {
  this.status = 'attended';
  this.attendanceDate = new Date();
  return this.save();
};

// Static method to find registrations by event
eventRegistrationSchema.statics.findByEvent = function(eventId, status = null) {
  const query = { event: eventId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('user', 'firstName lastName email phone');
};

// Static method to find registrations by user
eventRegistrationSchema.statics.findByUser = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('event', 'title date time location');
};

// Static method to check if user is already registered for event
eventRegistrationSchema.statics.isUserRegistered = function(eventId, userId) {
  return this.findOne({
    event: eventId,
    user: userId,
    status: 'registered'
  });
};

// Static method to get registration statistics
eventRegistrationSchema.statics.getStats = function(eventId = null) {
  const match = eventId ? { event: mongoose.Types.ObjectId(eventId) } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalParticipants: { $sum: '$participants' }
      }
    }
  ]);
};

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
