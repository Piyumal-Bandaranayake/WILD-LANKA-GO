// controllers/Feedback/FeedbackController.js
import SafariDriver from "../../models/User/safariDriver.js";
import Tourist from "../../models/User/tourist.js";
import TourGuide from "../../models/User/tourGuide.js"; 
import Feedback from "../../models/Feedback/FeedbackModel.js";

// Add feedback (userType detected automatically)
const addFeedback = async (req, res) => {
    const { username, message } = req.body;

    try {
        let user = null;
        let userType = null;

        // check if driver
        user = await SafariDriver.findOne({ username });
        if (user) userType = "driver";

        // else check tourist
        if (!user) {
            user = await Tourist.findOne({ username });
            if (user) userType = "tourist";
        }

        // else check tourguide
        if (!user) {
            user = await TourGuide.findOne({ Username: username });
            if (user) userType = "tourguide";
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const feedback = new Feedback({
            username,
            userType,
            message
        });

        await feedback.save();
        res.status(200).json({ feedback });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding feedback", error: err.message });
    }
};

// Get all feedbacks (optionally filter by userType)
const getAllFeedbacks = async (req, res) => {
    try {
        const { userType } = req.query;
        let filter = {};
        if (userType && ['driver', 'tourist', 'tourguide'].includes(userType)) {
            filter.userType = userType;
        }

        const feedbacks = await Feedback.find(filter).sort({ date: -1 });
        res.status(200).json(feedbacks);

    } catch (err) {
        res.status(500).json({ message: "Error fetching feedbacks", error: err.message });
    }
};

// Get feedbacks by username
const getFeedbackByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const feedbacks = await Feedback.find({ username }).sort({ date: -1 });
        if (!feedbacks.length) return res.status(404).json({ message: "No feedback found" });
        res.status(200).json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching feedbacks", error: err.message });
    }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        res.status(200).json(feedback);
    } catch (err) {
        res.status(500).json({ message: "Error fetching feedback", error: err.message });
    }
};

// Update feedback message (user cannot change userType)
const updateFeedback = async (req, res) => {
    const { message } = req.body;
    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { message },
            { new: true }
        );
        if (!feedback) return res.status(404).json({ message: "Unable to update feedback" });
        res.status(200).json(feedback);
    } catch (err) {
        res.status(500).json({ message: "Error updating feedback", error: err.message });
    }
};

// Delete feedback (any role-based check can be added in route/middleware)
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).json({ message: "Unable to delete feedback" });
        res.status(200).json(feedback);
    } catch (err) {
        res.status(500).json({ message: "Error deleting feedback", error: err.message });
    }
};

// Add or update reply (for callOperator/wildlifeOfficer/admin)
const addOrUpdateReply = async (req, res) => {
    const { reply, repliedBy } = req.body;

    if (!reply || !repliedBy) {
        return res.status(400).json({ message: "Reply and repliedBy are required" });
    }

    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { reply, repliedBy, replyDate: new Date() },
            { new: true }
        );
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        res.status(200).json(feedback);
    } catch (err) {
        res.status(500).json({ message: "Error adding/updating reply", error: err.message });
    }
};

export { 
    addFeedback,
    getAllFeedbacks,
    getFeedbackByUsername,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    addOrUpdateReply
};
