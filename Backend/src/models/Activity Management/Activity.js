import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },  // Name of the activity (e.g., "Safari Tour")
  description: { type: String, required: true },  // Description of the activity
  location: { type: String, required: true },  // Location where the activity will take place
 
  duration: { type: String, required: true },  // Duration of the activity (e.g., "2 hours")
  activityType: { type: String, enum: ['Safari', 'Bird Watching', 'Photography', 'Accommodations','Tree house', 'Other'], required: true },  // Activity type
  price: { type: Number, required: true, min: [0, 'Price must be a positive value']  },  // Ensure the price is a positive number // Price of the activity (if applicable)
    images: { 
    type: [String], 
    default: [] 
  }, // Array of image URLs
 // Image URL for the activity
  availableSlotsByDate: { 
    type: Map, 
    of: Number,  // Store available slots for each date
  },
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;


