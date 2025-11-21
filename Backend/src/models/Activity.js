const mongoose = require('mongoose');
const { USER_STATUS } = require('../utils/constants');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Activity price is required'],
    min: [0, 'Price cannot be negative'],
  },
  duration: {
    type: Number,
    required: [true, 'Activity duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
  },
  location: {
    type: String,
    required: [true, 'Activity location is required'],
    trim: true,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'Must allow at least 1 participant'],
  },
  dailySlots: {
    type: Number,
    required: [true, 'Daily slots is required'],
    min: [1, 'Must have at least 1 slot per day'],
  },
  availableSlots: [{
    date: {
      type: Date,
      required: true,
    },
    slots: {
      type: Number,
      required: true,
      min: [0, 'Available slots cannot be negative'],
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  category: {
    type: String,
    enum: ['safari', 'wildlife-tour', 'bird-watching', 'nature-walk', 'photography', 'adventure', 'educational'],
    required: [true, 'Activity category is required'],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'easy',
  },
  requirements: [{
    type: String,
    trim: true,
  }],
  includes: [{
    type: String,
    trim: true,
  }],
  excludes: [{
    type: String,
    trim: true,
  }],
  cancellationPolicy: {
    type: String,
    default: 'Free cancellation up to 24 hours before the activity',
  },
  
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
activitySchema.index({ title: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ price: 1 });
activitySchema.index({ 'availableSlots.date': 1 });

// Instance method to update available slots
activitySchema.methods.updateSlots = function(date, participantCount) {
  const slotIndex = this.availableSlots.findIndex(
    slot => slot.date.toDateString() === new Date(date).toDateString()
  );
  
  if (slotIndex !== -1) {
    this.availableSlots[slotIndex].slots = Math.max(0, this.availableSlots[slotIndex].slots - participantCount);
  } else {
    // Create new slot entry for the date
    this.availableSlots.push({
      date: new Date(date),
      slots: Math.max(0, this.dailySlots - participantCount)
    });
  }
  
  return this.save();
};

// Instance method to get available slots for a specific date
activitySchema.methods.getSlotsForDate = function(date) {
  const slot = this.availableSlots.find(
    slot => slot.date.toDateString() === new Date(date).toDateString()
  );
  
  return slot ? slot.slots : this.dailySlots;
};

// Static method to find active activities
activitySchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find by category
activitySchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

module.exports = mongoose.model('Activity', activitySchema);
