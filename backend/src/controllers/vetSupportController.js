const SystemUser = require('../models/SystemUser');
const logger = require('../../config/logger');

// Get all available vets for support
const getAvailableVets = async (req, res) => {
  try {
    const { specialization, status } = req.query;
    const query = { role: 'vet' };
    
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }
    
    if (status) {
      query.status = status;
    }

    const vets = await SystemUser.find(query)
      .select('firstName lastName email specialization status lastActive experience casesHandled')
      .sort({ lastActive: -1 });

    // Add mock online/offline status for demo purposes
    const vetsWithStatus = vets.map(vet => ({
      ...vet.toObject(),
      isOnline: Math.random() > 0.3, // Mock: 70% chance of being online
      lastActive: vet.lastActive || new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    }));

    res.json({
      success: true,
      data: vetsWithStatus
    });
  } catch (error) {
    logger.error('Error fetching available vets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available vets',
      error: error.message
    });
  }
};

// Send support request to another vet
const sendSupportRequest = async (req, res) => {
  try {
    const { targetVetId, caseId, message, priority = 'medium' } = req.body;
    const requesterId = req.user._id;

    // Validate target vet exists
    const targetVet = await SystemUser.findById(targetVetId);
    if (!targetVet || targetVet.role !== 'vet') {
      return res.status(404).json({
        success: false,
        message: 'Target veterinarian not found'
      });
    }

    // Create support request (in a real implementation, you'd have a SupportRequest model)
    const supportRequest = {
      requesterId,
      targetVetId,
      caseId,
      message,
      priority,
      status: 'pending',
      createdAt: new Date()
    };

    // In a real implementation, you would:
    // 1. Save the request to a database
    // 2. Send real-time notification to the target vet
    // 3. Send email notification
    // 4. Update the UI in real-time

    logger.info(`Support request sent from ${req.user.email} to ${targetVet.email}`);

    res.json({
      success: true,
      message: 'Support request sent successfully',
      data: supportRequest
    });
  } catch (error) {
    logger.error('Error sending support request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send support request',
      error: error.message
    });
  }
};

// Get support requests for the current vet
const getSupportRequests = async (req, res) => {
  try {
    const vetId = req.user._id;
    const { status } = req.query;

    // In a real implementation, you would fetch from a SupportRequest collection
    // For now, return mock data
    const mockRequests = [
      {
        id: 1,
        requesterId: 'mock-requester-1',
        requesterName: 'Dr. Sarah Johnson',
        caseId: 'CASE-2024-001',
        message: 'Need consultation on elephant treatment protocol',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        caseDetails: {
          animalType: 'Elephant',
          location: 'Yala National Park',
          symptoms: 'Limping, loss of appetite'
        }
      },
      {
        id: 2,
        requesterId: 'mock-requester-2',
        requesterName: 'Dr. Michael Chen',
        caseId: 'CASE-2024-002',
        message: 'Requesting second opinion on surgical procedure',
        priority: 'medium',
        status: 'accepted',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        caseDetails: {
          animalType: 'Leopard',
          location: 'Wilpattu National Park',
          symptoms: 'Broken leg, internal bleeding'
        }
      }
    ];

    let filteredRequests = mockRequests;
    if (status) {
      filteredRequests = mockRequests.filter(req => req.status === status);
    }

    res.json({
      success: true,
      data: filteredRequests
    });
  } catch (error) {
    logger.error('Error fetching support requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support requests',
      error: error.message
    });
  }
};

// Accept or decline a support request
const respondToSupportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const vetId = req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "decline"'
      });
    }

    // In a real implementation, you would:
    // 1. Update the support request status in the database
    // 2. Send notification to the requester
    // 3. If accepted, create a collaboration session
    // 4. Update real-time UI for both vets

    logger.info(`Vet ${req.user.email} ${action}ed support request ${requestId}`);

    res.json({
      success: true,
      message: `Support request ${action}ed successfully`,
      data: {
        requestId,
        action,
        status: action === 'accept' ? 'accepted' : 'declined',
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error responding to support request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to support request',
      error: error.message
    });
  }
};

// Get collaboration details for a case
const getCollaborationDetails = async (req, res) => {
  try {
    const { caseId } = req.params;
    const vetId = req.user._id;

    // In a real implementation, you would:
    // 1. Check if the vet has access to this case
    // 2. Fetch case details
    // 3. Fetch shared treatment plans
    // 4. Fetch collaboration history

    // Mock collaboration data
    const collaborationData = {
      caseId,
      participants: [
        {
          id: req.user._id,
          name: req.user.firstName + ' ' + req.user.lastName,
          role: 'collaborator'
        }
      ],
      sharedTreatments: [],
      messages: [],
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: collaborationData
    });
  } catch (error) {
    logger.error('Error fetching collaboration details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collaboration details',
      error: error.message
    });
  }
};

module.exports = {
  getAvailableVets,
  sendSupportRequest,
  getSupportRequests,
  respondToSupportRequest,
  getCollaborationDetails
};


