const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Tourist = require('../models/Tourist');
const SystemUser = require('../models/SystemUser');
const { generateTokenPair } = require('../utils/generateToken');
const { sendSuccess, sendError, sendUnauthorized } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

/**
 * Check if database is connected
 */
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, role, ...additionalData } = req.body;

  // Check database connection
  if (!isDatabaseConnected()) {
    return sendError(res, 'Database connection not available. Please try again later.', 503);
  }

  // Determine if this is a tourist or system user
  const isTourist = role === 'tourist' || !role; // Default to tourist if no role specified
  
  // Check if user already exists in both collections
  const existingTourist = await Tourist.findOne({ email: email.toLowerCase() });
  const existingSystemUser = await SystemUser.findOne({ email: email.toLowerCase() });
  
  if (existingTourist || existingSystemUser) {
    return sendError(res, 'User with this email already exists', 400);
  }

  let user;
  let userType;
  
  if (isTourist) {
    // Create new tourist
    user = new Tourist({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'tourist',
      status: 'active',
      isEmailVerified: true,
      ...additionalData, // Include tourist-specific fields
    });
    userType = 'tourist';
  } else {
    // Create new system user
    user = new SystemUser({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      status: 'active',
      isEmailVerified: true,
      ...additionalData, // Include system user-specific fields
    });
    userType = 'systemUser';
  }

  await user.save();

  // Generate tokens
  const tokens = generateTokenPair(user, userType);

  // Update login info
  await user.updateLoginInfo();

  // Remove password from response
  const userResponse = user.toJSON();

  logger.info(`New ${userType} registered: ${email} with role: ${role || 'tourist'}`);

  return sendSuccess(res, {
    user: userResponse,
    userType,
    ...tokens,
  }, 'User registered successfully', 201);
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check database connection
  if (!isDatabaseConnected()) {
    return sendError(res, 'Database connection not available. Please try again later.', 503);
  }

  // Search for user in both collections
  let user = null;
  let userType = null;
  
  // First check tourists collection
  const tourist = await Tourist.findOne({ email: email.toLowerCase() }).select('+password');
  if (tourist) {
    user = tourist;
    userType = 'tourist';
  } else {
    // Then check system users collection
    const systemUser = await SystemUser.findOne({ email: email.toLowerCase() }).select('+password');
    if (systemUser) {
      user = systemUser;
      userType = 'systemUser';
    }
  }
  
  if (!user) {
    return sendUnauthorized(res, 'Invalid email or password');
  }

  // Check if user is active
  if (user.status !== 'active') {
    return sendUnauthorized(res, 'Account is not active. Please contact support.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendUnauthorized(res, 'Invalid email or password');
  }

  // Generate tokens (include userType in payload)
  const tokens = generateTokenPair(user, userType);

  // Update login info
  await user.updateLoginInfo();

  // Set user as available on login (only for system users)
  if (userType === 'systemUser' && user.isAvailable !== undefined) {
    user.isAvailable = true;
    await user.save();
    
    // Log specific availability reset for drivers and guides
    if (user.role === 'safariDriver' || user.role === 'tourGuide') {
      logger.info(`${user.role} ${email} logged in and marked as available`);
    } else {
      logger.info(`System user ${email} marked as available`);
    }
  }

  // Remove password from response
  const userResponse = user.toJSON();

  logger.info(`${userType === 'tourist' ? 'Tourist' : 'System user'} logged in: ${email} (${user.role || 'tourist'})`);

  return sendSuccess(res, {
    user: userResponse,
    userType,
    ...tokens,
  }, 'Login successful');
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  // User is already loaded in middleware, just return it
  const user = req.user;
  const userType = req.userType;
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, { 
    user: user.toJSON(), 
    userType 
  }, 'Profile retrieved successfully');
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Check database connection
  if (!isDatabaseConnected()) {
    return sendError(res, 'Database connection not available. Please try again later.', 503);
  }

  const allowedUpdates = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'address',
    'languages', 'specializations', 'qualifications'
  ];
  
  const updates = {};
  
  // Only include allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...updates, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  logger.info(`Profile updated for user: ${user.email}`);

  return sendSuccess(res, { user }, 'Profile updated successfully');
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendUnauthorized(res, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  user.updatedBy = req.user._id;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  return sendSuccess(res, null, 'Password changed successfully');
});

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const user = req.user;
  const userType = req.userType;
  
  // Set user as unavailable (only for system users)
  if (userType === 'systemUser' && user.setUnavailable) {
    await user.setUnavailable();
    logger.info(`System user ${user.email} marked as unavailable`);
  }
  
  logger.info(`User logged out: ${user.email}`);
  
  return sendSuccess(res, null, 'Logout successful');
});

/**
 * Validate token
 * GET /api/auth/validate
 */
const validateToken = asyncHandler(async (req, res) => {
  // If we reach here, the token is valid (middleware already validated it)
  return sendSuccess(res, { 
    user: req.user,
    tokenValid: true 
  }, 'Token is valid');
});

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: clientRefreshToken } = req.body;
  
  if (!clientRefreshToken) {
    return sendUnauthorized(res, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    let refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!refreshSecret) {
      const baseSecret = process.env.JWT_SECRET;
      if (!baseSecret) {
        return sendUnauthorized(res, 'JWT configuration error');
      }
      refreshSecret = baseSecret + '_refresh';
    }
      
    const decoded = jwt.verify(clientRefreshToken, refreshSecret);
    
    // Find user based on userType
    let user = null;
    let userType = decoded.userType || 'tourist';
    
    if (userType === 'tourist') {
      user = await Tourist.findById(decoded.id);
    } else {
      user = await SystemUser.findById(decoded.id);
    }
    
    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }
    
    if (user.status !== 'active') {
      return sendUnauthorized(res, 'User account is not active');
    }
    
    // Generate new token pair
    const tokens = generateTokenPair(user, userType);
    
    logger.info(`Token refreshed for user: ${user.email}`);
    
    return sendSuccess(res, {
      user: user.toJSON(),
      userType,
      ...tokens,
    }, 'Token refreshed successfully');
    
  } catch (error) {
    logger.error('Token refresh failed:', error);
    return sendUnauthorized(res, 'Invalid refresh token');
  }
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  validateToken,
  refreshToken,
};
