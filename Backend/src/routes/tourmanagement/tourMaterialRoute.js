import express from "express";
import flexibleAuthMiddleware from '../../middleware/flexibleAuthMiddleware.js';
import {
  uploadMaterial,
  getAllMaterials,
  getMaterialById,
  getMaterialsByTour,
  deleteMaterial
} from "../../controllers/tourmanagement/tourMaterialController.js";

const router = express.Router();

// Upload material
router.post("/upload", uploadMaterial);

// Get all materials
router.get("/", flexibleAuthMiddleware, getAllMaterials);

// Get material by ID
router.get("/:id", getMaterialById);

// Get materials for a specific tour
router.get("/tour/:tourId", getMaterialsByTour);

// Delete a material
router.delete("/:id", flexibleAuthMiddleware, deleteMaterial);

export default router;
