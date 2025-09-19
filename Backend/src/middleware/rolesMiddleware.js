const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has a role
    if (!req.user.role) {
      return res.status(403).json({
        message: 'User role not defined',
        code: 'ROLE_UNDEFINED'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        userId: req.user.id || req.user._id
      });
    }

    next();
  };
};

// Middleware to check if user owns resource or is admin
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField] || req.query[resourceUserIdField];
    const currentUserId = req.user.id || req.user._id;

    if (resourceUserId && resourceUserId.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        message: 'Access denied: You can only access your own resources',
        code: 'OWNER_ACCESS_REQUIRED'
      });
    }

    next();
  };
};

// Middleware to check multiple role requirements
const authorizeAnyRole = (...allowedRoles) => {
  return authorizeRoles(...allowedRoles);
};

const authorizeAllRoles = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has all required roles (in case of multi-role users in future)
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

    if (!hasAllRoles) {
      return res.status(403).json({
        message: 'Insufficient permissions: All required roles needed',
        code: 'ALL_ROLES_REQUIRED',
        userRoles,
        requiredRoles
      });
    }

    next();
  };
};

// Middleware for conditional authorization based on resource status
const authorizeConditional = (conditionFn) => {
  return async (req, res, next) => {
    try {
      const isAuthorized = await conditionFn(req);
      if (!isAuthorized) {
        return res.status(403).json({
          message: 'Conditional authorization failed',
          code: 'CONDITIONAL_AUTH_FAILED'
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        message: 'Authorization check failed',
        code: 'AUTH_CHECK_ERROR',
        error: error.message
      });
    }
  };
};

// Export all middleware functions
export default authorizeRoles;
export {
  authorizeRoles,
  authorizeOwnerOrAdmin,
  authorizeAnyRole,
  authorizeAllRoles,
  authorizeConditional
};
