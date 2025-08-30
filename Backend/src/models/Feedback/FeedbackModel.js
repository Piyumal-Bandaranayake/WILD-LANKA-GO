// models/Feedback/FeedbackModel.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const feedbackSchema = new Schema({
    username: { 
        type: String, 
        required: true 
    },
    userType: { 
        type: String, 
        enum: ['driver', 'tourist', 'tourguide'], 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
});

// The model automatically stores userType when saved
const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
