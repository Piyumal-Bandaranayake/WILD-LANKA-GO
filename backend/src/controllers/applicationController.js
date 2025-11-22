const Application = require('../models/Application');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

/**
 * Get all applications (Admin/Wildlife Officer view)
 * GET /api/applications
 */
const getApplications = asyncHandler(async (req, res) => {
  const { status, applicationType, page = 1, limit = 10, startDate, endDate } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  if (applicationType) filter.applicationType = applicationType;
  
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const applications = await Application.find(filter)
    .populate('applicant', 'firstName lastName email')
    .populate('reviewedBy approvedBy rejectedBy', 'firstName lastName email')
    .populate('reviewNotes.reviewer', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Application.countDocuments(filter);
  
  return sendSuccess(res, {
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Applications retrieved successfully');
});

/**
 * Get single application by ID
 * GET /api/applications/:id
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('applicant', 'firstName lastName email phone')
    .populate('reviewedBy approvedBy rejectedBy', 'firstName lastName email')
    .populate('reviewNotes.reviewer', 'firstName lastName email');
  
  if (!application) {
    return sendNotFound(res, 'Application not found');
  }
  
  return sendSuccess(res, { application }, 'Application retrieved successfully');
});

/**
 * Create new application
 * POST /api/applications
 */
const createApplication = asyncHandler(async (req, res) => {
  const applicationData = {
    applicant: req.user._id,
    ...req.body
  };
  
  // Check if user already has a pending application of the same type
  const existingApplication = await Application.findOne({
    applicant: req.user._id,
    applicationType: req.body.applicationType,
    status: { $in: ['pending', 'under_review'] }
  });
  
  if (existingApplication) {
    return sendError(res, 'You already have a pending application for this position', 400);
  }
  
  const application = new Application(applicationData);
  await application.save();
  
  await application.populate('applicant', 'firstName lastName email');
  
  logger.info(`New application created: ${req.body.applicationType} by ${req.user.email}`);
  
  return sendSuccess(res, { application }, 'Application submitted successfully', 201);
});

/**
 * Update application status
 * PUT /api/applications/:id/status
 */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  const application = await Application.findById(req.params.id);
  
  if (!application) {
    return sendNotFound(res, 'Application not found');
  }
  
  await application.updateStatus(status, req.user._id, notes, req.user.role);
  
  await application.populate('applicant reviewedBy approvedBy rejectedBy', 'firstName lastName email');
  
  logger.info(`Application status updated: ${application._id} -> ${status} by ${req.user.email}`);
  
  return sendSuccess(res, { application }, 'Application status updated successfully');
});

/**
 * Get user's applications (Tourist view)
 * GET /api/applications/my-applications
 */
const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const applications = await Application.findByApplicant(req.user._id)
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Application.countDocuments({ applicant: req.user._id });
  
  return sendSuccess(res, {
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Your applications retrieved successfully');
});

/**
 * Get application statistics
 * GET /api/applications/statistics
 */
const getApplicationStatistics = asyncHandler(async (req, res) => {
  const statistics = await Application.getStatistics();
  
  return sendSuccess(res, { statistics }, 'Application statistics retrieved successfully');
});

/**
 * Update application (Applicant can edit pending applications)
 * PUT /api/applications/:id
 */
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  
  if (!application) {
    return sendNotFound(res, 'Application not found');
  }
  
  // Check if user owns this application
  if (application.applicant.toString() !== req.user._id.toString()) {
    return sendError(res, 'You can only update your own applications', 403);
  }
  
  // Only allow updates if application is pending
  if (application.status !== 'pending') {
    return sendError(res, 'You can only update pending applications', 400);
  }
  
  const allowedUpdates = [
    'personalInfo', 'qualifications', 'tourGuideInfo', 'driverInfo', 'documents'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });
  
  const updatedApplication = await Application.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('applicant', 'firstName lastName email');
  
  logger.info(`Application updated: ${updatedApplication._id} by ${req.user.email}`);
  
  return sendSuccess(res, { application: updatedApplication }, 'Application updated successfully');
});

/**
 * Delete application (Admin only or applicant for pending applications)
 * DELETE /api/applications/:id
 */
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  
  if (!application) {
    return sendNotFound(res, 'Application not found');
  }
  
  // Check permissions
  const isOwner = application.applicant.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return sendError(res, 'You do not have permission to delete this application', 403);
  }
  
  // Only allow deletion of pending applications (unless admin)
  if (!isAdmin && application.status !== 'pending') {
    return sendError(res, 'You can only delete pending applications', 400);
  }
  
  await Application.findByIdAndDelete(req.params.id);
  
  logger.info(`Application deleted: ${application._id} by ${req.user.email}`);
  
  return sendSuccess(res, null, 'Application deleted successfully');
});

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  getMyApplications,
  getApplicationStatistics,
  updateApplication,
  deleteApplication
};
