import express from "express";
import {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  addReply,
  updateReply,
  deleteReply,
  generateComplaintPDF
} from "../../controllers/Complaint/ComplaintController.js";

const router = express.Router();

// File a complaint
router.post("/", addComplaint);

// Get all complaints
router.get("/", getAllComplaints);

// Get complaint by ID
router.get("/:id", getComplaintById);

// Update complaint
router.put("/:id", updateComplaint);

// Delete complaint
router.delete("/:id", deleteComplaint);

// Wildlife Officer reply
router.post("/:id/reply", addReply);

// Wildlife Officer edit reply
router.put("/:id/reply", updateReply);

// Wildlife Officer delete reply
router.delete("/:id/reply", deleteReply);

// Wildlife Officer generate PDF
router.get("/:id/pdf", generateComplaintPDF);

export default router;
