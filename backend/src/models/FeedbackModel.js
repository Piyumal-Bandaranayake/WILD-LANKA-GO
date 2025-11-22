const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username is required'],
        trim: true
    },
    message: { 
        type: String, 
        required: [true, 'Feedback message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    tourGuideName: { 
        type: String, 
        default: "",
        trim: true
    },
    eventType: { 
        type: String, 
        enum: ['Celebration', 'Workshop', 'Talk', 'Conservation', 'Other'], 
        default: null 
    },
    activityType: { 
        type: String, 
        enum: ['Safari', 'Bird Watching', 'Photography', 'Accommodations', 'Other'], 
        default: null 
    },
    images: { 
        type: [String], 
        default: [] 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    // Add user reference for better tracking
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType'
    },
    userType: {
        type: String,
        enum: ['Tourist', 'SystemUser'],
        default: 'Tourist'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
