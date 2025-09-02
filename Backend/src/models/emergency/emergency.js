import mongoose from 'mongoose';


const emergencySchema = new mongoose.Schema({
    
    type: {
        type: String, // animal, physical, unethical, or human
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved'], // Available statuses
        default: 'pending',  // Default status when the emergency is created
    },
});

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;
