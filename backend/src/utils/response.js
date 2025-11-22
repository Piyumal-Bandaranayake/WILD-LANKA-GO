/**
 * Standard API response utility functions
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Additional error details (only in development)
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Only include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {String} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send bad request response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendBadRequest = (res, message = 'Bad request') => {
  return res.status(400).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {String} message - Success message
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendBadRequest,
  sendPaginatedResponse,
};
