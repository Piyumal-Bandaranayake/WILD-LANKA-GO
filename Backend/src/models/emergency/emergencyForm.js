import mongoose from 'mongoose';

const emergencyFormSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    property_name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    emergency_type: {
        type: String,
        enum: ['animal', 'physical', 'unethical', 'human'],
        required: true,
    },
    description: {
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
});

const EmergencyForm = mongoose.model('EmergencyForm', emergencyFormSchema);
export default EmergencyForm;
