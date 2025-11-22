require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Import configurations
const connectDB = require('./config/db');
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
const fuelClaimRoutes = require('./src/routes/tourmanagement/fuelClaimRoute');
const tourRoutes = require('./src/routes/tourmanagement/tourroutes');
const tourMaterialRoutes = require('./src/routes/tourmanagement/tourMaterialRoute');
const emergencyRoutes = require('./src/routes/emergency/emergencyRoute');
const emergencyFormRoutes = require('./src/routes/emergency/emergencyFormRoutes');
const chatbotRoutes = require('./src/routes/Chatbot/chatbotRoutes');

const app = express();

// Connect to database
connectDB();

// Configure Cloudinary
configureCloudinary();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS configuration for Vercel
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Wild Lanka Go API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', userStatsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-bookings', activityBookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/payments', bookingPaymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/animal-cases', animalCaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vet-support', vetSupportRoutes);
app.use('/api/fuel-claims', fuelClaimRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/tour-materials', tourMaterialRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/emergency-forms', emergencyFormRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
