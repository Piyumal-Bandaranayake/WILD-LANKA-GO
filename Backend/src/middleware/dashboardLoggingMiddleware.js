import logger from '../utils/logger.js';

/**
 * Middleware for logging dashboard access by role
 * Tracks dashboard usage patterns and access attempts
 */
export const dashboardAccessLogger = (dashboardType) => {
  return (req, res, next) => {
    // Get user information from request
    const user = req.user || req.auth?.payload;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log dashboard access attempt
    logger.dashboardAccess(`Dashboard access attempt: ${dashboardType}`, {
      dashboardType,
      userId: user?.sub || user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      clientIP,
      userAgent,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query
    });

    // Override res.json to log successful responses
    const originalJson = res.json;
    res.json = function(data) {
      logger.dashboardAccess(`Dashboard data served: ${dashboardType}`, {
        dashboardType,
        userId: user?.sub || user?._id,
        userRole: user?.role,
        statusCode: res.statusCode,
        dataSize: JSON.stringify(data).length,
        responseTime: Date.now() - req.startTime
      });
      return originalJson.call(this, data);
    };

    // Override res.status to log error responses
    const originalStatus = res.status;
    res.status = function(code) {
      if (code >= 400) {
        logger.dashboardError(`Dashboard access error: ${dashboardType}`, {
          dashboardType,
          userId: user?.sub || user?._id,
          userRole: user?.role,
          statusCode: code,
          clientIP,
          userAgent,
          method: req.method,
          path: req.path
        });
      }
      return originalStatus.call(this, code);
    };

    // Add start time for response time calculation
    req.startTime = Date.now();
    
    next();
  };
};

/**
 * Middleware for logging API errors with context
 */
export const apiErrorLogger = (req, res, next) => {
  // Override res.status to capture error responses
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400) {
      const user = req.user || req.auth?.payload;
      logger.apiError(`API error response: ${code}`, {
        statusCode: code,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        userId: user?.sub || user?._id,
        userRole: user?.role,
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    return originalStatus.call(this, code);
  };

  next();
};

/**
 * Error handling middleware with comprehensive logging
 */
export const errorHandlingMiddleware = (err, req, res, next) => {
  const user = req.user || req.auth?.payload;
  
  // Log the error with full context
  logger.systemError('Unhandled error in request', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
      }
    },
    user: {
      id: user?.sub || user?._id,
      email: user?.email,
      role: user?.role
    },
    client: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  });

  // Determine appropriate status code
  let statusCode = 500;
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;
  if (err.statusCode) statusCode = err.statusCode;

  // Send error response
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err.details
    } : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.id || Date.now().toString()
  });
};

export default {
  dashboardAccessLogger,
  apiErrorLogger,
  errorHandlingMiddleware
};