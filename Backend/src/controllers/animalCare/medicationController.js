import Medication from '../../models/Animal Care Management/Medication.js';
import User from '../../models/User.js';

// Get all medications with filtering and pagination
export const getMedications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      form,
      isActive,
      lowStock,
      nearExpiry,
      expired,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (form) filter.form = form;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (lowStock === 'true') filter['alerts.lowStock'] = true;
    if (nearExpiry === 'true') filter['alerts.nearExpiry'] = true;
    if (expired === 'true') filter['alerts.expired'] = true;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { medicationId: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const medications = await Medication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('usageLog.veterinarian', 'name email')
      .populate('restockRequests.requestedBy', 'name email')
      .populate('restockRequests.approvedBy', 'name email');

    const total = await Medication.countDocuments(filter);

    // Get medication statistics
    const stats = await Medication.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalCost' },
          lowStockCount: { $sum: { $cond: ['$alerts.lowStock', 1, 0] } },
          nearExpiryCount: { $sum: { $cond: ['$alerts.nearExpiry', 1, 0] } },
          expiredCount: { $sum: { $cond: ['$alerts.expired', 1, 0] } },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    res.json({
      medications,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_medications: total,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      },
      statistics: stats[0] || {
        totalValue: 0,
        lowStockCount: 0,
        nearExpiryCount: 0,
        expiredCount: 0,
        totalQuantity: 0
      }
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch medications', 
      error: error.message 
    });
  }
};

// Get medication by ID
export const getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medication = await Medication.findById(id)
      .populate('usageLog.veterinarian', 'name email role')
      .populate('usageLog.caseId', 'caseId animalType')
      .populate('usageLog.treatmentId', 'treatmentId treatmentType')
      .populate('restockRequests.requestedBy', 'name email role')
      .populate('restockRequests.approvedBy', 'name email role');

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json(medication);
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ 
      message: 'Failed to fetch medication', 
      error: error.message 
    });
  }
};

// Create new medication
export const createMedication = async (req, res) => {
  try {
    const medicationData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'category', 'form', 'strength', 'quantity', 'unit', 'threshold', 'batchNumber', 'manufacturingDate', 'expiryDate', 'manufacturer', 'costPerUnit'];
    const missingFields = requiredFields.filter(field => !medicationData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    const medication = new Medication(medicationData);
    await medication.save();

    res.status(201).json({
      message: 'Medication created successfully',
      medication
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Medication with this name or batch number already exists' 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to create medication', 
        error: error.message 
      });
    }
  }
};

// Update medication
export const updateMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const medication = await Medication.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json({
      message: 'Medication updated successfully',
      medication
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ 
      message: 'Failed to update medication', 
      error: error.message 
    });
  }
};

// Use medication (record usage)
export const useMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityUsed, caseId, treatmentId, notes } = req.body;
    const veterinarianId = req.user?.sub || req.body.veterinarianId; // From auth middleware or request body

    if (!quantityUsed || quantityUsed <= 0) {
      return res.status(400).json({ message: 'Invalid quantity used' });
    }

    const medication = await Medication.findById(id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    if (medication.quantity < quantityUsed) {
      return res.status(400).json({ message: 'Insufficient medication stock' });
    }

    // Record usage
    medication.usageLog.push({
      caseId,
      treatmentId,
      veterinarian: veterinarianId,
      quantityUsed,
      notes
    });

    // Update quantity
    medication.quantity -= quantityUsed;
    
    await medication.save();

    res.json({
      message: 'Medication usage recorded successfully',
      remainingQuantity: medication.quantity,
      lowStockAlert: medication.alerts.lowStock
    });
  } catch (error) {
    console.error('Error recording medication usage:', error);
    res.status(500).json({ 
      message: 'Failed to record medication usage', 
      error: error.message 
    });
  }
};

// Request restock
export const requestRestock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityRequested, priority, reason } = req.body;
    const requestedBy = req.user?.sub || req.body.requestedBy; // From auth middleware or request body

    if (!quantityRequested || quantityRequested <= 0) {
      return res.status(400).json({ message: 'Invalid quantity requested' });
    }

    const medication = await Medication.findById(id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Add restock request
    medication.restockRequests.push({
      requestedBy,
      quantityRequested,
      priority: priority || 'Medium',
      reason
    });

    await medication.save();

    res.json({
      message: 'Restock request submitted successfully',
      requestId: medication.restockRequests[medication.restockRequests.length - 1]._id
    });
  } catch (error) {
    console.error('Error requesting restock:', error);
    res.status(500).json({ 
      message: 'Failed to request restock', 
      error: error.message 
    });
  }
};

// Approve/reject restock request
export const handleRestockRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    const approvedBy = req.user?.sub || req.body.approvedBy; // From auth middleware or request body

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    }

    const medication = await Medication.findById(id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    const request = medication.restockRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Restock request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = action === 'approve' ? 'Approved' : 'Rejected';
    request.approvedBy = approvedBy;
    request.approvedDate = new Date();
    request.notes = notes;

    await medication.save();

    res.json({
      message: `Restock request ${action}d successfully`,
      request
    });
  } catch (error) {
    console.error('Error handling restock request:', error);
    res.status(500).json({ 
      message: 'Failed to handle restock request', 
      error: error.message 
    });
  }
};

// Get restock requests
export const getRestockRequests = async (req, res) => {
  try {
    const { status, priority } = req.query;

    const filter = {};
    if (status) filter['restockRequests.status'] = status;
    if (priority) filter['restockRequests.priority'] = priority;

    const medications = await Medication.find(filter)
      .populate('restockRequests.requestedBy', 'name email role')
      .populate('restockRequests.approvedBy', 'name email role');

    // Extract restock requests
    const restockRequests = [];
    medications.forEach(medication => {
      medication.restockRequests.forEach(request => {
        if (!status || request.status === status) {
          if (!priority || request.priority === priority) {
            restockRequests.push({
              ...request.toObject(),
              medication: {
                _id: medication._id,
                name: medication.name,
                medicationId: medication.medicationId,
                currentQuantity: medication.quantity,
                threshold: medication.threshold
              }
            });
          }
        }
      });
    });

    // Sort by request date (newest first)
    restockRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    res.json({
      restockRequests,
      total: restockRequests.length
    });
  } catch (error) {
    console.error('Error fetching restock requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch restock requests', 
      error: error.message 
    });
  }
};

// Get medication alerts
export const getMedicationAlerts = async (req, res) => {
  try {
    const lowStockMedications = await Medication.find({ 'alerts.lowStock': true });
    const nearExpiryMedications = await Medication.find({ 'alerts.nearExpiry': true });
    const expiredMedications = await Medication.find({ 'alerts.expired': true });

    res.json({
      lowStock: lowStockMedications,
      nearExpiry: nearExpiryMedications,
      expired: expiredMedications,
      summary: {
        lowStockCount: lowStockMedications.length,
        nearExpiryCount: nearExpiryMedications.length,
        expiredCount: expiredMedications.length
      }
    });
  } catch (error) {
    console.error('Error fetching medication alerts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch medication alerts', 
      error: error.message 
    });
  }
};

// Generate medication usage report
export const generateUsageReport = async (req, res) => {
  try {
    const { startDate, endDate, veterinarianId, medicationId } = req.query;

    const matchStage = {};
    if (startDate) matchStage['usageLog.dateUsed'] = { $gte: new Date(startDate) };
    if (endDate) {
      if (matchStage['usageLog.dateUsed']) {
        matchStage['usageLog.dateUsed'].$lte = new Date(endDate);
      } else {
        matchStage['usageLog.dateUsed'] = { $lte: new Date(endDate) };
      }
    }
    if (medicationId) matchStage._id = medicationId;

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$usageLog' },
      {
        $lookup: {
          from: 'users',
          localField: 'usageLog.veterinarian',
          foreignField: '_id',
          as: 'veterinarian'
        }
      },
      {
        $lookup: {
          from: 'animalcases',
          localField: 'usageLog.caseId',
          foreignField: '_id',
          as: 'animalCase'
        }
      },
      {
        $group: {
          _id: '$_id',
          medicationName: { $first: '$name' },
          medicationId: { $first: '$medicationId' },
          totalUsed: { $sum: '$usageLog.quantityUsed' },
          usageEntries: { $push: '$usageLog' },
          veterinarians: { $addToSet: '$veterinarian' },
          cases: { $addToSet: '$animalCase' }
        }
      }
    ];

    if (veterinarianId) {
      pipeline.splice(2, 0, { $match: { 'usageLog.veterinarian': veterinarianId } });
    }

    const report = await Medication.aggregate(pipeline);

    res.json({
      report,
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Present'
      },
      totalMedications: report.length
    });
  } catch (error) {
    console.error('Error generating usage report:', error);
    res.status(500).json({ 
      message: 'Failed to generate usage report', 
      error: error.message 
    });
  }
};

// Delete medication
export const deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    const medication = await Medication.findById(id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Check if medication has been used
    if (medication.usageLog.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete medication that has usage history. Consider marking as inactive instead.' 
      });
    }

    await Medication.findByIdAndDelete(id);

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ 
      message: 'Failed to delete medication', 
      error: error.message 
    });
  }
};

// Bulk update medication quantities (for inventory management)
export const bulkUpdateQuantities = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { medicationId, newQuantity, notes }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const medication = await Medication.findById(update.medicationId);
        if (!medication) {
          errors.push({ medicationId: update.medicationId, error: 'Medication not found' });
          continue;
        }

        const oldQuantity = medication.quantity;
        medication.quantity = update.newQuantity;
        
        // Add admin note for the update
        if (update.notes) {
          medication.adminNotes = medication.adminNotes || [];
          medication.adminNotes.push({
            note: `Quantity updated from ${oldQuantity} to ${update.newQuantity}. ${update.notes}`,
            addedBy: req.user?.sub || req.body.addedBy || 'system',
            addedAt: new Date()
          });
        }

        await medication.save();
        
        results.push({
          medicationId: update.medicationId,
          oldQuantity,
          newQuantity: update.newQuantity,
          success: true
        });
      } catch (error) {
        errors.push({ 
          medicationId: update.medicationId, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Bulk update completed',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ 
      message: 'Failed to perform bulk update', 
      error: error.message 
    });
  }
};