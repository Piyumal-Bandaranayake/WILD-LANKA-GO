const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  // Reference to the original booking (from tourist)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking', // must match your Booking model
    required: true,
    unique: true // One tour per booking
  },

  // Assigned by the Wildlife Park Officer
  assignedTourGuide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser', // SystemUser model for tour guides
    default: null,
  },

  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser', // SystemUser model for drivers
    default: null,
  },

  // Updated by Tour Guide (or Driver if needed)
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Started', 'Ended', 'pending', 'confirmed', 'processing', 'started', 'ended'],
    default: 'Pending',
    set: function(value) {
      // Normalize status to proper case
      if (typeof value === 'string') {
        const statusMap = {
          'pending': 'Pending',
          'confirmed': 'Confirmed', 
          'processing': 'Processing',
          'started': 'Started',
          'ended': 'Ended'
        };
        return statusMap[value.toLowerCase()] || value;
      }
      return value;
    }
  },

  // Tour notes from Wildlife Officer
  tourNotes: {
    type: String,
    default: null,
  },

  // Tour date (can be different from booking date)
  preferredDate: {
    type: Date,
    required: true,
  },
  
  tourDate: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
