import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  // Reference to the original booking (from tourist)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'booking', // must match your Booking model
    required: true,
    unique: true // One tour per booking
  },

  // Assigned by the Wildlife Park Officer
  assignedTourGuide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tourGuide', // your TourGuide model
    default: null,
  },

  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'safariDriver', // your SafariDriver model
    default: null,
  },

  // Updated by Tour Guide (or Driver if needed)
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Started', 'Ended'],
    default: 'Pending',
  },

}, {
  timestamps: true
});

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
