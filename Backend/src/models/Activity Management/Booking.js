import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: false, // Allow anonymous bookings for tourists
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  numberOfParticipants: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  },
  requestTourGuide: {
    type: Boolean,
    default: false,
  }, // Indicates if the user requested a tour guide
  preferredDate: {
    type: Date,
  },
  // Tourist information for anonymous bookings
  touristName: {
    type: String,
  },
  touristEmail: {
    type: String,
  },
  touristPhone: {
    type: String,
  },
  specialRequests: {
    type: String,
  },
  totalAmount: {
    type: Number,
  },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
