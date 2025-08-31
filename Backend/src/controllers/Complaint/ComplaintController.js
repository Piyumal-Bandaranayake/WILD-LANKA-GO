import Complaint from "../../models/Complaint/ComplaintModel.js";
import { jsPDF } from "jspdf";

// Add complaint (Tourist, Guide, Driver)
const addComplaint = async (req, res) => {
  try {
    const { username, role, message, email, location } = req.body;

    if (!username || !role || !message || !email) {
      return res.status(400).json({ message: "Fields (username, role, email, message) are required" });
    }

    const complaint = new Complaint({ 
      username, 
      role, 
      email,
      message, 
      location: location || "" // optional
    });
    await complaint.save();

    res.status(201).json({ message: "Complaint filed successfully", complaint });
  } catch (err) {
    res.status(500).json({ message: "Error adding complaint", error: err.message });
  }
};

// Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching complaints", error: err.message });
  }
};

// Get complaint by ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.status(200).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error fetching complaint", error: err.message });
  }
};

// Update complaint (by complainant) - only message and location can be updated
const updateComplaint = async (req, res) => {
  try {
    const { message, location } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (complaint.username !== req.body.username) {
      return res.status(403).json({ message: "You can only update your own complaint" });
    }

    complaint.message = message || complaint.message;
    complaint.location = location || complaint.location;

    await complaint.save();
    res.status(200).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error updating complaint", error: err.message });
  }
};

// Delete complaint (by complainant)
const deleteComplaint = async (req, res) => {
  try {
     const { email } = req.query;  // take email from request query

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (complaint.email !== email) {
      return res.status(403).json({ message: "You can only delete your own complaint" });
    }

    await complaint.deleteOne();
    res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting complaint", error: err.message });
  }
};

// Wildlife Officer: Reply to complaint
const addReply = async (req, res) => {
  try {
    const { officerUsername, message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.replies.push({ officerUsername, message });
    await complaint.save();

    res.status(201).json({ message: "Reply added successfully", complaint });
  } catch (err) {
    res.status(500).json({ message: "Error replying to complaint", error: err.message });
  }
};

// Wildlife Officer: Edit reply
const updateReply = async (req, res) => {
  try {
    const { replyId, message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const reply = complaint.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    reply.message = message || reply.message;
    await complaint.save();

    res.status(200).json({ message: "Reply updated", complaint });
  } catch (err) {
    res.status(500).json({ message: "Error updating reply", error: err.message });
  }
};

// Wildlife Officer: Delete reply (via query param)
const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.query; // ✅ get from query param
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.replies = complaint.replies.filter(r => r._id.toString() !== replyId);
    await complaint.save();

    res.status(200).json({ message: "Reply deleted", complaint });
  } catch (err) {
    res.status(500).json({ message: "Error deleting reply", error: err.message });
  }
};

// Wildlife Officer: Generate PDF
const generateComplaintPDF = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Complaint Report", 20, 20);
    doc.text(`Username: ${complaint.username}`, 20, 40);
    doc.text(`Role: ${complaint.role}`, 20, 50);
    doc.text(`Email: ${complaint.email}`, 20, 60);
    doc.text(`Message: ${complaint.message}`, 20, 70);
    doc.text(`Location: ${complaint.location || "Not provided"}`, 20, 80);

    let y = 100;
    complaint.replies.forEach((reply, i) => {
      doc.text(`Reply ${i + 1} by ${reply.officerUsername}: ${reply.message}`, 20, y);
      y += 10;
    });

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=complaint.pdf");
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

export {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  addReply,
  updateReply,
  deleteReply,
  generateComplaintPDF
};
