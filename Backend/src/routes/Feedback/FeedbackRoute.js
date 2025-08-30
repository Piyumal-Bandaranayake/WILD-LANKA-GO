// routes/Feedback/FeedbackRoute.js
import express from "express";
import {
    addFeedback,
    getAllFeedbacks,
    getFeedbackByUsername,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    addOrUpdateReply
} from "../../controllers/Feedback/FeedbackController.js";

const router = express.Router();

// User adds feedback
router.post("/", addFeedback);

// Get all feedbacks (optional filter ?userType=driver/tourist/tourguide)
router.get("/", getAllFeedbacks);

// Get feedback by ID
router.get("/id/:id", getFeedbackById);

// Get feedbacks by username
router.get("/user/:username", getFeedbackByUsername);

// Update feedback message
router.put("/:id", updateFeedback);

// Delete feedback
router.delete("/:id", deleteFeedback);

// Call operator / wildlife officer / admin adds or edits reply
router.put("/reply/:id", addOrUpdateReply);

export default router;
