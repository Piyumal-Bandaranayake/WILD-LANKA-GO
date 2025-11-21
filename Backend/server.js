require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

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

// Connect to MongoDB before starting server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connected successfully');
    
    // Auto-reset availability for staff with ended tours
    try {
      const SystemUser = require('./src/models/SystemUser');
      const resetCount = await SystemUser.resetAvailabilityForEndedTours();
      if (resetCount > 0) {
        logger.info(`Auto-reset completed: ${resetCount} staff members availability reset from ended tours`);
      }
    } catch (resetError) {
      logger.warn('Auto-reset availability failed (non-critical):', resetError.message);
    }
  } catch (err) {
    logger.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
};

// Configure Cloudinary (optional)
configureCloudinary();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory');
}

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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Define allowed origins for different environments
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          // Development origins
          'http://localhost:3000',    // React default
          'http://localhost:5173',    // Vite default
          'http://localhost:5174',    // Vite fallback
          'http://localhost:4173',    // Vite preview
          'http://127.0.0.1:3000',   // IPv4 localhost
          'http://127.0.0.1:5173',   // IPv4 localhost
          'http://127.0.0.1:5174',   // IPv4 localhost fallback
          'http://127.0.0.1:4173',   // IPv4 localhost preview
          'http://[::1]:3000',       // IPv6 localhost
          'http://[::1]:5173',       // IPv6 localhost
          'http://[::1]:5174',       // IPv6 localhost fallback
          'http://[::1]:4173',       // IPv6 localhost preview
        ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, be more permissive for any localhost origin
      if (process.env.NODE_ENV === 'development') {
        // Allow any localhost origin in development
        if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('[::1]')) {
          console.log(`⚠️ CORS: Allowing development origin ${origin}`);
          callback(null, true);
        } else {
          console.log(`❌ CORS: Blocking origin ${origin} in development`);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        console.log(`❌ CORS: Blocking origin ${origin} in production`);
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

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Wild Lanka Go API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
let server;
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      
      // Close database connection
      require('mongoose').connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    // Close database connection if server is not available
    require('mongoose').connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  }
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle process termination
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // In development, log the error but don't exit immediately
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing in development mode...');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  // In development, log the error but don't exit immediately
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing in development mode...');
  }
});

// Start server after database connection
const PORT = process.env.PORT || 5001;
startServer().then(() => {
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`🚀 Wild Lanka Go API Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  });
});

module.exports = app;
