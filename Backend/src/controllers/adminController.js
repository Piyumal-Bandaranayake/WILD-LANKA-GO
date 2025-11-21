const SystemUser = require('../models/SystemUser');
const Tourist = require('../models/Tourist');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');
const bcrypt = require('bcryptjs');

/**
 * Get all users (Admin view)
 * GET /api/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { userType, role, status, page = 1, limit = 50 } = req.query; // Increased default limit
  
  let users = [];
  let total = 0;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // If no specific userType is requested, get all users without artificial limits
  const shouldGetAll = !userType || userType === 'all';
  const actualLimit = shouldGetAll ? parseInt(limit) : parseInt(limit);
  
  if (userType === 'tourist' || shouldGetAll) {
    const touristFilter = {};
    if (status) touristFilter.status = status;
    
    const tourists = await Tourist.find(touristFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(userType === 'tourist' ? skip : 0)
      .limit(userType === 'tourist' ? actualLimit : actualLimit);
    
    const touristCount = await Tourist.countDocuments(touristFilter);
    
    users = users.concat(tourists.map(tourist => ({
      ...tourist.toObject(),
      userType: 'tourist'
    })));
    
    total += touristCount;
  }
  
  if (userType === 'system' || shouldGetAll) {
    const systemFilter = {};
    if (role) systemFilter.role = role;
    if (status) systemFilter.status = status;
    
    const systemUsers = await SystemUser.find(systemFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(userType === 'system' ? skip : 0)
      .limit(userType === 'system' ? actualLimit : actualLimit);
    
    const systemCount = await SystemUser.countDocuments(systemFilter);
    
    users = users.concat(systemUsers.map(user => ({
      ...user.toObject(),
      userType: 'system'
    })));
    
    total += systemCount;
  }
  
  // Sort combined results by creation date
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return sendSuccess(res, {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Users retrieved successfully');
});

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Try to find in SystemUser first
  let user = await SystemUser.findById(id).select('-password');
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findById(id).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'User retrieved successfully');
});

/**
 * Create new system user
 * POST /api/admin/users
 */
const createSystemUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
    department,
    employeeId,
    qualifications,
    veterinaryLicense,
    // Driver-specific fields
    driverInfo,
    // Tour Guide-specific fields
    guideInfo
  } = req.body;
  
  // Check if user already exists
  const existingSystemUser = await SystemUser.findOne({ email });
  const existingTourist = await Tourist.findOne({ email });
  
  if (existingSystemUser || existingTourist) {
    return sendError(res, 'User with this email already exists', 400);
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const userData = {
    firstName,
    lastName,
    email,
    phone,
    password: hashedPassword,
    role,
    status: 'active',
    isEmailVerified: true,
    createdBy: req.user._id
  };
  
  // Add role-specific fields
  if (department) userData.department = department;
  if (employeeId) userData.employeeId = employeeId;
  if (qualifications) userData.qualifications = qualifications;
  if (veterinaryLicense) userData.veterinaryLicense = veterinaryLicense;
  
  // Add driver-specific information
  if (role === 'safariDriver' && driverInfo) {
    userData.driverInfo = {
      licenseNumber: driverInfo.licenseNumber,
      licenseType: driverInfo.licenseType,
      licenseExpiryDate: driverInfo.licenseExpiryDate,
      licenseIssuedDate: driverInfo.licenseIssuedDate,
      issuingAuthority: driverInfo.issuingAuthority,
      vehicleInfo: {
        vehicleType: driverInfo.vehicleType,
        vehicleNumber: driverInfo.vehicleNumber,
        vehicleModel: driverInfo.vehicleModel,
        vehicleYear: driverInfo.vehicleYear,
        capacity: driverInfo.capacity,
        fuelType: driverInfo.fuelType || 'Diesel',
        averageFuelConsumption: driverInfo.averageFuelConsumption,
      },
      bankDetails: driverInfo.bankDetails || {},
      documentation: driverInfo.documentation || {},
      performance: {
        totalToursCompleted: 0,
        totalDistanceDriven: 0,
        averageRating: 0,
        totalEarnings: 0,
        onTimePercentage: 100,
        fuelEfficiencyRating: 0,
      },
      tourHistory: [],
      unavailableDates: [],
      fuelClaims: [],
      odometerTracking: {
        currentReading: 0,
        lastUpdated: new Date(),
        maintenanceAlerts: [],
      },
      gpsTracking: {
        isActive: false,
        currentLocation: {},
        locationHistory: [],
        deviceInfo: {},
        safeZones: [],
        alerts: [],
      }
    };
  }
  
  // Add tour guide-specific information
  if (role === 'tourGuide' && guideInfo) {
    userData.guideInfo = {
      guideRegistrationNo: guideInfo.guideRegistrationNo,
      registrationExpiryDate: guideInfo.registrationExpiryDate,
      registrationIssuedDate: guideInfo.registrationIssuedDate,
      issuingAuthority: guideInfo.issuingAuthority,
      experienceYears: guideInfo.experienceYears || 0,
      languages: guideInfo.languages || [],
      specializations: guideInfo.specializations || [],
      areasOfExpertise: guideInfo.areasOfExpertise || [],
      previousEmployers: guideInfo.previousEmployers || [],
      certifications: guideInfo.certifications || [],
      tourMaterials: guideInfo.tourMaterials || [],
      ratings: guideInfo.ratings || [],
      tourAssignments: guideInfo.tourAssignments || [],
      availabilitySettings: {
        preferredAreas: guideInfo.preferredAreas || [],
        maxToursPerDay: guideInfo.maxToursPerDay || 2,
        workingHours: {
          start: guideInfo.workingHoursStart || '05:00',
          end: guideInfo.workingHoursEnd || '19:00',
        },
      },
      bankDetails: guideInfo.bankDetails || {},
      documentation: guideInfo.documentation || {},
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        tourReminders: true,
        ratingNotifications: true,
      },
      performance: {
        totalToursCompleted: 0,
        averageRating: 0,
        totalEarnings: 0,
        onTimePercentage: 100,
        customerSatisfactionScore: 0,
        repeatCustomerRate: 0,
        knowledgeRating: 0,
        communicationRating: 0,
      },
      tourHistory: [],
      unavailableDates: [],
    };
  }
  
  const user = new SystemUser(userData);
  await user.save();
  
  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;
  
  logger.info(`New system user created: ${email} (${role}) by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...userResponse,
      userType: 'system'
    }
  }, 'System user created successfully', 201);
});

/**
 * Update user
 * PUT /api/admin/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Remove sensitive fields that shouldn't be updated this way
  delete updates.password;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;
  
  // Try to find and update in SystemUser first
  let user = await SystemUser.findByIdAndUpdate(
    id,
    { ...updates, updatedBy: req.user._id },
    { new: true, runValidators: true }
  ).select('-password');
  
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  logger.info(`User updated: ${user.email} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'User updated successfully');
});

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!role) {
    return sendError(res, 'Role is required', 400);
  }
  
  // Valid roles
  const validRoles = ['admin', 'wildlifeOfficer', 'tourGuide', 'safariDriver', 'emergencyOfficer', 'callOperator', 'vet'];
  if (!validRoles.includes(role)) {
    return sendError(res, 'Invalid role', 400);
  }
  
  // Try to find and update in SystemUser first
  let user = await SystemUser.findByIdAndUpdate(
    id,
    { role, updatedBy: req.user._id },
    { new: true, runValidators: true }
  ).select('-password');
  
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  logger.info(`User role updated: ${user.email} -> ${role} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'User role updated successfully');
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Try to find and delete in SystemUser first
  let user = await SystemUser.findById(id);
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findById(id);
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  // Don't allow deletion of admin users by other admins
  if (user.role === 'admin' && req.user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Cannot delete other admin users', 403);
  }
  
  // Don't allow users to delete themselves
  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 'Cannot delete your own account', 403);
  }
  
  // Store user info for logging before deletion
  const userInfo = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.firstName ? `${user.firstName} ${user.lastName}` : user.name || 'Unknown'
  };
  
  // Hard delete - actually remove the user from database
  await user.deleteOne();
  
  logger.info(`User permanently deleted: ${userInfo.email} (${userInfo.name}) - Role: ${userInfo.role} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    deletedUser: userInfo 
  }, 'User deleted successfully');
});

/**
 * Update user status
 * PUT /api/admin/users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }
  
  // Try to find and update in SystemUser first
  let user = await SystemUser.findByIdAndUpdate(
    id,
    { status, updatedBy: req.user._id },
    { new: true }
  ).select('-password');
  
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  logger.info(`User status updated: ${user.email} -> ${status} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'User status updated successfully');
});

/**
 * Deactivate user (specific endpoint for deactivation)
 * PUT /api/admin/users/:id/deactivate
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Try to find and update in SystemUser first
  let user = await SystemUser.findByIdAndUpdate(
    id,
    { status: 'inactive', updatedBy: req.user._id },
    { new: true }
  ).select('-password');
  
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    ).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  logger.info(`User deactivated: ${user.email} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'User deactivated successfully');
});

/**
 * Reset user password
 * PUT /api/admin/users/:id/reset-password
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return sendError(res, 'Password must be at least 6 characters long', 400);
  }
  
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Try to find and update in SystemUser first
  let user = await SystemUser.findByIdAndUpdate(
    id,
    { 
      password: hashedPassword, 
      updatedBy: req.user._id,
      passwordResetRequired: true // Force user to change password on next login
    },
    { new: true }
  ).select('-password');
  
  let userType = 'system';
  
  // If not found, try Tourist
  if (!user) {
    user = await Tourist.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');
    userType = 'tourist';
  }
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }
  
  logger.info(`Password reset for user: ${user.email} by ${req.user.email}`);
  
  return sendSuccess(res, { 
    user: {
      ...user.toObject(),
      userType
    }
  }, 'Password reset successfully');
});

/**
 * Get user statistics
 * GET /api/admin/statistics
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const touristStats = await Tourist.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const systemUserStats = await SystemUser.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalTourists = await Tourist.countDocuments();
  const totalSystemUsers = await SystemUser.countDocuments();
  const activeTourists = await Tourist.countDocuments({ status: 'active' });
  const activeSystemUsers = await SystemUser.countDocuments({ status: 'active' });
  
  return sendSuccess(res, {
    tourists: {
      total: totalTourists,
      active: activeTourists,
      byStatus: touristStats
    },
    systemUsers: {
      total: totalSystemUsers,
      active: activeSystemUsers,
      byRole: systemUserStats
    },
    overall: {
      totalUsers: totalTourists + totalSystemUsers,
      activeUsers: activeTourists + activeSystemUsers
    }
  }, 'User statistics retrieved successfully');
});

module.exports = {
  getAllUsers,
  getUserById,
  createSystemUser,
  updateUser,
  updateUserRole,
  deleteUser,
  updateUserStatus,
  deactivateUser,
  resetUserPassword,
  getUserStatistics
};
