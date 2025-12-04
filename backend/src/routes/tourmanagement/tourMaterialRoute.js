const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../../middleware/authMiddleware");
const {
  uploadMaterial,
  getAllMaterials,
  getMaterialById,
  getMaterialsByTour,
  deleteMaterial
} = require("../../controllers/tourmanagement/tourMaterialController");

const router = express.Router();
const { uploadImage } = require('../../../config/cloudinary');

// Apply authentication middleware to all tour material routes
router.use(authenticate);

// Configure multer for memory storage (uploads to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024,  // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow various file types for tour materials
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4|wav/;
    const isValidExtname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMimetype = allowedFileTypes.test(file.mimetype);

    if (isValidExtname && isValidMimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, audio, and video files are allowed.'));
    }
  }
});

// Upload material with file
router.post("/upload", upload.single('file'), uploadMaterial);

// Get all materials
router.get("/", getAllMaterials);

// Get material by ID
router.get("/:id", getMaterialById);

// Get materials for a specific tour
router.get("/tour/:tourId", getMaterialsByTour);

// Delete a material
router.delete("/:id", deleteMaterial);

module.exports = router;
