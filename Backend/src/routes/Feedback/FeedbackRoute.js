// routes/Feedback/FeedbackRoute.js
import express from "express";
import {
    addFeedback,
    getAllFeedbacks,
    getFeedbackByUsername,
    getFeedbackById,
    updateFeedback,
    deleteFeedback
} from "../../controllers/Feedback/FeedbackController.js";

const router = express.Router();

// Add feedback
router.post("/", addFeedback);

// Get all feedbacks (optional query ?userType=driver/tourist)
router.get("/", getAllFeedbacks);

// Get feedback by ID
router.get("/id/:id", getFeedbackById);

// Get feedbacks by username
router.get("/user/:username", getFeedbackByUsername);

// Update feedback by ID
router.put("/:id", updateFeedback);

// Delete feedback by ID
router.delete("/:id", deleteFeedback);

export default router;
