const Feedback = require('../models/FeedbackModel');
const Tourist = require('../models/Tourist');
const SystemUser = require('../models/SystemUser');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../../config/logger');

// Tourist adds feedback with images
const createFeedback = async (req, res) => {
    try {
        const { message, eventType, activityType, tourGuideName } = req.body;
        
        // Get user info from authenticated user
        const userId = req.user._id;
        const username = req.user.firstName + ' ' + req.user.lastName;
        const userType = req.user.role === 'tourist' ? 'Tourist' : 'SystemUser';

        // Debug image upload
        logger.info('Feedback creation debug:', {
            hasFiles: !!req.files,
            filesCount: req.files?.length || 0,
            hasBodyImages: !!req.body.images,
            bodyImagesCount: req.body.images?.length || 0,
            bodyImages: req.body.images
        });

        // Handle image URLs from Cloudinary upload (extract URLs for feedback model)
        let images = [];
        if (req.body.images && Array.isArray(req.body.images)) {
            // Extract URLs from image objects (feedback model expects array of strings)
            logger.info('Processing req.body.images:', JSON.stringify(req.body.images));
            images = req.body.images.map(img => {
                const url = img.url || img;
                logger.info('Extracted image URL:', url);
                return url;
            });
            logger.info('Using images from upload middleware:', images.length, 'URLs:', images);
        } else if (req.files && req.files.length > 0) {
            // Fallback to local file paths if Cloudinary fails
            images = req.files.map(file => file.path);
            logger.info('Using local file paths as fallback:', images.length);
        }

        // Only set the feedback type that has a value (mutually exclusive)
        const feedbackData = {
            username,
            message,
            tourGuideName,
            images,
            userId,
            userType
        };

        // Set only the selected feedback type
        if (eventType && eventType.trim() !== '') {
            feedbackData.eventType = eventType;
        }
        if (activityType && activityType.trim() !== '') {
            feedbackData.activityType = activityType;
        }

        const newFeedback = new Feedback(feedbackData);

        await newFeedback.save();
        
        logger.info(`Feedback created by ${username} (${userType}) with ${images.length} images`);
        return sendSuccess(res, newFeedback, 'Feedback submitted successfully', 201);
    } catch (error) {
        logger.error('Error creating feedback:', error);
        return sendError(res, 'Failed to submit feedback', 500);
    }
};

// Get all feedback (admin/wildlife officer)
const getFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName email');
        
        return sendSuccess(res, feedback, 'Feedback retrieved successfully');
    } catch (error) {
        logger.error('Error fetching feedback:', error);
        return sendError(res, 'Failed to fetch feedback', 500);
    }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('userId', 'firstName lastName email');
        
        if (!feedback) {
            return sendError(res, 'Feedback not found', 404);
        }
        
        return sendSuccess(res, feedback, 'Feedback retrieved successfully');
    } catch (error) {
        logger.error('Error fetching feedback by ID:', error);
        return sendError(res, 'Failed to fetch feedback', 500);
    }
};

// Update feedback
const updateFeedback = async (req, res) => {
    try {
        const { message, eventType, activityType, tourGuideName } = req.body;
        
        // Check if feedback exists and user owns it
        const existingFeedback = await Feedback.findById(req.params.id);
        if (!existingFeedback) {
            return sendError(res, 'Feedback not found', 404);
        }
        
        // Check if user owns this feedback (for tourists) or is admin/wildlife officer
        if (req.user.role === 'tourist' && existingFeedback.userId.toString() !== req.user._id.toString()) {
            return sendError(res, 'Unauthorized to update this feedback', 403);
        }
        
        // Build update object with only provided fields
        const updateData = {};
        if (message !== undefined) updateData.message = message;
        if (eventType !== undefined) updateData.eventType = eventType;
        if (activityType !== undefined) updateData.activityType = activityType;
        if (tourGuideName !== undefined) updateData.tourGuideName = tourGuideName;
        
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('userId', 'firstName lastName email');
        
        logger.info(`Feedback updated by ${req.user.firstName} ${req.user.lastName}`);
        return sendSuccess(res, updatedFeedback, 'Feedback updated successfully');
    } catch (error) {
        logger.error('Error updating feedback:', error);
        return sendError(res, 'Failed to update feedback', 500);
    }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return sendError(res, 'Feedback not found', 404);
        }

        // Check if user owns this feedback (for tourists) or is admin/wildlife officer
        if (req.user.role === 'tourist' && feedback.userId.toString() !== req.user._id.toString()) {
            return sendError(res, 'Unauthorized to delete this feedback', 403);
        }

        await Feedback.findByIdAndDelete(req.params.id);
        
        logger.info(`Feedback deleted by ${req.user.firstName} ${req.user.lastName}`);
        return sendSuccess(res, null, 'Feedback deleted successfully');
    } catch (error) {
        logger.error('Error deleting feedback:', error);
        return sendError(res, 'Failed to delete feedback', 500);
    }
};

// Get my feedback (for tourists)
const getMyFeedback = async (req, res) => {
    try {
        logger.info(`Fetching feedback for user: ${req.user._id} (${req.user.firstName} ${req.user.lastName})`);
        
        const feedback = await Feedback.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        
        logger.info(`Found ${feedback.length} feedback items for user ${req.user._id}`);
        return sendSuccess(res, feedback, 'My feedback retrieved successfully');
    } catch (error) {
        logger.error('Error fetching my feedback:', error);
        return sendError(res, 'Failed to fetch my feedback', 500);
    }
};

// Get public feedback (for display)
const getPublicFeedback = async (req, res) => {
    try {
        // Return all feedback for community display (not just resolved)
        const feedback = await Feedback.find({})
            .sort({ createdAt: -1 })
            .limit(20);
        
        logger.info(`Retrieved ${feedback.length} public feedback items`);
        return sendSuccess(res, feedback, 'Public feedback retrieved successfully');
    } catch (error) {
        logger.error('Error fetching public feedback:', error);
        return sendError(res, 'Failed to fetch public feedback', 500);
    }
};

// Get feedback statistics (admin/wildlife officer)
const getFeedbackStatistics = async (req, res) => {
    try {
        const stats = await Feedback.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalFeedback = await Feedback.countDocuments();
        
        return sendSuccess(res, {
            total: totalFeedback,
            byStatus: stats
        }, 'Feedback statistics retrieved successfully');
    } catch (error) {
        logger.error('Error fetching feedback statistics:', error);
        return sendError(res, 'Failed to fetch feedback statistics', 500);
    }
};

// Update feedback status (admin/wildlife officer)
const updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return sendError(res, 'Invalid status value', 400);
        }
        
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('userId', 'firstName lastName email');
        
        if (!updatedFeedback) {
            return sendError(res, 'Feedback not found', 404);
        }
        
        logger.info(`Feedback status updated to ${status} by ${req.user.firstName} ${req.user.lastName}`);
        return sendSuccess(res, updatedFeedback, 'Feedback status updated successfully');
    } catch (error) {
        logger.error('Error updating feedback status:', error);
        return sendError(res, 'Failed to update feedback status', 500);
    }
};

module.exports = {
    createFeedback,
    getFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    getMyFeedback,
    getPublicFeedback,
    getFeedbackStatistics,
    updateFeedbackStatus
};
