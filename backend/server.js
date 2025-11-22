require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');

// Import configurations
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { configureCloudinary } = require('./config/cloudinary');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userStatsRoutes = require('./src/routes/userStatsRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const activityBookingRoutes = require('./src/routes/activityBookingRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const donationRoutes = require('./src/routes/donationRoutes');
const bookingPaymentRoutes = require('./src/routes/bookingPaymentRoutes');
const complaintRoutes = require('./src/routes/ComplaintRoute');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const touristRoutes = require('./src/routes/touristRoutes');
const animalCaseRoutes = require('./src/routes/animalCaseRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const vetSupportRoutes = require('./src/routes/vetSupportRoutes');

// Tour management routes
const fuelClaimRoutes = require('./src/routes/tourmanagement/fuelClaimRoute');
const tourRoutes = require('./src/routes/tourmanagement/tourroutes');
const tourMaterialRoutes = require('./src/routes/tourmanagement/tourMaterialRoute');

// Emergency routes
const emergencyRoutes = require('./src/routes/emergency/emergencyRoute');
const emergencyFormRoutes = require('./src/routes/emergency/emergencyFormRoutes');

// Chatbot routes
const chatbotRoutes = require('./src/routes/Chatbot/chatbotRoutes');

const app = express();

// Configure Cloudinary
configureCloudinary();

// Initialize database connection (will be cached for serverless)
connectDB().catch(err => {
  logger.error('Database connection failed:', err.message);
});

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // More permissive in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
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

// Apply rate limiting only in production or for non-localhost requests
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
  logger.info('Rate limiting enabled for production environment');
} else {
  logger.info('Rate limiting disabled in development mode for better development experience');
}

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable
    const allowedOrigins = [];
    
    // Add FRONTEND_URL from environment (production frontend)
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Add ALLOWED_ORIGINS if specified
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    // Development fallbacks
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173'
      );
    }
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests to 60 seconds (increased for image uploads)
  req.setTimeout(60000, () => {
    res.status(408).json({
      success: false,
      message: 'Request timeout - please try again',
      error: 'Request took too long to process'
    });
  });
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Wild Lanka Go API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userStatsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-bookings', activityBookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/bookings', bookingPaymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/animal-cases', animalCaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vet-support', vetSupportRoutes);

// Tour management routes
app.use('/api/fuel-claims', fuelClaimRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/tour-materials', tourMaterialRoutes);

// Emergency routes
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/emergency-forms', emergencyFormRoutes);

// Chatbot routes
app.use('/api/chatbot', chatbotRoutes);

// Root route - confirms backend is running
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Wild Lanka Go API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Export the Express app for Vercel serverless
module.exports = app;

// Only start server if running locally (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🚀 Wild Lanka Go API Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  });
}
