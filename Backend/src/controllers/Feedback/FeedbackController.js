import SafariDriver from "../../models/User/safariDriver.js";
import Feedback from "../../models/Feedback/FeedbackModel.js"; // Feedback model path

// Insert feedback
const addFeedback = async (req, res, next) => {
    const { username, message } = req.body;

    let feedback;

    try {
        // Check if driver exists
        const driver = await SafariDriver.findOne({ username });
        if (!driver) {
            return res.status(404).json({ message: "Safari Driver not found" });
        }

        // Create new feedback
        feedback = new Feedback({
            username,
            message,
            date: new Date()
        });

        await feedback.save();
    } catch (err) {
        console.log(err);
    }

    // If feedback not inserted
    if (!feedback) {
        return res.status(404).json({ message: "Unable to add feedback" });
    }

    return res.status(200).json({ feedback });
};

// Get all feedbacks
const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ date: -1 });
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks", error: error.message });
    }
};

// Get feedbacks by username
const getFeedbackByUsername = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ username: req.params.username }).sort({ date: -1 });
        if (feedbacks.length === 0) {
            return res.status(404).json({ message: "No feedback found for this driver" });
        }
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks", error: error.message });
    }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
    const id = req.params.id;

    let feedback;
    try {
        feedback = await Feedback.findById(id);
    } catch (err) {
        console.log(err);
    }

    if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json({ feedback });
};

// Update feedback by ID
const updateFeedback = async (req, res) => {
    const id = req.params.id;
    const { message } = req.body; // Only updating message here

    let feedback;
    try {
        feedback = await Feedback.findByIdAndUpdate(
            id,
            { message },
            { new: true } // Returns the updated document
        );
    } catch (err) {
        console.log(err);
    }

    if (!feedback) {
        return res.status(404).json({ message: "Unable to update feedback" });
    }

    return res.status(200).json({ feedback });
};

export { addFeedback, getAllFeedbacks, getFeedbackByUsername, getFeedbackById, updateFeedback };
