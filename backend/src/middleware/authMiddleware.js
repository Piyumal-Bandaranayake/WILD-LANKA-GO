const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tourist = require('../models/Tourist');
const SystemUser = require('../models/SystemUser');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
const { verifyToken, extractTokenFromHeader } = require('../utils/generateToken');
const logger = require('../../config/logger');

/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return sendUnauthorized(res, 'Access token is required');
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Try to find user in the unified User model first
    let user = await User.findById(decoded.id || decoded.userId).select('+password');
    let userType = decoded.userType || 'tourist';
    
    // If not found in unified model, try the old separate models for backward compatibility
    if (!user) {
      // Determine userType from role if not provided in token
      if (!decoded.userType && decoded.role) {
        userType = decoded.role === 'tourist' ? 'tourist' : 'systemUser';
      }
      
      if (userType === 'tourist') {
        user = await Tourist.findById(decoded.id || decoded.userId).select('+password');
        if (user) {
          userType = 'tourist';
        }
      } else {
        user = await SystemUser.findById(decoded.id || decoded.userId).select('+password');
        if (user) {
          userType = 'systemUser';
        }
      }
    } else {
      // If found in unified model, determine userType from role
      userType = user.role === 'tourist' ? 'tourist' : 'systemUser';
    }
    
    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      return sendUnauthorized(res, 'Account is not active');
    }

    // Add user and userType to request object
    req.user = user;
    req.userType = userType; // Use the determined userType
    req.token = token;
    
    // Debug logging
    logger.info(`🔍 User authenticated: ${user.email}`);
    logger.info(`🔍 User role: ${user.role}`);
    logger.info(`🔍 User type: ${userType}`);
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid token');
    }
    
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired');
    }
    
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Middleware to authorize specific roles
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Debug logging
    logger.info(`🔍 Authorization check for user: ${req.user.email}`);
    logger.info(`🔍 User object:`, {
      id: req.user._id,
      role: req.user.role,
      userType: req.userType,
      allowedRoles: allowedRoles
    });

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${allowedRoles.join(', ')}`);
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or has admin privileges
 * @param {String} resourceUserField - Field name that contains the user ID in the resource
 */
const authorizeOwnerOrAdmin = (resourceUserField = 'user') => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // For other users, check ownership
    const resourceUserId = req.params.userId || req.body[resourceUserField] || req.query[resourceUserField];
    
    if (!resourceUserId) {
      return sendForbidden(res, 'Resource ownership cannot be determined');
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return sendForbidden(res, 'Access denied - you can only access your own resources');
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      let user = await User.findById(decoded.id || decoded.userId);
      let userType = decoded.userType || 'tourist';
      
      // If not found in unified model, try separate models
      if (!user) {
        if (userType === 'tourist') {
          user = await Tourist.findById(decoded.id || decoded.userId);
        } else {
          user = await SystemUser.findById(decoded.id || decoded.userId);
        }
      } else {
        userType = user.role === 'tourist' ? 'tourist' : 'systemUser';
      }
      
      if (user && user.status === 'active') {
        req.user = user;
        req.userType = userType;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Middleware to check if user has specific permissions
 * @param {Array} permissions - Array of required permissions
 */
const checkPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Define role-based permissions
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      wildlifeOfficer: [
        'manage_bookings',
        'manage_reports',
        'manage_animals',
        'manage_vehicles',
        'view_analytics',
      ],
      vet: [
        'manage_animals',
        'view_reports',
        'manage_treatments',
      ],
      tourGuide: [
        'view_bookings',
        'update_profile',
        'manage_materials',
      ],
      safariDriver: [
        'view_bookings',
        'update_profile',
        'manage_vehicle_logs',
      ],
      tourist: [
        'create_bookings',
        'view_own_bookings',
        'update_profile',
        'submit_reports',
      ],
      callOperator: [
        'manage_emergency_calls',
        'view_reports',
        'create_reports',
      ],
      emergencyOfficer: [
        'manage_emergencies',
        'view_reports',
        'coordinate_response',
      ],
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    // Check if user has admin privileges (all permissions)
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn(`Permission denied for user ${req.user.email}. Required: ${permissions.join(', ')}, Has: ${userPermissions.join(', ')}`);
      return sendForbidden(res, 'Insufficient permissions for this action');
    }

    next();
  };
};

/**
 * Middleware to validate user status
 * @param {Array} allowedStatuses - Array of allowed user statuses
 */
const validateUserStatus = (allowedStatuses = ['active']) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!allowedStatuses.includes(req.user.status)) {
      return sendForbidden(res, `Account status '${req.user.status}' is not allowed for this action`);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  checkPermissions,
  validateUserStatus,
};
