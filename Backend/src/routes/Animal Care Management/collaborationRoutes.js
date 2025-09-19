import express from 'express';
import {
  addCollaborationComment,
  getCollaborationComments,
  shareCaseWithVet,
  transferCase,
  removeCollaboration,
  getCollaborationHistory,
  getAvailableVeterinarians,
  getCollaboratingCases
} from '../../controllers/animalCare/collaborationController.js';
import auth0UserInfoMiddleware from '../../middleware/auth0UserInfoMiddleware.js';

const router = express.Router();

// Collaboration comments
router.post('/:caseId/comments', auth0UserInfoMiddleware, addCollaborationComment);
router.get('/:caseId/comments', auth0UserInfoMiddleware, getCollaborationComments);

// Case sharing and transfer
router.post('/:caseId/share', auth0UserInfoMiddleware, shareCaseWithVet);
router.post('/:caseId/transfer', auth0UserInfoMiddleware, transferCase);
router.delete('/:caseId/collaboration', auth0UserInfoMiddleware, removeCollaboration);

// Collaboration history and utilities
router.get('/:caseId/history', auth0UserInfoMiddleware, getCollaborationHistory);
router.get('/:caseId/available-vets', auth0UserInfoMiddleware, getAvailableVeterinarians);
router.get('/collaborating-cases', auth0UserInfoMiddleware, getCollaboratingCases);

export default router;