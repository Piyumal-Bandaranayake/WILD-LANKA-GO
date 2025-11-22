const Emergency = require('../../models/emergency/emergency');
const SystemUser = require('../../models/SystemUser');

// Report an emergency (for public/visitor use)
const reportEmergency = async (req, res) => {
    try {
        const { type, description, location, date, time, status } = req.body;

        // Basic validation
        if (!type || !description || !location || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
                errors: {
                    type: !type ? 'Emergency type is required' : null,
                    description: !description ? 'Description is required' : null,
                    location: !location ? 'Location is required' : null,
                    date: !date ? 'Date is required' : null,
                    time: !time ? 'Time is required' : null
                }
            });
        }

        // Validate the type of emergency
        const validTypes = ['Human', 'Animal', 'Physical', 'Unethical', 'Equipment', 'Natural Disaster'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid emergency type',
                validTypes: validTypes
            });
        }

        // Create a new emergency instance
        const newEmergency = new Emergency({
            type,
            description,
            location,
            date: new Date(date),
            time,
            status: status || 'Reported',
            reporter: {
                reportMethod: 'App Form'
            },
            incident: {
                title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
                description,
                location: {
                    name: location
                },
                timeOfIncident: new Date(date),
                timeReported: new Date()
            }
        });

        await newEmergency.save();
        
        res.status(201).json({
            success: true,
            message: 'Emergency reported successfully',
            data: newEmergency
        });
    } catch (error) {
        console.error('Error reporting emergency:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create emergency by call operator (enhanced version)
const createEmergencyByCallOperator = async (req, res) => {
    try {
        const {
            type,
            description,
            location,
            priority = 'Medium',
            reporterName,
            reporterPhone,
            assignedOfficer,
            incidentDetails,
            witnessInfo,
            createdBy,
            createdById,
            forwardedTo,
            isDirectCall = false
        } = req.body;

        // Validation
        if (!type || !description || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
                errors: {
                    type: !type ? 'Emergency type is required' : null,
                    description: !description ? 'Description is required' : null,
                    location: !location ? 'Location is required' : null
                }
            });
        }

        // Validate emergency type
        const validTypes = ['Human', 'Animal', 'Physical', 'Unethical', 'Equipment', 'Natural Disaster'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid emergency type',
                validTypes: validTypes
            });
        }

        // Validate priority
        const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority level',
                validPriorities: validPriorities
            });
        }

        // Determine category based on type
        let category = 'Other';
        switch (type) {
            case 'Human':
                category = 'Medical Emergency';
                break;
            case 'Animal':
                category = 'Injured Animal';
                break;
            case 'Physical':
                category = 'Fire';
                break;
            case 'Unethical':
                category = 'Poaching';
                break;
            case 'Equipment':
                category = 'Equipment Failure';
                break;
            case 'Natural Disaster':
                category = 'Storm';
                break;
        }

        // Create emergency with enhanced data structure
        const newEmergency = new Emergency({
            type,
            category,
            priority,
            status: 'Reported',
            reporter: {
                guestInfo: {
                    name: reporterName || 'Call Operator',
                    phone: reporterPhone || 'N/A',
                    role: 'Call Operator'
                },
                reportMethod: isDirectCall ? 'Phone Call' : 'App Form'
            },
            incident: {
                title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
                description: description,
                location: {
                    name: location
                },
                timeOfIncident: new Date(),
                timeReported: new Date(),
                witnessCount: witnessInfo ? 1 : 0,
                witnessDetails: witnessInfo ? [witnessInfo] : []
            },
            assignment: {
                callOperator: createdById,
                assignedTo: assignedOfficer,
                assignedRole: forwardedTo,
                assignedAt: new Date(),
                assignedBy: createdById
            },
            // Legacy fields for backward compatibility
            description,
            location,
            date: new Date(),
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            reportedBy: createdBy || 'Call Operator',
            forwardedTo: forwardedTo,
            isDirectCall
        });

        await newEmergency.save();

        res.status(201).json({
            success: true,
            message: 'Emergency logged successfully',
            data: newEmergency
        });
    } catch (error) {
        console.error('Error creating emergency by call operator:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all emergencies with filtering and pagination
const getAllEmergencies = async (req, res) => {
    try {
        const {
            status,
            type,
            priority,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const emergencies = await Emergency.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('assignment.assignedTo', 'name email phone role')
            .populate('assignment.callOperator', 'name email phone role');

        const total = await Emergency.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: emergencies,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total: total
            }
        });
    } catch (error) {
        console.error('Error fetching emergencies:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergencies'
        });
    }
};

// Get emergency by ID
const getEmergencyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const emergency = await Emergency.findById(id)
            .populate('assignment.assignedTo', 'name email phone role')
            .populate('assignment.callOperator', 'name email phone role');
            
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: emergency
        });
    } catch (error) {
        console.error('Error fetching emergency:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency'
        });
    }
};

// Update emergency status
const updateEmergencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedTo } = req.body;

        // Validate status
        const validStatuses = ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                validStatuses: validStatuses
            });
        }

        const updateData = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (notes) {
            // Add new note to existing adminNotes array
            updateData.$push = {
                adminNotes: {
                    note: notes,
                    addedAt: new Date(),
                    isPrivate: false
                }
            };
        }
        if (assignedTo) updateData['assignment.assignedTo'] = assignedTo;

        const emergency = await Emergency.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('assignment.assignedTo', 'name email phone role')
         .populate('assignment.callOperator', 'name email phone role');

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Emergency updated successfully',
            data: emergency
        });
    } catch (error) {
        console.error('Error updating emergency:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update emergency'
        });
    }
};

// Delete emergency
const deleteEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // First, find the emergency to check permissions
        const emergency = await Emergency.findById(id);
        
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }
        
        // Security check: Call operators can only delete emergencies they created
        // Admins can delete any emergency
        if (userRole === 'callOperator' && emergency.reporter && emergency.reporter.userId && emergency.reporter.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete emergencies you created'
            });
        }
        
        // Delete the emergency
        await Emergency.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Emergency deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting emergency:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete emergency'
        });
    }
};

// Get emergency statistics
const getEmergencyStats = async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                dateFilter = { createdAt: { $gte: today } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
        }

        const stats = await Emergency.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    byType: {
                        $push: {
                            type: '$type',
                            status: '$status',
                            priority: '$priority'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    byType: 1,
                    byStatus: {
                        $reduce: {
                            input: '$byType',
                            initialValue: { reported: 0, acknowledged: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0 },
                            in: {
                                $mergeObjects: [
                                    '$$value',
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ['$$this.status', 'Reported'] }, then: { reported: { $add: ['$$value.reported', 1] } } },
                                                { case: { $eq: ['$$this.status', 'Acknowledged'] }, then: { acknowledged: { $add: ['$$value.acknowledged', 1] } } },
                                                { case: { $eq: ['$$this.status', 'Assigned'] }, then: { assigned: { $add: ['$$value.assigned', 1] } } },
                                                { case: { $eq: ['$$this.status', 'In Progress'] }, then: { inProgress: { $add: ['$$value.inProgress', 1] } } },
                                                { case: { $eq: ['$$this.status', 'Resolved'] }, then: { resolved: { $add: ['$$value.resolved', 1] } } },
                                                { case: { $eq: ['$$this.status', 'Closed'] }, then: { closed: { $add: ['$$value.closed', 1] } } }
                                            ],
                                            default: '$$value'
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    byPriority: {
                        $reduce: {
                            input: '$byType',
                            initialValue: { low: 0, medium: 0, high: 0, critical: 0 },
                            in: {
                                $mergeObjects: [
                                    '$$value',
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ['$$this.priority', 'Low'] }, then: { low: { $add: ['$$value.low', 1] } } },
                                                { case: { $eq: ['$$this.priority', 'Medium'] }, then: { medium: { $add: ['$$value.medium', 1] } } },
                                                { case: { $eq: ['$$this.priority', 'High'] }, then: { high: { $add: ['$$value.high', 1] } } },
                                                { case: { $eq: ['$$this.priority', 'Critical'] }, then: { critical: { $add: ['$$value.critical', 1] } } }
                                            ],
                                            default: '$$value'
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {
                total: 0,
                byStatus: { reported: 0, acknowledged: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0 },
                byPriority: { low: 0, medium: 0, high: 0, critical: 0 }
            }
        });
    } catch (error) {
        console.error('Error fetching emergency statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency statistics'
        });
    }
};

// Assign emergency to staff member
const assignEmergency = async (req, res) => {
    try {
        console.log(' assignEmergency controller called with:', req.params, req.body);
        const { id } = req.params;
        const { userId, userModel } = req.body;

        if (!userId || !userModel) {
            return res.status(400).json({
                success: false,
                message: 'userId and userModel are required'
            });
        }

        const validRoles = ['Vet', 'EmergencyOfficer'];
        if (!validRoles.includes(userModel)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid userModel. Allowed: Vet, EmergencyOfficer'
            });
        }

        // Map frontend role names to database enum values
        const roleMapping = {
            'Vet': 'Veterinarian',
            'EmergencyOfficer': 'Emergency Officer'
        };
        const dbRole = roleMapping[userModel];

        const assignedUser = await SystemUser.findOne({ 
            _id: userId, 
            role: userModel.toLowerCase() === 'vet' ? 'vet' : 'emergencyOfficer',
            status: { $in: ['active', 'inactive'] } // Allow both active and inactive users for emergency assignment
        });

        if (!assignedUser) {
            return res.status(404).json({
                success: false,
                message: 'Assigned user not found'
            });
        }

        const updatedEmergency = await Emergency.findByIdAndUpdate(
            id,
            {
                'assignment.assignedTo': assignedUser._id,
                'assignment.assignedRole': dbRole,
                'assignment.assignedAt': new Date(),
                'assignment.assignedBy': req.user._id,
                status: 'pending' // Set status to pending when assigned
            },
            { new: true }
        ).populate('assignment.assignedTo', 'firstName lastName email phone role');

        if (!updatedEmergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Emergency assigned successfully',
            data: updatedEmergency
        });
    } catch (error) {
        console.error('Error assigning emergency:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Failed to assign emergency',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get emergencies assigned to a specific user
const getAssignedEmergencies = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, priority } = req.query;
        
        console.log('🔍 getAssignedEmergencies called for user:', userId);
        
        // Build query for emergencies assigned to this user
        const query = {
            'assignment.assignedTo': userId
        };
        
        // Add optional filters
        if (status) {
            query.status = status;
        }
        if (priority) {
            query.priority = priority;
        }
        
        console.log('🔍 Query built:', query);
        
        const assignedEmergencies = await Emergency.find(query)
            .populate('assignment.assignedTo', 'firstName lastName email phone role')
            .populate('assignment.assignedBy', 'firstName lastName email phone role')
            .populate('assignment.callOperator', 'firstName lastName email phone role')
            .sort({ 'assignment.assignedAt': -1 }); // Most recently assigned first
        
        console.log('📊 Found assigned emergencies:', assignedEmergencies.length);
        
        res.status(200).json({
            success: true,
            message: 'Assigned emergencies retrieved successfully',
            data: assignedEmergencies
        });
    } catch (error) {
        console.error('Error getting assigned emergencies:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve assigned emergencies',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Simple status update for emergency officers
const updateEmergencyStatusSimple = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;
        
        console.log('🔄 updateEmergencyStatusSimple called:', { id, status, userId });
        
        // Validate status
        const validStatuses = ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
            });
        }
        
        // Check if emergency exists and is assigned to this user
        const emergency = await Emergency.findOne({
            _id: id,
            'assignment.assignedTo': userId
        });
        
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found or not assigned to you'
            });
        }
        
        // Update the status
        const updatedEmergency = await Emergency.findByIdAndUpdate(
            id,
            { 
                status: status,
                'response.acknowledgedAt': status === 'In Progress' ? new Date() : emergency.response?.acknowledgedAt,
                'response.responseStarted': status === 'In Progress' ? new Date() : emergency.response?.responseStarted,
                'response.responseCompleted': status === 'Resolved' || status === 'Closed' ? new Date() : emergency.response?.responseCompleted
            },
            { new: true }
        ).populate('assignment.assignedTo', 'firstName lastName email phone role');
        
        console.log('✅ Status updated successfully:', updatedEmergency.status);
        
        res.status(200).json({
            success: true,
            message: 'Emergency status updated successfully',
            data: updatedEmergency
        });
    } catch (error) {
        console.error('Error updating emergency status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update emergency status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    reportEmergency,
    createEmergencyByCallOperator,
    getAllEmergencies,
    getEmergencyById,
    updateEmergencyStatus,
    deleteEmergency,
    getEmergencyStats,
    assignEmergency,
    getAssignedEmergencies,
    updateEmergencyStatusSimple
};

