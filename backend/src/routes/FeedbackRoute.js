const express = require("express");
const multer = require("multer");
const {
    addFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedbackByUser,
} = require("../../controllers/FeedbackController");

const router = express.Router();
const { uploadImage } = require('../config/cloudinary');

// Multer configuration for memory storage (uploads to Cloudinary)
const storage = multer.memoryStorage();
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

module.exports = router;
