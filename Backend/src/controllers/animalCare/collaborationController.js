import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import Treatment from '../../models/Animal Care Management/Treatment.js';
import User from '../../models/User.js';

// Create a collaboration comment on a case
export const addCollaborationComment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { comment, isPrivate = false } = req.body;
    const veterinarianId = req.user.sub; // From auth middleware

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check if the vet is assigned to the case or collaborating
    const isAssigned = animalCase.assignedVet && animalCase.assignedVet.toString() === veterinarianId;
    const isCollaborator = animalCase.collaboratingVets.includes(veterinarianId);

    if (!isAssigned && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Access denied. You must be assigned to or collaborating on this case.' 
      });
    }

    // Add collaboration comment to the case
    if (!animalCase.collaborationComments) {
      animalCase.collaborationComments = [];
    }

    const commentData = {
      veterinarian: veterinarianId,
      comment: comment.trim(),
      isPrivate,
      timestamp: new Date()
    };

    animalCase.collaborationComments.push(commentData);
    await animalCase.save();

    // Populate the veterinarian info for response
    await animalCase.populate('collaborationComments.veterinarian', 'name email role');

    const newComment = animalCase.collaborationComments[animalCase.collaborationComments.length - 1];

    res.status(201).json({
      message: 'Collaboration comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding collaboration comment:', error);
    res.status(500).json({ 
      message: 'Failed to add collaboration comment', 
      error: error.message 
    });
  }
};

// Get collaboration comments for a case
export const getCollaborationComments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const veterinarianId = req.user.sub;

    const animalCase = await AnimalCase.findById(caseId)
      .populate('collaborationComments.veterinarian', 'name email role profileImage');

    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check access
    const isAssigned = animalCase.assignedVet && animalCase.assignedVet.toString() === veterinarianId;
    const isCollaborator = animalCase.collaboratingVets.includes(veterinarianId);

    if (!isAssigned && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Access denied. You must be assigned to or collaborating on this case.' 
      });
    }

    // Filter comments based on privacy settings
    const comments = animalCase.collaborationComments.filter(comment => {
      if (!comment.isPrivate) return true;
      // Show private comments only to the author
      return comment.veterinarian._id.toString() === veterinarianId;
    });

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching collaboration comments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch collaboration comments', 
      error: error.message 
    });
  }
};

// Share case with another veterinarian
export const shareCaseWithVet = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { veterinarianId, message, accessLevel = 'view' } = req.body;
    const sharingVetId = req.user.sub;

    if (!veterinarianId) {
      return res.status(400).json({ message: 'Veterinarian ID is required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check if the sharing vet is assigned to the case
    if (!animalCase.assignedVet || animalCase.assignedVet.toString() !== sharingVetId) {
      return res.status(403).json({ 
        message: 'Only the assigned veterinarian can share this case' 
      });
    }

    // Check if the target vet exists and is a veterinarian
    const targetVet = await User.findById(veterinarianId);
    if (!targetVet || targetVet.role !== 'veterinarian') {
      return res.status(404).json({ message: 'Target veterinarian not found' });
    }

    // Check if already collaborating
    if (animalCase.collaboratingVets.includes(veterinarianId)) {
      return res.status(400).json({ message: 'Veterinarian is already collaborating on this case' });
    }

    // Add to collaborating vets
    animalCase.collaboratingVets.push(veterinarianId);

    // Add collaboration history
    if (!animalCase.collaborationHistory) {
      animalCase.collaborationHistory = [];
    }

    animalCase.collaborationHistory.push({
      action: 'shared',
      performedBy: sharingVetId,
      targetVet: veterinarianId,
      message,
      accessLevel,
      timestamp: new Date()
    });

    await animalCase.save();

    // TODO: Send notification to the target veterinarian

    res.json({
      message: 'Case shared successfully',
      sharedWith: {
        _id: targetVet._id,
        name: targetVet.name,
        email: targetVet.email
      }
    });
  } catch (error) {
    console.error('Error sharing case:', error);
    res.status(500).json({ 
      message: 'Failed to share case', 
      error: error.message 
    });
  }
};

// Transfer case to another veterinarian
export const transferCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newVeterinarianId, reason, transferNotes } = req.body;
    const currentVetId = req.user.sub;

    if (!newVeterinarianId) {
      return res.status(400).json({ message: 'New veterinarian ID is required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check if the current user is assigned to the case
    if (!animalCase.assignedVet || animalCase.assignedVet.toString() !== currentVetId) {
      return res.status(403).json({ 
        message: 'Only the assigned veterinarian can transfer this case' 
      });
    }

    // Check if the new vet exists and is a veterinarian
    const newVet = await User.findById(newVeterinarianId);
    if (!newVet || newVet.role !== 'veterinarian') {
      return res.status(404).json({ message: 'Target veterinarian not found' });
    }

    // Update case assignment
    const previousVet = animalCase.assignedVet;
    animalCase.assignedVet = newVeterinarianId;
    animalCase.assignedDate = new Date();

    // Remove from collaborating vets if present
    animalCase.collaboratingVets = animalCase.collaboratingVets.filter(
      vetId => vetId.toString() !== newVeterinarianId
    );

    // Add collaboration history
    if (!animalCase.collaborationHistory) {
      animalCase.collaborationHistory = [];
    }

    animalCase.collaborationHistory.push({
      action: 'transferred',
      performedBy: currentVetId,
      targetVet: newVeterinarianId,
      previousVet,
      reason,
      message: transferNotes,
      timestamp: new Date()
    });

    // Add collaboration comment about the transfer
    if (!animalCase.collaborationComments) {
      animalCase.collaborationComments = [];
    }

    animalCase.collaborationComments.push({
      veterinarian: currentVetId,
      comment: `Case transferred to ${newVet.name}. Reason: ${reason}${transferNotes ? `. Notes: ${transferNotes}` : ''}`,
      isPrivate: false,
      timestamp: new Date()
    });

    await animalCase.save();

    // TODO: Send notification to the new veterinarian

    res.json({
      message: 'Case transferred successfully',
      transferredTo: {
        _id: newVet._id,
        name: newVet.name,
        email: newVet.email
      },
      previousVet: previousVet
    });
  } catch (error) {
    console.error('Error transferring case:', error);
    res.status(500).json({ 
      message: 'Failed to transfer case', 
      error: error.message 
    });
  }
};

// Remove collaboration access
export const removeCollaboration = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { veterinarianId } = req.body;
    const requestingVetId = req.user.sub;

    if (!veterinarianId) {
      return res.status(400).json({ message: 'Veterinarian ID is required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check permissions - only assigned vet or the collaborator themselves can remove access
    const isAssigned = animalCase.assignedVet && animalCase.assignedVet.toString() === requestingVetId;
    const isSelfRemoval = veterinarianId === requestingVetId;

    if (!isAssigned && !isSelfRemoval) {
      return res.status(403).json({ 
        message: 'Access denied. Only the assigned vet or the collaborator can remove collaboration access.' 
      });
    }

    // Check if the vet is actually collaborating
    if (!animalCase.collaboratingVets.includes(veterinarianId)) {
      return res.status(400).json({ message: 'Veterinarian is not collaborating on this case' });
    }

    // Remove from collaborating vets
    animalCase.collaboratingVets = animalCase.collaboratingVets.filter(
      vetId => vetId.toString() !== veterinarianId
    );

    // Add collaboration history
    if (!animalCase.collaborationHistory) {
      animalCase.collaborationHistory = [];
    }

    animalCase.collaborationHistory.push({
      action: 'collaboration_removed',
      performedBy: requestingVetId,
      targetVet: veterinarianId,
      message: isSelfRemoval ? 'Self-removed from collaboration' : 'Collaboration access removed',
      timestamp: new Date()
    });

    await animalCase.save();

    res.json({ message: 'Collaboration access removed successfully' });
  } catch (error) {
    console.error('Error removing collaboration:', error);
    res.status(500).json({ 
      message: 'Failed to remove collaboration access', 
      error: error.message 
    });
  }
};

// Get collaboration history for a case
export const getCollaborationHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    const veterinarianId = req.user.sub;

    const animalCase = await AnimalCase.findById(caseId)
      .populate('collaborationHistory.performedBy', 'name email role')
      .populate('collaborationHistory.targetVet', 'name email role')
      .populate('collaborationHistory.previousVet', 'name email role');

    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check access
    const isAssigned = animalCase.assignedVet && animalCase.assignedVet.toString() === veterinarianId;
    const isCollaborator = animalCase.collaboratingVets.includes(veterinarianId);

    if (!isAssigned && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Access denied. You must be assigned to or collaborating on this case.' 
      });
    }

    res.json({ 
      history: animalCase.collaborationHistory || [] 
    });
  } catch (error) {
    console.error('Error fetching collaboration history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch collaboration history', 
      error: error.message 
    });
  }
};

// Get available veterinarians for collaboration
export const getAvailableVeterinarians = async (req, res) => {
  try {
    const { caseId } = req.params;
    const requestingVetId = req.user.sub;

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check if requesting vet has access to the case
    const isAssigned = animalCase.assignedVet && animalCase.assignedVet.toString() === requestingVetId;
    const isCollaborator = animalCase.collaboratingVets.includes(requestingVetId);

    if (!isAssigned && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Access denied. You must be assigned to or collaborating on this case.' 
      });
    }

    // Get all veterinarians except the current assigned vet and current collaborators
    const excludeIds = [animalCase.assignedVet, ...animalCase.collaboratingVets];
    
    const availableVets = await User.find({
      role: 'veterinarian',
      _id: { $nin: excludeIds }
    }).select('name email specialization profileImage');

    res.json({ veterinarians: availableVets });
  } catch (error) {
    console.error('Error fetching available veterinarians:', error);
    res.status(500).json({ 
      message: 'Failed to fetch available veterinarians', 
      error: error.message 
    });
  }
};

// Get cases where the vet is collaborating
export const getCollaboratingCases = async (req, res) => {
  try {
    const veterinarianId = req.user.sub;
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      collaboratingVets: veterinarianId
    };

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const cases = await AnimalCase.find(filter)
      .populate('assignedVet', 'name email role')
      .populate('collaboratingVets', 'name email role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AnimalCase.countDocuments(filter);

    res.json({
      cases,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_cases: total,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching collaborating cases:', error);
    res.status(500).json({ 
      message: 'Failed to fetch collaborating cases', 
      error: error.message 
    });
  }
};