const Complaint = require("../models/ComplaintModel");
const { sendSuccess, sendError } = require("../utils/response");
const logger = require("../../config/logger");
const { jsPDF } = require('jspdf');

// Add complaint (Tourist, Guide, Driver)
const addComplaint = async (req, res) => {
  try {
    const { message, location } = req.body;
    const user = req.user; // From authentication middleware

    if (!message) {
      return sendError(res, "Message is required", 400);
    }

    if (!user) {
      return sendError(res, "Authentication required", 401);
    }

    // Determine user type and role
    const userType = user.userType || (user.role === 'tourist' ? 'Tourist' : 'SystemUser');
    const role = user.role;
    const username = user.firstName + ' ' + user.lastName;
    const email = user.email;

    const complaint = new Complaint({ 
      userId: user._id,
      userType,
      username, 
      role, 
      email,
      message, 
      location: location || ""
    });
    
    await complaint.save();
    logger.info(`Complaint created by ${username} (${role})`);

    return sendSuccess(res, complaint, "Complaint filed successfully");
  } catch (err) {
    logger.error('Error adding complaint:', err);
    return sendError(res, "Error adding complaint", 500);
  }
};

// Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'firstName lastName email')
      .sort({ date: -1 });
    
    logger.info(`Retrieved ${complaints.length} complaints`);
    return sendSuccess(res, complaints, "Complaints retrieved successfully");
  } catch (err) {
    logger.error('Error fetching complaints:', err);
    return sendError(res, "Error fetching complaints", 500);
  }
};

// Get complaint by ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
    
    if (!complaint) {
      return sendError(res, "Complaint not found", 404);
    }
    
    return sendSuccess(res, complaint, "Complaint retrieved successfully");
  } catch (err) {
    logger.error('Error fetching complaint:', err);
    return sendError(res, "Error fetching complaint", 500);
  }
};

// Update complaint (by complainant) - only message and location can be updated
const updateComplaint = async (req, res) => {
  try {
    const { message, location } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    
    // Check if the authenticated user owns this complaint
    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own complaint" });
    }

    complaint.message = message || complaint.message;
    complaint.location = location || complaint.location;

    await complaint.save();
    logger.info(`Complaint ${req.params.id} updated by ${req.user.email}`);
    return sendSuccess(res, complaint, "Complaint updated successfully");
  } catch (err) {
    logger.error('Error updating complaint:', err);
    return sendError(res, "Error updating complaint", 500);
  }
};

// Delete complaint (by complainant)
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    // Check if the authenticated user owns this complaint
    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own complaint" });
    }

    await complaint.deleteOne();
    logger.info(`Complaint ${req.params.id} deleted by ${req.user.email}`);
    return sendSuccess(res, null, "Complaint deleted successfully");
  } catch (err) {
    logger.error('Error deleting complaint:', err);
    return sendError(res, "Error deleting complaint", 500);
  }
};

// Wildlife Officer: Delete complaint (with all replies)
const deleteComplaintByOfficer = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    // Delete the entire complaint (this will also delete all associated replies)
    await complaint.deleteOne();
    
    res.status(200).json({ 
      message: "Complaint and all associated replies deleted successfully",
      deletedComplaintId: req.params.id
    });
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

// Wildlife Officer: Search complaints by username or ID
const searchComplaints = async (req, res) => {
  try {
    const { searchTerm, searchType } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ 
        message: "Search term is required. Use 'searchTerm' query parameter." 
      });
    }

    let query = {};

    // Determine search type
    if (searchType === 'id') {
      // Search by complaint ID - validate ObjectId format
      if (searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = searchTerm;
      } else {
        return res.status(400).json({ 
          message: "Invalid ObjectId format for ID search" 
        });
      }
    } else if (searchType === 'username') {
      // Search by username (case-insensitive)
      query.username = { $regex: searchTerm, $options: 'i' };
    } else {
      // Default: search both username and ID
      const searchConditions = [
        { username: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // Only add ID search if it's a valid ObjectId format
      if (searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
        searchConditions.push({ _id: searchTerm });
      }
      
      query = { $or: searchConditions };
    }

    const complaints = await Complaint.find(query).sort({ date: -1 });

    res.status(200).json({
      message: `Found ${complaints.length} complaint(s)`,
      searchTerm,
      searchType: searchType || 'both',
      results: complaints
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error searching complaints", 
      error: err.message 
    });
  }
};

// Wildlife Officer: Advanced search with filters
const advancedSearchComplaints = async (req, res) => {
  try {
    const { 
      searchTerm, 
      role, 
      dateFrom, 
      dateTo, 
      hasReplies,
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 50,
      page = 1
    } = req.query;

    let query = {};

    // Text search in username, email, message, location
    if (searchTerm) {
      query.$or = [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { message: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo);
      }
    }

    // Filter by replies
    if (hasReplies !== undefined) {
      if (hasReplies === 'true' || hasReplies === true) {
        query['replies.0'] = { $exists: true };
      } else {
        query.replies = { $size: 0 };
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [complaints, totalCount] = await Promise.all([
      Complaint.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Complaint.countDocuments(query)
    ]);

    res.status(200).json({
      message: `Found ${complaints.length} complaint(s) out of ${totalCount} total`,
      searchParams: {
        searchTerm,
        role,
        dateFrom,
        dateTo,
        hasReplies,
        sortBy,
        sortOrder
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit)
      },
      results: complaints
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error in advanced search", 
      error: err.message 
    });
  }
};

// Wildlife Officer: Get complaint statistics
const getComplaintStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.date.$lte = new Date(dateTo);
    }

    const [
      totalComplaints,
      complaintsByRole,
      complaintsWithReplies,
      recentComplaints,
      complaintsByMonth
    ] = await Promise.all([
      // Total complaints
      Complaint.countDocuments(dateFilter),
      
      // Complaints by role
      Complaint.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Complaints with replies
      Complaint.countDocuments({
        ...dateFilter,
        'replies.0': { $exists: true }
      }),
      
      // Recent complaints (last 7 days)
      Complaint.countDocuments({
        ...dateFilter,
        date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Complaints by month (last 6 months)
      Complaint.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ])
    ]);

    res.status(200).json({
      message: "Complaint statistics retrieved successfully",
      period: {
        from: dateFrom || 'all time',
        to: dateTo || 'present'
      },
      stats: {
        totalComplaints,
        complaintsByRole,
        complaintsWithReplies,
        complaintsWithoutReplies: totalComplaints - complaintsWithReplies,
        recentComplaints,
        complaintsByMonth
      }
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error fetching complaint statistics", 
      error: err.message 
    });
  }
};

// Wildlife Officer: Generate PDF
const generateComplaintPDF = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Wild Lanka Go - Complaint Report", 20, 20);
    
    // Complaint details
    doc.setFontSize(12);
    let y = 40;
    
    doc.text(`Complaint ID: ${complaint._id}`, 20, y);
    y += 10;
    doc.text(`Date: ${new Date(complaint.date).toLocaleDateString()}`, 20, y);
    y += 10;
    doc.text(`Username: ${complaint.username}`, 20, y);
    y += 10;
    doc.text(`Role: ${complaint.role}`, 20, y);
    y += 10;
    doc.text(`Email: ${complaint.email}`, 20, y);
    y += 10;
    doc.text(`Status: ${complaint.status}`, 20, y);
    y += 15;
    
    // Message
    doc.setFontSize(14);
    doc.text("Complaint Message:", 20, y);
    y += 10;
    doc.setFontSize(10);
    
    // Split long messages into multiple lines
    const messageLines = doc.splitTextToSize(complaint.message, 170);
    doc.text(messageLines, 20, y);
    y += messageLines.length * 5 + 10;
    
    // Location
    if (complaint.location) {
      doc.setFontSize(12);
      doc.text(`Location: ${complaint.location}`, 20, y);
      y += 15;
    }
    
    // Replies section
    if (complaint.replies && complaint.replies.length > 0) {
      doc.setFontSize(14);
      doc.text("Officer Replies:", 20, y);
      y += 10;
      
      complaint.replies.forEach((reply, i) => {
        doc.setFontSize(12);
        doc.text(`Reply ${i + 1} by ${reply.officerUsername}`, 20, y);
        y += 8;
        doc.text(`Date: ${new Date(reply.date).toLocaleString()}`, 20, y);
        y += 8;
        doc.setFontSize(10);
        
        const replyLines = doc.splitTextToSize(reply.message, 170);
        doc.text(replyLines, 20, y);
        y += replyLines.length * 5 + 10;
        
        // Add a line break between replies
        if (i < complaint.replies.length - 1) {
          doc.line(20, y, 190, y);
          y += 10;
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text("No replies yet", 20, y);
    }

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=complaint-${complaint._id}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    logger.error('Error generating PDF:', err);
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

module.exports = {
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
};
