import Treatment from '../../models/Animal Care Management/Treatment.js';
import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import Medication from '../../models/Animal Care Management/Medication.js';
import User from '../../models/User.js';
import { uploadImage, deleteImage, getThumbnailUrl } from '../../config/cloudinary.js';

// Create new treatment
export const createTreatment = async (req, res) => {
  try {
    const treatmentData = req.body;
    const files = req.files;
    // Check if auth is available
    let currentUser = null;
    if (req.auth?.payload?.sub) {
      const { sub: auth0Id } = req.auth.payload;
      currentUser = await User.findOne({ auth0Id });
      if (!currentUser || currentUser.role !== 'vet') {
        return res.status(403).json({ message: 'Only vets can create treatments' });
      }
    } else {
      // For testing without auth, we need an assignedVet from request body
      if (!treatmentData.assignedVet) {
        return res.status(400).json({ message: 'assignedVet is required when no authentication' });
      }
      currentUser = await User.findById(treatmentData.assignedVet);
      if (!currentUser) {
        return res.status(400).json({ message: 'Invalid assignedVet ID' });
      }
    }

    // Verify case exists
    const animalCase = await AnimalCase.findById(treatmentData.caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Only check assignment if authentication is available and user is vet
    if (req.auth?.payload?.sub && currentUser.role === 'vet' && animalCase.assignedVet?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'You can only create treatments for cases assigned to you' });
    }

    // Create treatment
    const newTreatment = new Treatment({
      ...treatmentData,
      assignedVet: currentUser._id
    });

    // Handle image uploads
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadImage(file.path, {
          folder: `wildlanka/treatments/${newTreatment._id}`,
          public_id: `treatment_${newTreatment._id}_${Date.now()}`
        });

        return {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          thumbnail_url: getThumbnailUrl(uploadResult.public_id, 300, 300),
          description: file.originalname,
          image_type: 'other', // Can be updated based on form data
          uploaded_at: new Date()
        };
      });

      newTreatment.treatmentImages = await Promise.all(uploadPromises);
    }

    await newTreatment.save();

    // Update case status
    animalCase.status = 'In Progress';
    await animalCase.save();

    // Populate the response
    const populatedTreatment = await Treatment.findById(newTreatment._id)
      .populate('assignedVet', 'name email role picture')
      .populate('caseId', 'caseId animalType');

    console.log('✅ New treatment created:', {
      treatmentId: newTreatment.treatmentId,
      caseId: animalCase.caseId,
      vetName: currentUser.name,
      type: newTreatment.treatmentType
    });

    res.status(201).json({
      message: 'Treatment created successfully',
      treatment: populatedTreatment
    });
  } catch (error) {
    console.error('❌ Error creating treatment:', error);
    res.status(500).json({ message: 'Failed to create treatment', error: error.message });
  }
};

// Get treatments for a case
export const getTreatmentsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const treatments = await Treatment.find({ caseId })
      .populate('assignedVet', 'name email role picture')
      .populate('medicationsUsed.medicationId', 'name type')
      .sort({ treatmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Treatment.countDocuments({ caseId });

    res.json({
      treatments,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_treatments: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching treatments:', error);
    res.status(500).json({ message: 'Failed to fetch treatments', error: error.message });
  }
};

// Update treatment
export const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files;
    // Check if auth is available
    let currentUser = null;
    if (req.auth?.payload?.sub) {
      const { sub: auth0Id } = req.auth.payload;
      currentUser = await User.findOne({ auth0Id });
    }
    
    const treatment = await Treatment.findById(id);
    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Check if user can update this treatment (only if authenticated)
    if (currentUser && currentUser.role === 'vet' && treatment.assignedVet?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own treatments' });
    }

    // Handle new image uploads
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadImage(file.path, {
          folder: `wildlanka/treatments/${id}`,
          public_id: `treatment_${id}_${Date.now()}`
        });

        return {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          thumbnail_url: getThumbnailUrl(uploadResult.public_id, 300, 300),
          description: file.originalname,
          image_type: 'other',
          uploaded_at: new Date()
        };
      });

      const newImages = await Promise.all(uploadPromises);
      updateData.treatmentImages = [...treatment.treatmentImages, ...newImages];
    }

    const updatedTreatment = await Treatment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedVet', 'name email role picture')
     .populate('caseId', 'caseId animalType');

    // Update case status if treatment is completed
    if (updateData.treatmentStatus === 'Completed') {
      const caseId = treatment.caseId;
      const remainingTreatments = await Treatment.countDocuments({
        caseId,
        treatmentStatus: { $in: ['Planned', 'In Progress'] }
      });

      if (remainingTreatments === 0) {
        await AnimalCase.findByIdAndUpdate(caseId, { status: 'Completed' });
      }
    }

    console.log('✅ Treatment updated:', {
      treatmentId: updatedTreatment.treatmentId,
      status: updatedTreatment.treatmentStatus,
      outcome: updatedTreatment.outcome
    });

    res.json({
      message: 'Treatment updated successfully',
      treatment: updatedTreatment
    });
  } catch (error) {
    console.error('❌ Error updating treatment:', error);
    res.status(500).json({ message: 'Failed to update treatment', error: error.message });
  }
};

// Get treatment by ID
export const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const treatment = await Treatment.findById(id)
      .populate('assignedVet', 'name email role picture')
      .populate('caseId', 'caseId animalType speciesScientificName location')
      .populate('medicationsUsed.medicationId', 'name type dosageForm');

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    res.json({ treatment });
  } catch (error) {
    console.error('❌ Error fetching treatment:', error);
    res.status(500).json({ message: 'Failed to fetch treatment', error: error.message });
  }
};

// Delete treatment image
export const deleteTreatmentImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    // Check if auth is available
    let currentUser = null;
    if (req.auth?.payload?.sub) {
      const { sub: auth0Id } = req.auth.payload;
      currentUser = await User.findOne({ auth0Id });
    }
    const treatment = await Treatment.findById(id);

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Check permissions (only if authenticated)
    if (currentUser && currentUser.role === 'vet' && treatment.assignedVet?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'You can only delete images from your own treatments' });
    }

    const imageIndex = treatment.treatmentImages.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = treatment.treatmentImages[imageIndex];
    
    // Delete from Cloudinary
    await deleteImage(image.public_id);
    
    // Remove from database
    treatment.treatmentImages.splice(imageIndex, 1);
    await treatment.save();

    console.log('✅ Treatment image deleted:', {
      treatmentId: treatment.treatmentId,
      imageId: image.public_id
    });

    res.json({
      message: 'Image deleted successfully',
      treatment
    });
  } catch (error) {
    console.error('❌ Error deleting treatment image:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

// Generate treatment report
export const generateTreatmentReport = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { startDate, endDate } = req.query;

    // Build filter
    const filter = { caseId };
    if (startDate || endDate) {
      filter.treatmentDate = {};
      if (startDate) filter.treatmentDate.$gte = new Date(startDate);
      if (endDate) filter.treatmentDate.$lte = new Date(endDate);
    }

    const treatments = await Treatment.find(filter)
      .populate('assignedVet', 'name email role')
      .populate('caseId', 'caseId animalType speciesScientificName location reportedBy')
      .sort({ treatmentDate: -1 });

    const animalCase = await AnimalCase.findById(caseId);

    // Calculate summary statistics
    const summary = {
      total_treatments: treatments.length,
      completed_treatments: treatments.filter(t => t.treatmentStatus === 'Completed').length,
      successful_outcomes: treatments.filter(t => t.outcome === 'Successful').length,
      total_cost: treatments.reduce((sum, t) => sum + (t.cost.total_cost || 0), 0),
      average_cost: treatments.length > 0 ? 
        treatments.reduce((sum, t) => sum + (t.cost.total_cost || 0), 0) / treatments.length : 0,
      treatment_types: treatments.reduce((acc, t) => {
        acc[t.treatmentType] = (acc[t.treatmentType] || 0) + 1;
        return acc;
      }, {}),
      medications_used: treatments.reduce((acc, t) => {
        t.medicationsUsed.forEach(med => {
          acc[med.name] = (acc[med.name] || 0) + 1;
        });
        return acc;
      }, {})
    };

    const report = {
      case_info: animalCase,
      treatments,
      summary,
      generated_at: new Date(),
      generated_by: req.auth?.payload?.name || 'System'
    };

    console.log('✅ Treatment report generated:', {
      caseId: animalCase.caseId,
      treatments: treatments.length,
      totalCost: summary.total_cost
    });

    res.json({
      message: 'Treatment report generated successfully',
      report
    });
  } catch (error) {
    console.error('❌ Error generating treatment report:', error);
    res.status(500).json({ message: 'Failed to generate treatment report', error: error.message });
  }
};