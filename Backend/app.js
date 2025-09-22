import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer'; // Multer for handling file uploads
import path from 'path';
import { fileURLToPath } from 'url';

import tourRejectionRoutes from './src/routes/tourmanagement/rejectionroute.js';
import tourMaterialRoutes from './src/routes/tourmanagement/tourMaterialRoute.js';
import fuelClaimRoutes from './src/routes/tourmanagement/fuelClaimRoute.js'; // ✅ NEW
import tourRoutes from './src/routes/tourmanagement/tourroutes.js';


import applicationRoutes from './src/routes/tourmanagement/applicationRoutes.js';
import eventRoutes from './src/routes/Activity Management/eventroute.js'; // Import event routes
import activityRoutes from './src/routes/Activity Management/Activityroute.js'; // Import activity routes
import eventRegistrationroutes from './src/routes/Activity Management/eventRegistrationroute.js'; // Import event registration routes
import Booking from './src/routes/Activity Management/Bookingroute.js'; // Import booking routes
import Donation from './src/routes/Activity Management/donationroute.js'; // Import donation routes  

import userRoutes from './src/routes/user/userroute.js';
import driverRoutes from './src/routes/user/safariDriverroute.js';
import tourGuideRoutes from './src/routes/user/tourGuideroute.js';
import wildlifeOfficerRoutes from './src/routes/user/Wildlifeofficerroute.js';
import vetRoutes from './src/routes/user/vetroute.js';
import emergencyOfficeroutes from './src/routes/user/emergencyOfficerroute.js';
import callOperatorRoutes from './src/routes/user/calloperatorroute.js';
import adminRoutes from './src/routes/user/adminroute.js';

import feedbackRoutes from './src/routes/Feedback/FeedbackRoute.js';
import complaintRoutes from './src/routes/Complaint/ComplaintRoute.js';
import chatbotRoutes from './src/routes/Chatbot/chatbotRoutes.js';

import emergencyRoutes from './src/routes/emergency/emergencyRoute.js';  // Emergency routes
import emergencyFormRoutes from './src/routes/emergency/emergencyFormRoute.js';  // Emergency form routes
import emergencyReportRoutes from './src/routes/emergency/emergencyReportRoute.js';  // Emergency report routes

import connectDB from './src/config/DB.js';
import medicationRoutes from './src/routes/Animal Care Management/medicationRoutes.js';
import authRoutes from './src/routes/auth/auth.js';
import touristRoutes from './src/routes/tourist.js';
import { scheduleCleanup } from './src/utils/cacheCleanup.js';

// Import logging utilities
import logger from './src/utils/logger.js';
import { apiErrorLogger, errorHandlingMiddleware } from './src/middleware/dashboardLoggingMiddleware.js';
import loggingRoutes from './src/routes/logging/loggingRoutes.js';

// Load environment variables
dotenv.config();
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add comprehensive logging middleware
app.use(apiErrorLogger);

// Log server startup
logger.systemInfo('Server starting up', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 5001,
  timestamp: new Date().toISOString()
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ---------- Public Routes ---------- //
app.use('/api/tour', tourRoutes);

// Serve static files from the 'uploads' folder (where images will be stored)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Important for serving uploaded images

/* Multer Configuration for File Uploads */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename using timestamp
  }
});
const upload = multer({ storage });  // Initialize multer with the storage configuration

/* Routes for Animal Care Management */
import animalCaseRoutes from './src/routes/Animal Care Management/animalCaseRoutes.js'; // Import animal case routes
import collaborationRoutes from './src/routes/Animal Care Management/collaborationRoutes.js'; // Import collaboration routes
import gpsTrackingRoutes from './src/routes/Animal Care Management/gpsTrackingRoutes.js'; // Import GPS tracking routes
app.use('/api/animal-cases', animalCaseRoutes);  // Use multer upload middleware for image handling
app.use('/api/medications', medicationRoutes);  // Add medication routes
app.use('/api/collaboration', collaborationRoutes);  // Add collaboration routes
app.use('/api/gps-tracking', gpsTrackingRoutes);  // Add GPS tracking routes

/* Other Routes */
import tokenTestRoutes from './src/routes/test/tokenTest.js';
import profileImageRoutes from './src/routes/user/profileImageRoute.js';

app.use('/api/test', tokenTestRoutes);
app.use('/api/profile-image', profileImageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/tourGuides', tourGuideRoutes);
app.use('/api/wildlifeOfficers', wildlifeOfficerRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/emergencyOfficers', emergencyOfficeroutes);
app.use('/api/callOperators', callOperatorRoutes);
app.use('/api/admins', adminRoutes);  // Plural for consistency with existing code
app.use('/api/admin', adminRoutes);   // Singular to match frontend expectations
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/auth', authRoutes);

// Tourist routes (authentication removed)
app.use('/api/tourist', touristRoutes);

// Management Routes
app.use('/api/tour-rejection', tourRejectionRoutes);
app.use('/api/tour-materials', tourMaterialRoutes);  
app.use('/api/fuel-claims', fuelClaimRoutes);  
app.use('/api/applications', applicationRoutes);
app.use('/api/events', eventRoutes); 
app.use('/api/activities', activityRoutes); 
app.use('/api/eventRegistrations', eventRegistrationroutes); 
app.use('/api/donations', Donation); 
app.use('/api/bookings', Booking);
app.use('/api/activity-bookings', Booking); 
app.use('/api/inventory', medicationRoutes); 

app.use('/api/emergencies', emergencyRoutes);  // Emergency routes
app.use('/api/emergency-forms', emergencyFormRoutes);  // Emergency form routes
app.use('/api/emergency-reports', emergencyReportRoutes);  // Emergency report routes

// Logging routes
app.use('/api/logs', loggingRoutes);

// Root Route
app.get("/", (req, res) => {
  logger.systemInfo('Root endpoint accessed', {
    clientIP: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.send("Backend is running...");
});

// Global Error Handler with comprehensive logging
app.use(errorHandlingMiddleware);

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  logger.systemInfo('Server started successfully', {
    port,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
  console.log(`🚀 Server running on port ${port}`);
  
  // Schedule cache cleanup
  scheduleCleanup();
});