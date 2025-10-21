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

const router = express.Router();

// Collaboration comments
router.post('/:caseId/comments', addCollaborationComment);
router.get('/:caseId/comments', getCollaborationComments);

// Case sharing and transfer
router.post('/:caseId/share', shareCaseWithVet);
router.post('/:caseId/transfer', transferCase);
router.delete('/:caseId/collaboration', removeCollaboration);

// Collaboration history and utilities
router.get('/:caseId/history', getCollaborationHistory);
router.get('/:caseId/available-vets', getAvailableVeterinarians);
router.get('/collaborating-cases', getCollaboratingCases);

export default router;