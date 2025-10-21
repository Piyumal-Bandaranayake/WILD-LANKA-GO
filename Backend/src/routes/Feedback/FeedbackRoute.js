import express from "express";
import multer from "multer";
import {
    addFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedbackByUser,
} from "../../controllers/Feedback/FeedbackController.js";

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/feedback/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// User adds feedback with image upload
router.post("/", upload.array('images', 5), addFeedback);

// Get all feedback
router.get("/", getAllFeedback);

// Get feedback by ID
router.get("/:id", getFeedbackById);

// Update feedback
router.put("/:id", updateFeedback);

// Delete feedback (user)
router.delete("/:id", deleteFeedbackByUser);

export default router;
