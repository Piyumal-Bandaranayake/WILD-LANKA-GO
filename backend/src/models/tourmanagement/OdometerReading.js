// src/models/tourmanagement/OdometerReading.js
const mongoose = require('mongoose');

const odometerReadingSchema = new mongoose.Schema({
  // Who submitted the reading
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SystemUser', 
    required: true 
  },
  
  // Which tour this reading is for
  tourId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tour', 
    required: true 
  },
  
  // Reading details
  reading: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  // Type of reading (start or end of tour)
  type: { 
    type: String, 
    enum: ['start', 'end'], 
    required: true 
  },
  
  // Image evidence
  imageUrl: { 
    type: String, 
    required: true 
  },
  
  // Metadata
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Status for tracking
  status: { 
    type: String, 
    enum: ['submitted', 'verified', 'rejected'], 
    default: 'submitted' 
  },
  
  // Optional notes
  notes: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
odometerReadingSchema.index({ driverId: 1, tourId: 1 });
odometerReadingSchema.index({ submittedAt: -1 });

const OdometerReading = mongoose.model('OdometerReading', odometerReadingSchema);
module.exports = OdometerReading;
