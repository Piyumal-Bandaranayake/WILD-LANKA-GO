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
import flexibleAuth from '../../middleware/flexibleAuthMiddleware.js';
import { authorizeRoles } from '../../middleware/rolesMiddleware.js';

const router = express.Router();

// Collaboration comments
router.post('/:caseId/comments', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), addCollaborationComment);
router.get('/:caseId/comments', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getCollaborationComments);

// Case sharing and transfer
router.post('/:caseId/share', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), shareCaseWithVet);
router.post('/:caseId/transfer', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), transferCase);
router.delete('/:caseId/collaboration', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), removeCollaboration);

// Collaboration history and utilities
router.get('/:caseId/history', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getCollaborationHistory);
router.get('/:caseId/available-vets', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getAvailableVeterinarians);
router.get('/collaborating-cases', flexibleAuth, authorizeRoles('vet', 'WildlifeOfficer', 'admin'), getCollaboratingCases);

export default router;