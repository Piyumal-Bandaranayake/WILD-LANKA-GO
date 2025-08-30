import express from "express";
import { 
  addFeedback, 
  getAllFeedbacks, 
  getFeedbackByUsername, 
  getFeedbackById, 
  updateFeedback 
} from "../../controllers/Feedback/FeedbackController.js";

const router = express.Router();

// Insert feedback
router.post("/", addFeedback);
router.post("/add", addFeedback);  // optional alias

// Get all feedbacks
router.get("/", getAllFeedbacks);

// Get feedback by feedback ID
router.get("/id/:id", getFeedbackById);

// Get feedbacks by driver username
router.get("/user/:username", getFeedbackByUsername);

// Update feedback by ID
router.put("/:id", updateFeedback);

export default router;
