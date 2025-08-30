import express from "express";
import multer from "multer";
import {
    addFeedback,
    getAllFeedbacks,
    getFeedbackById,
    updateFeedback,
    deleteFeedbackByTourist,
    deleteFeedbackByOperator
} from "../../controllers/Feedback/FeedbackController.js";

const router = express.Router();

// ✅ Multer config for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Tourist adds feedback with image upload
router.post("/", upload.array("images", 5), addFeedback);

// Get all feedbacks
router.get("/", getAllFeedbacks);

// Get feedback by ID
router.get("/:id", getFeedbackById);

// Update feedback
router.put("/:id", upload.array("images", 5), updateFeedback);

// Delete feedback (tourist)
router.delete("/tourist/:id", deleteFeedbackByTourist);

// Delete feedback (operator)
router.delete("/operator/:id", deleteFeedbackByOperator);

export default router;
