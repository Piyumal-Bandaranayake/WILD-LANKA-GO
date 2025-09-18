import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  touristId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tourist',  // Reference to the User (Tourist)
    required: true 
  }, 
  
  activityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity',  // Reference to the Activity (e.g., Safari Tour)
    required: true 
  },   
  bookingDate: { 
    type: Date, 
    default: Date.now 
  },  // Date when the booking was made
  
  
  numberOfParticipants: { 
    type: Number, 
    required: true, 
    min: 1 
  }, 
  requestTourGuide: { 
    type: Boolean, 
    default: false 
  }, // Indicates if the tourist requested a tour guide
    preferredDate: { 
    type: Date, 
    required: true 
  },

   tourId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tour',  // Reference to the Tour model
    default: null 
  } // New field to store the Tour reference

},{ timestamps: true });  // Number of participants for the booking


// Create the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
