import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Name of the event (e.g., "World Wildlife Day")
    description: { type: String, required: true },  // Event description
    date: { type: Date, required: true },  // Date when the event will take place
    location: { type: String, required: true },  // Location of the event (e.g., "Wildlife Education Center")
    duration: { type: String, required: true },  // Duration of the event (e.g., "3 hours")
    availableSlots: { type: Number, required: true },  // Available slots for the event
    eventType: { type: String, enum: ['Celebration', 'Workshop', 'Talk', 'Conservation', 'Other'], required: true },  // Event type
    image: { type: String },  // Image URL for the event
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
