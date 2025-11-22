const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  logout, 
  validateToken,
  refreshToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 10, // More permissive in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost')) {
      return true;
    }
    return false;
  }
});

// Public routes
router.post('/register', 
  validate(schemas.userRegistration), 
  register
);

router.post('/login', 
  authLimiter,
  validate(schemas.userLogin), 
  login
);

router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', 
  validate(schemas.userUpdate), 
  updateProfile
);

router.put('/change-password', 
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  })), 
  changePassword
);

router.post('/logout', logout);
router.get('/validate-token', validateToken);

module.exports = router;
