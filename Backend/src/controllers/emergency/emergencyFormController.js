const EmergencyForm = require('../../models/emergency/emergencyForm');
const SystemUser = require('../../models/SystemUser');
const Tourist = require('../../models/Tourist');
const { randomUUID } = require('crypto');

// =========================
// 1️⃣ Submit Emergency Form
// =========================
const submitEmergencyForm = async (req, res) => {
  try {
    const {
      name, email, phone, property_name, location,
      emergency_type, description, date, time
    } = req.body;

    if (!name || !email || !phone || !property_name || !location || !emergency_type || !description || !date || !time) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const incidentDate = new Date(date);
    if (incidentDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Date cannot be in the future' });
    }

    // Auto priority detection
    let priority = 'medium';
    const desc = description.toLowerCase();
    if (desc.includes('critical') || desc.includes('fatal') || desc.includes('death')) priority = 'critical';
    else if (desc.includes('injury') || desc.includes('fire') || desc.includes('accident')) priority = 'high';
    else if (desc.includes('minor')) priority = 'low';

    const newForm = await EmergencyForm.create({
      name,
      email,
      phone,
      property_name,
      location,
      emergency_type,
      description,
      date,
      time,
      priority,
      assignedTo: { userId: null, userModel: null } // ensure schema consistency
    });

    // Notify available call operators (non-blocking)
    try {
      const operators = await SystemUser.find({ 
        role: 'callOperator', 
        isAvailable: true, 
        status: 'active' 
      });
      for (const op of operators) {
        // Add emergency alert to operator's notifications
        op.notifications.push({
          type: 'System Alert',
          message: `New emergency reported: ${emergency_type} at ${location}`,
          priority: priority === 'critical' ? 'urgent' : 'high',
          relatedId: newForm._id,
          relatedType: 'EmergencyForm'
        });
        await op.save();
      }
    } catch (e) {
      console.warn('Error sending operator alerts:', e.message);
    }

    res.status(201).json({ success: true, message: 'Emergency form submitted successfully', data: newForm });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// =========================
// 2️⃣ Get All Emergency Forms
// =========================
const getAllEmergencyForms = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;
    const forms = await EmergencyForm.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo.userId', 'firstName lastName email phone role'); // SystemUser/Tourist fields

    const total = await EmergencyForm.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: forms,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch emergency forms' });
  }
};

// =========================
// 3️⃣ Get Single Emergency Form
// =========================
const getEmergencyFormById = async (req, res) => {
  try {
    const form = await EmergencyForm.findById(req.params.id)
      .populate('assignedTo.userId', 'firstName lastName email phone role');

    if (!form) return res.status(404).json({ success: false, message: 'Emergency form not found' });

    res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch emergency form' });
  }
};

// =========================
// 4️⃣ Assign Emergency
// =========================
const assignEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userModel } = req.body;

    if (!userId || !userModel)
      return res.status(400).json({ success: false, message: 'userId and userModel are required' });

    const validRoles = ['vet', 'EmergencyOfficer', 'safariDriver'];
    if (!validRoles.includes(userModel))
      return res.status(400).json({ success: false, message: 'Invalid userModel' });

    // Find user in appropriate model
    let assignedUser;
    if (userModel === 'SystemUser') {
      assignedUser = await SystemUser.findOne({ _id: userId, role: userModel });
    } else if (userModel === 'Tourist') {
      assignedUser = await Tourist.findOne({ _id: userId });
    }
    
    if (!assignedUser)
      return res.status(404).json({ success: false, message: 'Assigned user not found' });

    const form = await EmergencyForm.findByIdAndUpdate(
      id,
      {
        assignedTo: { userId: assignedUser._id, userModel: userModel },
        // Do not change the status - keep the original status
        updatedAt: new Date()
      },
      { new: true }
    ).populate('assignedTo.userId', 'firstName lastName email phone role');

    if (!form)
      return res.status(404).json({ success: false, message: 'Emergency form not found' });

    res.status(200).json({ success: true, message: 'Emergency assigned successfully', data: form });
  } catch (error) {
    console.error('Error assigning emergency:', error);
    res.status(500).json({ success: false, message: 'Failed to assign emergency' });
  }
};

// =========================
// 5️⃣ Delete Emergency Form
// =========================
const deleteEmergencyForm = async (req, res) => {
  try {
    const deleted = await EmergencyForm.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Emergency form not found' });
    res.status(200).json({ success: true, message: 'Emergency form deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete emergency form' });
  }
};

// =========================
// 6️⃣ Update Emergency Status
// =========================
const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'in-progress', 'resolved'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: pending, in-progress, resolved',
      });
    }

    const updatedForm = await EmergencyForm.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('assignedTo.userId', 'firstName lastName email phone role');

    if (!updatedForm) {
      return res.status(404).json({ success: false, message: 'Emergency form not found' });
    }

    res.status(200).json({
      success: true,
      message: `Emergency status updated to '${status}' successfully`,
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({ success: false, message: 'Failed to update emergency status' });
  }
};

module.exports = {
  submitEmergencyForm,
  getAllEmergencyForms,
  getEmergencyFormById,
  assignEmergency,
  updateEmergencyFormStatus: updateEmergencyStatus,
  deleteEmergencyForm
};
