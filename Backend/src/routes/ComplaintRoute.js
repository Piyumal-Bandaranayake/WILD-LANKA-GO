const express = require('express');
const {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  deleteComplaintByOfficer,
  addReply,
  updateReply,
  deleteReply,
  generateComplaintPDF,
  // Wildlife Officer Search Functions
  searchComplaints,
  advancedSearchComplaints,
  getComplaintStats
} = require('../controllers/ComplaintController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// File a complaint (authenticated users only)
router.post("/", authenticate, authorize('tourist', 'tourGuide', 'safariDriver'), addComplaint);

// Get all complaints (admin, wildlife officers, and call operators only)
router.get("/", authenticate, authorize('admin', 'wildlifeOfficer', 'callOperator'), getAllComplaints);

// Wildlife Officer Search Routes (must be before /:id route)
// Basic search by username or ID (admin and wildlife officers only)
router.get("/search", authenticate, authorize('admin', 'wildlifeOfficer'), searchComplaints);

// Advanced search with filters (admin and wildlife officers only)
router.get("/search/advanced", authenticate, authorize('admin', 'wildlifeOfficer'), advancedSearchComplaints);

// Get complaint statistics (admin, wildlife officers, and call operators only)
router.get("/stats", authenticate, authorize('admin', 'wildlifeOfficer', 'callOperator'), getComplaintStats);

// Get complaint by ID (admin, wildlife officers, and call operators only)
router.get("/:id", authenticate, authorize('admin', 'wildlifeOfficer', 'callOperator'), getComplaintById);

// Update complaint (by complainant)
router.put("/:id", authenticate, authorize('tourist', 'tourGuide', 'safariDriver'), updateComplaint);

// Delete complaint (by complainant)
router.delete("/:id", authenticate, authorize('tourist', 'tourGuide', 'safariDriver'), deleteComplaint);

// Wildlife Officer delete complaint (with all replies)
router.delete("/:id/officer", authenticate, authorize('admin', 'wildlifeOfficer'), deleteComplaintByOfficer);

// Wildlife Officer reply
router.post("/:id/reply", authenticate, authorize('admin', 'wildlifeOfficer'), addReply);

// Wildlife Officer edit reply
router.put("/:id/reply", authenticate, authorize('admin', 'wildlifeOfficer'), updateReply);

// Wildlife Officer delete reply
router.delete("/:id/reply", authenticate, authorize('admin', 'wildlifeOfficer'), deleteReply);

// Wildlife Officer generate PDF
router.get("/:id/pdf", authenticate, authorize('admin', 'wildlifeOfficer'), generateComplaintPDF);

module.exports = router;
