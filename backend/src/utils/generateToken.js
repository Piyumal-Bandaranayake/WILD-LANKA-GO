const jwt = require('jsonwebtoken');
const logger = require('../../config/logger');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (usually user data)
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (usually user ID)
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    // Use JWT_REFRESH_SECRET if available, otherwise use JWT_SECRET with suffix
    let refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!refreshSecret) {
      const baseSecret = process.env.JWT_SECRET;
      if (!baseSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      refreshSecret = baseSecret + '_refresh';
    }
      
    return jwt.sign(payload, refreshSecret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {String} secret - Secret key (optional, defaults to JWT_SECRET)
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    throw new Error('Invalid token');
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @param {String} userType - Type of user ('tourist' or 'systemUser')
 * @returns {Object} Object containing both tokens
 */
const generateTokenPair = (user, userType = null) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role || 'tourist',
    userType: userType || (user.role === 'tourist' || !user.role ? 'tourist' : 'systemUser'),
  };

  const refreshPayload = {
    id: user._id,
    userType: userType || (user.role === 'tourist' || !user.role ? 'tourist' : 'systemUser'),
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(refreshPayload),
    token: generateAccessToken(payload), // For backward compatibility
  };
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/**
 * Generate unique case ID for animal cases
 * @returns {String} Unique case ID
 */
const generateCaseId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AC-${year}${month}${day}-${random}`;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokenPair,
  extractTokenFromHeader,
  generateCaseId,
};
