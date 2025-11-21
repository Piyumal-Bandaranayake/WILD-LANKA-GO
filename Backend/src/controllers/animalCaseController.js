const AnimalCase = require('../models/AnimalCase');
const Treatment = require('../models/Treatment');
const Medicine = require('../models/Medicine');
const { generateCaseId } = require('../utils/generateToken');
const logger = require('../../config/logger');

// Get all animal cases
const getAnimalCases = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, species } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (species) query.species = new RegExp(species, 'i');

    const cases = await AnimalCase.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedVet', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AnimalCase.countDocuments(query);

    res.json({
      success: true,
      data: cases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching animal cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch animal cases',
      error: error.message
    });
  }
};

// Get animal case by ID
const getAnimalCaseById = async (req, res) => {
  try {
    const case_ = await AnimalCase.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedVet', 'firstName lastName email');

    if (!case_) {
      return res.status(404).json({
        success: false,
        message: 'Animal case not found'
      });
    }

    res.json({
      success: true,
      data: case_
    });
  } catch (error) {
    logger.error('Error fetching animal case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch animal case',
      error: error.message
    });
  }
};

// Create new animal case
const createAnimalCase = async (req, res) => {
  try {
    const caseData = {
      ...req.body,
      caseId: await generateCaseId(),
      createdBy: req.user.id
    };

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      caseData.images = req.files.map(file => ({
        url: file.path,
        description: 'Animal case photo',
        takenBy: req.user.id
      }));
    }

    const newCase = new AnimalCase(caseData);
    await newCase.save();

    const populatedCase = await AnimalCase.findById(newCase._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Animal case created successfully',
      data: populatedCase
    });
  } catch (error) {
    logger.error('Error creating animal case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create animal case',
      error: error.message
    });
  }
};

// Create animal case with images
const createAnimalCaseWithImages = async (req, res) => {
  try {
    logger.info('Creating animal case with images:', {
      userId: req.user.id,
      hasFiles: !!req.files,
      filesCount: req.files?.length || 0,
      hasImages: !!req.body.images,
      imagesCount: req.body.images?.length || 0
    });

    const caseData = {
      ...req.body,
      caseId: await generateCaseId(),
      createdBy: req.user.id
    };

    // Handle image URLs from Cloudinary upload (same pattern as events)
    if (req.body.images && Array.isArray(req.body.images)) {
      // Images are already processed by uploadToCloudinary middleware with correct structure
      caseData.images = req.body.images;
      logger.info('Using images from Cloudinary upload middleware:', caseData.images.length);
    } else if (req.files && req.files.length > 0) {
      // Fallback to local file paths if Cloudinary fails
      caseData.images = req.files.map(file => ({
        url: file.path || `/uploads/${file.originalname}`,
        description: 'Animal case photo',
        takenBy: req.user.id
      }));
      logger.info('Using fallback file paths:', caseData.images.length);
    } else {
      logger.warn('No images provided for animal case');
      caseData.images = [];
    }

    logger.info('Case data before save:', {
      caseId: caseData.caseId,
      animalType: caseData.animalType,
      location: caseData.location,
      imagesCount: caseData.images?.length || 0
    });

    const newCase = new AnimalCase(caseData);
    await newCase.save();

    const populatedCase = await AnimalCase.findById(newCase._id)
      .populate('createdBy', 'firstName lastName email');

    logger.info('Animal case created successfully:', newCase._id);

    res.status(201).json({
      success: true,
      message: 'Animal case created successfully with images',
      data: populatedCase
    });
  } catch (error) {
    logger.error('Error creating animal case with images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create animal case with images',
      error: error.message
    });
  }
};

// Update animal case
const updateAnimalCase = async (req, res) => {
  try {
    const case_ = await AnimalCase.findById(req.params.id);
    
    if (!case_) {
      return res.status(404).json({
        success: false,
        message: 'Animal case not found'
      });
    }

    const updateData = { ...req.body, updatedBy: req.user.id };

    // Handle image updates (same pattern as events)
    if (req.body.images && Array.isArray(req.body.images)) {
      // Images are already processed by uploadToCloudinary middleware with correct structure
      updateData.images = req.body.images;
      logger.info('Updating case with images from Cloudinary:', updateData.images.length);
    } else if (req.files && req.files.length > 0) {
      // Fallback to local file paths if Cloudinary fails
      updateData.images = req.files.map(file => ({
        url: file.path || `/uploads/${file.originalname}`,
        description: 'Animal case photo',
        takenBy: req.user.id
      }));
      logger.info('Updating case with fallback file paths:', updateData.images.length);
    }

    const updatedCase = await AnimalCase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Animal case updated successfully',
      data: updatedCase
    });
  } catch (error) {
    logger.error('Error updating animal case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update animal case',
      error: error.message
    });
  }
};

// Delete animal case
const deleteAnimalCase = async (req, res) => {
  try {
    const case_ = await AnimalCase.findById(req.params.id);
    
    if (!case_) {
      return res.status(404).json({
        success: false,
        message: 'Animal case not found'
      });
    }

    await AnimalCase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Animal case deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting animal case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete animal case',
      error: error.message
    });
  }
};

// Get vet dashboard stats
const getVetDashboardStats = async (req, res) => {
  try {
    const vetId = req.user.id;
    
    const stats = await AnimalCase.aggregate([
      {
        $match: {
          $or: [
            { assignedVet: vetId },
            { createdBy: vetId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total_cases: { $sum: 1 },
          assigned_cases: {
            $sum: {
              $cond: [
                { $eq: ['$assignedVet', vetId] },
                1,
                0
              ]
            }
          },
          pending_cases: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Open', 'In Progress']] },
                1,
                0
              ]
            }
          },
          completed_cases: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Resolved'] },
                1,
                0
              ]
            }
          },
          closed_cases: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Closed'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total_cases: 0,
      assigned_cases: 0,
      pending_cases: 0,
      completed_cases: 0,
      closed_cases: 0
    };

    // Get available vets count
    const SystemUser = require('../models/SystemUser');
    const availableVets = await SystemUser.countDocuments({
      role: 'vet',
      status: 'active',
      isAvailable: true
    });

    // Get recent cases (limit to 3 for dashboard)
    const recentCases = await AnimalCase.find({
      $or: [
        { assignedVet: vetId },
        { createdBy: vetId }
      ]
    })
    .populate('assignedVet', 'firstName lastName')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(3);

    res.json({
      success: true,
      data: {
        ...result,
        available_vets: availableVets,
        recent_cases: recentCases,
        assigned_cases: recentCases.filter(c => c.assignedVet && c.assignedVet._id.toString() === vetId),
        active_treatments: recentCases.filter(c => ['In Progress', 'Open'].includes(c.status)),
        completed_treatments: recentCases.filter(c => c.status === 'Resolved')
      }
    });
  } catch (error) {
    logger.error('Error fetching vet dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vet dashboard stats',
      error: error.message
    });
  }
};

// Treatment Controllers

// Create treatment for animal case
const createTreatment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { medicationId, medicationQuantity, medications } = req.body;
    
    // Verify the animal case exists
    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({
        success: false,
        message: 'Animal case not found'
      });
    }

    // Handle multiple medications if provided
    if (medications && medications.length > 0) {
      for (const med of medications) {
        const medicine = await Medicine.findById(med.medicationId);
        if (!medicine) {
          return res.status(404).json({
            success: false,
            message: `Selected medication not found: ${med.medicationName}`
          });
        }

        if (medicine.currentStock < med.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${medicine.name}. Available: ${medicine.currentStock}, Required: ${med.quantity}`
          });
        }

        // Update medication stock
        medicine.currentStock -= med.quantity;
        await medicine.save();
        
        logger.info(`Medication stock updated: ${medicine.name} - Removed ${med.quantity}, New stock: ${medicine.currentStock}`);
      }
    }
    // Handle legacy single medication if provided
    else if (medicationId && medicationQuantity > 0) {
      const medicine = await Medicine.findById(medicationId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: 'Selected medication not found'
        });
      }

      if (medicine.currentStock < medicationQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${medicine.currentStock}, Required: ${medicationQuantity}`
        });
      }

      // Update medication stock
      medicine.currentStock -= medicationQuantity;
      await medicine.save();
      
      logger.info(`Medication stock updated: ${medicine.name} - Removed ${medicationQuantity}, New stock: ${medicine.currentStock}`);
    }

    const treatmentData = {
      ...req.body,
      treatmentId: Treatment.generateTreatmentId(),
      caseId: caseId,
      createdBy: req.user.id
    };

    const newTreatment = new Treatment(treatmentData);
    await newTreatment.save();

    const populatedTreatment = await Treatment.findById(newTreatment._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('caseId', 'caseId animalType status')
      .populate('medicationId', 'name strength unit currentStock')
      .populate('medications.medicationId', 'name strength unit currentStock');

    res.status(201).json({
      success: true,
      message: 'Treatment plan created successfully',
      data: populatedTreatment
    });
  } catch (error) {
    logger.error('Error creating treatment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create treatment plan',
      error: error.message
    });
  }
};

// Get treatments for a specific case
const getTreatmentsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const treatments = await Treatment.find({ caseId })
      .populate('createdBy', 'firstName lastName email')
      .populate('caseId', 'caseId animalType status')
      .populate('medicationId', 'name strength unit currentStock')
      .populate('medications.medicationId', 'name strength unit currentStock')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Treatment.countDocuments({ caseId });

    res.json({
      success: true,
      data: treatments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching treatments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treatments',
      error: error.message
    });
  }
};

// Get all treatments
const getTreatments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const treatments = await Treatment.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('caseId', 'caseId animalType status')
      .populate('medicationId', 'name strength unit currentStock')
      .populate('medications.medicationId', 'name strength unit currentStock')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Treatment.countDocuments(query);

    res.json({
      success: true,
      data: treatments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching treatments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treatments',
      error: error.message
    });
  }
};

// Get treatment by ID
const getTreatmentById = async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('caseId', 'caseId animalType status')
      .populate('medicationId', 'name strength unit currentStock')
      .populate('medications.medicationId', 'name strength unit currentStock');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    res.json({
      success: true,
      data: treatment
    });
  } catch (error) {
    logger.error('Error fetching treatment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treatment',
      error: error.message
    });
  }
};

// Update treatment
const updateTreatment = async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    const updateData = { ...req.body, updatedBy: req.user.id };

    const updatedTreatment = await Treatment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('caseId', 'caseId animalType status')
     .populate('medicationId', 'name strength unit currentStock')
     .populate('medications.medicationId', 'name strength unit currentStock');

    res.json({
      success: true,
      message: 'Treatment updated successfully',
      data: updatedTreatment
    });
  } catch (error) {
    logger.error('Error updating treatment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update treatment',
      error: error.message
    });
  }
};

// Delete treatment
const deleteTreatment = async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    await Treatment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Treatment deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting treatment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete treatment',
      error: error.message
    });
  }
};

// Resolve image URL - find actual filename for stored URL
const resolveImageUrl = async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    // Get the uploads directory path
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({
        success: false,
        message: 'Uploads directory not found'
      });
    }
    
    // Read all files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    
    // Look for files that contain the requested filename
    const matchingFiles = files.filter(file => {
      // Remove file extension for comparison
      const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
      const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      
      // Check if the file contains the filename (for timestamped files)
      return fileWithoutExt.includes(filenameWithoutExt) || 
             fileWithoutExt.endsWith(filenameWithoutExt) ||
             file === filename;
    });
    
    if (matchingFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found',
        searchedFilename: filename,
        availableFiles: files.slice(0, 10) // Return first 10 files for debugging
      });
    }
    
    // Return the first matching file
    const actualFilename = matchingFiles[0];
    const imageUrl = `/uploads/${actualFilename}`;
    
    res.json({
      success: true,
      data: {
        originalFilename: filename,
        actualFilename: actualFilename,
        imageUrl: imageUrl,
        allMatches: matchingFiles
      }
    });
    
  } catch (error) {
    logger.error('Error resolving image URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve image URL',
      error: error.message
    });
  }
};

module.exports = {
  getAnimalCases,
  getAnimalCaseById,
  createAnimalCase,
  createAnimalCaseWithImages,
  updateAnimalCase,
  deleteAnimalCase,
  getVetDashboardStats,
  resolveImageUrl,
  // Treatment exports
  createTreatment,
  getTreatmentsByCase,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment
};
