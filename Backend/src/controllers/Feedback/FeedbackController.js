import Tourist from "../../models/User/tourist.js";
import Feedback from "../../models/Feedback/FeedbackModel.js";

// Tourist adds feedback with images
const addFeedback = async (req, res) => {
  try {
    const { username, message, tourGuideName, eventType, activityType } = req.body;

    // Check tourist exists
    const tourist = await Tourist.findOne({ username });
    if (!tourist) return res.status(403).json({ message: "Only tourists can submit feedback" });

    // Validate required fields
    if (!message) return res.status(400).json({ message: "Feedback message is required" });
    if (!eventType && !activityType) return res.status(400).json({ message: "Event or Activity must be selected" });

    // ✅ Handle images: either JSON array from body OR uploaded files
    let imagesArray = req.body.images || [];
    
    if (typeof imagesArray === 'string') {
      try {
        imagesArray = JSON.parse(imagesArray); // Convert JSON string to array
      } catch (err) {
        imagesArray = []; // fallback if parsing fails
      }
    }

    // Add uploaded files if any (multipart/form-data)
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => `/uploads/${file.filename}`);
      imagesArray = [...imagesArray, ...uploadedImages];
    }

    const feedback = new Feedback({
      username,
      message,
      tourGuideName: tourGuideName || "",
      eventType: eventType || null,
      activityType: activityType || null,
      images: imagesArray
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback added successfully", feedback });
  } catch (err) {
    res.status(500).json({ message: "Error adding feedback", error: err.message });
  }
};

// Get all feedbacks
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ date: -1 });
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

// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const { message, tourGuideName, eventType, activityType } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    if (feedback.username !== req.body.username) return res.status(403).json({ message: "You can only update your own feedback" });

    feedback.message = message || feedback.message;
    feedback.tourGuideName = tourGuideName || feedback.tourGuideName;
    feedback.eventType = eventType || feedback.eventType;
    feedback.activityType = activityType || feedback.activityType;

    // ✅ Add new uploaded images if any
    let imagesArray = feedback.images || [];
    
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imagesArray = [...imagesArray, ...newImages];
    }

    feedback.images = imagesArray;

    await feedback.save();
    res.status(200).json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Error updating feedback", error: err.message });
  }
};

// Delete feedback (tourist)
const deleteFeedbackByTourist = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    if (feedback.username !== req.body.username) return res.status(403).json({ message: "You can only delete your own feedback" });

    await feedback.deleteOne();
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting feedback", error: err.message });
  }
};

// Delete feedback (operator)
const deleteFeedbackByOperator = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json({ message: "Feedback deleted by operator" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting feedback", error: err.message });
  }
};

export {
  addFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedbackByTourist,
  deleteFeedbackByOperator
};
