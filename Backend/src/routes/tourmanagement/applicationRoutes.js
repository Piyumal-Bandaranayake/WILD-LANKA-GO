import express from 'express';
import {
  submitApplication,
  wpoSetStatus,
  adminCreateAccount,
  listApplications
} from '../../controllers/tourmanagement/applicationController.js';

const router = express.Router();

// Applicant submits (public)
router.post('/apply', submitApplication);

// WPO actions
router.patch('/:id/wpo', wpoSetStatus); // body: { action: 'approve' | 'reject', notes? }

// Admin creates account
router.post('/:id/admin-create-account', adminCreateAccount);

// Lists (WPO/Admin dashboards)
router.get('/', listApplications);

export default router;
