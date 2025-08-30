import mongoose from "mongoose";
const { Schema } = mongoose;

// Safari driver feedback
const feedbackSchema = new Schema({
    username: {
        type: String, // Driver's username
        required: true, // Validate
    },
    message: {
        type: String, // Feedback message
        required: true, // Validate
    },
    date: {
        type: Date, // Date of feedback
        default: Date.now, // Automatically set current date
    }
});

// Create model
const Feedback = mongoose.model("FeedbackModel", feedbackSchema);

export default Feedback; // ES6 default export
