const express = require('express');
const {
  getAvailableVets,
  sendSupportRequest,
  getSupportRequests,
  respondToSupportRequest,
  getCollaborationDetails
} = require('../controllers/vetSupportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all available vets for support
router.get('/vets', authenticate, authorize('vet', 'admin'), getAvailableVets);

// Send support request to another vet
router.post('/request', authenticate, authorize('vet'), sendSupportRequest);

// Get support requests for the current vet
router.get('/requests', authenticate, authorize('vet'), getSupportRequests);

// Accept or decline a support request
router.put('/requests/:requestId/respond', authenticate, authorize('vet'), respondToSupportRequest);

// Get collaboration details for a case
router.get('/collaboration/:caseId', authenticate, authorize('vet'), getCollaborationDetails);

module.exports = router;


