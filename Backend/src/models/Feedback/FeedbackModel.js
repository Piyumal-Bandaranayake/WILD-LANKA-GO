import mongoose from "mongoose";
const { Schema } = mongoose;

const feedbackSchema = new Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },
    tourGuideName: { type: String, default: "" },
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
    images: { type: [String], default: [] },
    date: { type: Date, default: Date.now }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
