import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  touristId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Reference to the User (Tourist)
    required: true 
  },
  
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event',  // Reference to the Event being registered for
    required: true 
  },
  
  numberOfParticipants: { 
    type: Number, 
    required: true, 
    min: 1 
  },  // Number of participants for the event registration
  
  status: { 
    type: String, 
    enum: ['Registered', 'Cancelled'], 
    default: 'Registered' 
  },  // Status of the registration (Registered or Cancelled)
  
  registrationDate: { 
    type: Date, 
    default: Date.now 
  }  // Date of registration
});

// Create the EventRegistration model
const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

export default EventRegistration;
