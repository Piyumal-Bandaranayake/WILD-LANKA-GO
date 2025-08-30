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
    reply: {
        type: String,
        default: "" // Empty string if no operator reply yet
    },
    repliedBy: {
        type: String, // username of CallOperator/WildlifeOfficer/Admin who replied
        default: ""
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    replyDate: {
        type: Date // Timestamp of reply
    }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
