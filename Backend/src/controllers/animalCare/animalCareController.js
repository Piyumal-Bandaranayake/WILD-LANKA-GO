import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import Treatment from '../../models/Animal Care Management/Treatment.js';
import Medication from '../../models/Animal Care Management/Medication.js';
import User from '../../models/User.js';
import { uploadImage, deleteImage, getThumbnailUrl } from '../../config/cloudinary.js';

// Get all animal cases with filtering and pagination
export const getAnimalCases = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      animalType,
      assignedVet,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (animalType) filter.animalType = animalType;
    if (assignedVet) filter.assignedVet = assignedVet;
    if (search) {
      filter.$or = [
        { caseId: { $regex: search, $options: 'i' } },
        { animalType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { reportedBy: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const cases = await AnimalCase.find(filter)
      .populate({
        path: 'assignedVet',
        select: 'name email role',
        strictPopulate: false
      })
      .populate({
        path: 'collaboratingVets',
        select: 'name email role',
        strictPopulate: false
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AnimalCase.countDocuments(filter);

    res.json({
      cases,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_cases: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching animal cases:', error);
    res.status(500).json({ message: 'Failed to fetch animal cases', error: error.message });
  }
};

// Get single animal case with treatments
export const getAnimalCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const animalCase = await AnimalCase.findById(id)
      .populate('assignedVet', 'name email role picture');
    
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Get treatments for this case
    const treatments = await Treatment.find({ caseId: id })
      .populate('assignedVet', 'name email role picture')
      .sort({ treatmentDate: -1 });

    res.json({
      case: animalCase,
      treatments,
      treatment_count: treatments.length
    });
  } catch (error) {
    console.error('❌ Error fetching animal case:', error);
    res.status(500).json({ message: 'Failed to fetch animal case', error: error.message });
  }
};

// Create new animal case
export const createAnimalCase = async (req, res) => {
  try {
    const caseData = req.body;
    const files = req.files;

    // Create the case first
    const newCase = new AnimalCase(caseData);
    
    // Handle image uploads if any
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadImage(file.path, {
          folder: `wildlanka/animal-cases/${newCase._id}`,
          public_id: `case_${newCase._id}_${Date.now()}`
        });

        return {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          thumbnail_url: getThumbnailUrl(uploadResult.public_id, 300, 300),
          description: file.originalname,
          uploaded_by: req.auth?.payload?.name || 'System',
          file_size: uploadResult.bytes,
          dimensions: {
            width: uploadResult.width,
            height: uploadResult.height
          }
        };
      });

      newCase.photosDocumentation = await Promise.all(uploadPromises);
    }

    await newCase.save();

    console.log('✅ New animal case created:', {
      caseId: newCase.caseId,
      animalType: newCase.animalType,
      priority: newCase.priority,
      images: newCase.photosDocumentation.length
    });

    res.status(201).json({
      message: 'Animal case created successfully',
      case: newCase
    });
  } catch (error) {
    console.error('❌ Error creating animal case:', error);
    res.status(500).json({ message: 'Failed to create animal case', error: error.message });
  }
};

// Update animal case
export const updateAnimalCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files;

    const animalCase = await AnimalCase.findById(id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Handle new image uploads
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadImage(file.path, {
          folder: `wildlanka/animal-cases/${id}`,
          public_id: `case_${id}_${Date.now()}`
        });

        return {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          thumbnail_url: getThumbnailUrl(uploadResult.public_id, 300, 300),
          description: file.originalname,
          uploaded_by: req.auth?.payload?.name || 'System',
          file_size: uploadResult.bytes,
          dimensions: {
            width: uploadResult.width,
            height: uploadResult.height
          }
        };
      });

      const newImages = await Promise.all(uploadPromises);
      updateData.photosDocumentation = [...animalCase.photosDocumentation, ...newImages];
    }

    const updatedCase = await AnimalCase.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedVet', 'name email role picture');

    console.log('✅ Animal case updated:', {
      caseId: updatedCase.caseId,
      status: updatedCase.status,
      images: updatedCase.photosDocumentation.length
    });

    res.json({
      message: 'Animal case updated successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('❌ Error updating animal case:', error);
    res.status(500).json({ message: 'Failed to update animal case', error: error.message });
  }
};

// Assign case to vet
export const assignCaseToVet = async (req, res) => {
  try {
    const { id } = req.params;
    const { vetId } = req.body;

    // Verify vet exists and has correct role
    const vet = await User.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      return res.status(400).json({ message: 'Invalid vet ID or user is not a vet' });
    }

    const updatedCase = await AnimalCase.findByIdAndUpdate(
      id,
      { 
        assignedVet: vetId,
        status: 'Assigned',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('assignedVet', 'name email role picture');

    if (!updatedCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    console.log('✅ Case assigned to vet:', {
      caseId: updatedCase.caseId,
      vetName: vet.name,
      vetEmail: vet.email
    });

    res.json({
      message: 'Case assigned to vet successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('❌ Error assigning case to vet:', error);
    res.status(500).json({ message: 'Failed to assign case to vet', error: error.message });
  }
};

// Delete image from case
export const deleteImageFromCase = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const animalCase = await AnimalCase.findById(id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    const imageIndex = animalCase.photosDocumentation.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = animalCase.photosDocumentation[imageIndex];
    
    // Delete from Cloudinary
    await deleteImage(image.public_id);
    
    // Remove from database
    animalCase.photosDocumentation.splice(imageIndex, 1);
    await animalCase.save();

    console.log('✅ Image deleted from case:', {
      caseId: animalCase.caseId,
      imageId: image.public_id
    });

    res.json({
      message: 'Image deleted successfully',
      case: animalCase
    });
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

// Get dashboard statistics for vets
export const getVetDashboardStats = async (req, res) => {
  try {
    // Check if auth is available
    if (!req.auth?.payload?.sub) {
      // Return general stats without user-specific filtering when no auth
      const stats = {
        total_cases: await AnimalCase.countDocuments(),
        unassigned_cases: await AnimalCase.countDocuments({ status: 'Unassigned' }),
        in_progress_cases: await AnimalCase.countDocuments({ status: 'In Progress' }),
        completed_cases: await AnimalCase.countDocuments({ status: 'Completed' }),
        high_priority_cases: await AnimalCase.countDocuments({ priority: 'High' })
      };

      // Recent cases
      stats.recent_cases = await AnimalCase.find()
        .populate('assignedVet', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('caseId animalType priority status assignedVet createdAt');

      return res.json(stats);
    }

    const { sub: auth0Id } = req.auth.payload;
    
    // Get current user
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats;

    if (currentUser.role === 'vet') {
      // Vet-specific stats
      stats = {
        assigned_cases: await AnimalCase.countDocuments({ assignedVet: currentUser._id }),
        active_treatments: await Treatment.countDocuments({ 
          assignedVet: currentUser._id, 
          treatmentStatus: { $in: ['Planned', 'In Progress'] }
        }),
        completed_treatments: await Treatment.countDocuments({ 
          assignedVet: currentUser._id, 
          treatmentStatus: 'Completed'
        }),
        follow_ups_required: await Treatment.countDocuments({ 
          assignedVet: currentUser._id, 
          followUpRequired: true,
          treatmentStatus: { $ne: 'Completed' }
        })
      };

      // Recent cases assigned to this vet
      stats.recent_cases = await AnimalCase.find({ assignedVet: currentUser._id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('caseId animalType priority status createdAt');

    } else if (currentUser.role === 'WildlifeOfficer' || currentUser.role === 'admin') {
      // Officer/Admin stats
      stats = {
        total_cases: await AnimalCase.countDocuments(),
        unassigned_cases: await AnimalCase.countDocuments({ status: 'Unassigned' }),
        in_progress_cases: await AnimalCase.countDocuments({ status: 'In Progress' }),
        completed_cases: await AnimalCase.countDocuments({ status: 'Completed' }),
        high_priority_cases: await AnimalCase.countDocuments({ priority: 'High' })
      };

      // Recent cases
      stats.recent_cases = await AnimalCase.find()
        .populate('assignedVet', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('caseId animalType priority status assignedVet createdAt');
    }

    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

// Get all treatments for dashboard
export const getAllTreatments = async (req, res) => {
  try {
    // Check if auth is available
    if (!req.auth?.payload?.sub) {
      // Return all treatments when no auth
      const treatments = await Treatment.find()
        .populate('caseId', 'caseId animalType')
        .populate('assignedVet', 'name')
        .sort({ createdAt: -1 });
      return res.json(treatments);
    }

    const { sub: auth0Id } = req.auth.payload;
    
    // Get current user
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let treatments;
    
    if (currentUser.role === 'vet') {
      // Only get treatments assigned to this vet
      treatments = await Treatment.find({ assignedVet: currentUser._id })
        .populate('caseId', 'caseId animalType')
        .sort({ createdAt: -1 });
    } else {
      // Get all treatments for admin/officers
      treatments = await Treatment.find()
        .populate('caseId', 'caseId animalType')
        .populate('assignedVet', 'name')
        .sort({ createdAt: -1 });
    }

    res.json(treatments);
  } catch (error) {
    console.error('❌ Error fetching treatments:', error);
    res.status(500).json({ message: 'Failed to fetch treatments', error: error.message });
  }
};

// Delete animal case
export const deleteAnimalCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the case first to get image details for cleanup
    const animalCase = await AnimalCase.findById(id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Delete associated images from Cloudinary
    if (animalCase.photosDocumentation && animalCase.photosDocumentation.length > 0) {
      for (const photo of animalCase.photosDocumentation) {
        try {
          if (photo.public_id) {
            await deleteImage(photo.public_id);
          }
        } catch (imageError) {
          console.error('Error deleting image:', imageError);
          // Continue with case deletion even if image deletion fails
        }
      }
    }

    // Delete the case
    await AnimalCase.findByIdAndDelete(id);

    res.json({ message: 'Animal case deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting animal case:', error);
    res.status(500).json({ message: 'Failed to delete animal case', error: error.message });
  }
};