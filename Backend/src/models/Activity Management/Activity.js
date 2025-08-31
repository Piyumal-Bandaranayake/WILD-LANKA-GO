import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },  // Name of the activity (e.g., "Safari Tour")
  description: { type: String, required: true },  // Description of the activity
  location: { type: String, required: true },  // Location where the activity will take place
  availableSlots: { type: Number, required: true },  // Available slots for the activity
  duration: { type: String, required: true },  // Duration of the activity (e.g., "2 hours")
  activityType: { type: String, enum: ['Safari', 'Bird Watching', 'Photography', 'Accommodations', 'Other'], required: true },  // Activity type
  price: { type: Number, required: true, min: [0, 'Price must be a positive value']  },  // Ensure the price is a positive number // Price of the activity (if applicable)
    image: { 
    type: String 
  },  // Image URL for the activity
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
