import User from "../../models/User.js";
import Feedback from "../../models/Feedback/FeedbackModel.js";

// Tourist adds feedback with images
const addFeedback = async (req, res) => {
    const { username, message, eventType, activityType } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    try {
        const newFeedback = new Feedback({
            username,
            message,
            eventType,
            activityType,
            images
        });

        await newFeedback.save();
        res.status(201).json({ message: "Feedback added successfully", feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ message: "Error adding feedback", error: error.message });
    }
};

// Get all feedback
const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find();
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedback", error: error.message });
    }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedback", error: error.message });
    }
};

// Update feedback
const updateFeedback = async (req, res) => {
    try {
        const { message, rating } = req.body;
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { message, rating },
            { new: true }
        );
        if (!updatedFeedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }
        res.status(200).json({ message: "Feedback updated successfully", feedback: updatedFeedback });
    } catch (error) {
        res.status(500).json({ message: "Error updating feedback", error: error.message });
    }
};

// Delete feedback (tourist)
const deleteFeedbackByUser = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Optional: Add authorization check to ensure only the user who created it can delete it

        await Feedback.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting feedback", error: error.message });
    }
};

export {
    addFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedbackByUser,
};
