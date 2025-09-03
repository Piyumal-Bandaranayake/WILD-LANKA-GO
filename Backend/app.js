import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer'; // Multer for handling file uploads
import path from 'path';

// Import routes
import tourRejectionRoutes from './src/routes/tourmanagement/rejectionroute.js';
import tourMaterialRoutes from './src/routes/tourmanagement/tourMaterialRoute.js';
import fuelClaimRoutes from './src/routes/tourmanagement/fuelClaimRoute.js';

import applicationRoutes from './src/routes/tourmanagement/applicationRoutes.js';
import eventRoutes from './src/routes/Activity Management/eventroute.js'; // Import event routes
import activityRoutes from './src/routes/Activity Management/Activityroute.js'; // Import activity routes
import eventRegistrationroutes from './src/routes/Activity Management/eventRegistrationroute.js'; // Import event registration routes
import Booking from './src/routes/Activity Management/Bookingroute.js'; // Import booking routes
import Donation from './src/routes/Activity Management/donationroute.js'; // Import donation routes  

import touristRoutes from './src/routes/user/touristroute.js';
import driverRoutes from './src/routes/user/safariDriverroute.js';
import tourGuideRoutes from './src/routes/user/tourGuideroute.js';
import wildlifeOfficerRoutes from './src/routes/user/wildlifeOfficerroute.js';
import vetRoutes from './src/routes/user/vetroute.js';
import emergencyOfficeroutes from './src/routes/user/emergencyOfficerroute.js';
import callOperatorRoutes from './src/routes/user/calloperatorroute.js';
import adminRoutes from './src/routes/user/adminroute.js';

import feedbackRoutes from './src/routes/Feedback/FeedbackRoute.js';
import complaintRoutes from './src/routes/Complaint/ComplaintRoute.js';
import chatbotRoutes from './src/routes/Chatbot/chatbotRoutes.js';

import { systemLogin } from './src/controllers/auth/systemLoginController.js';
import connectDB from './src/config/DB.js';
import medicationRoutes from './src/routes/Animal Care Management/medicationRoutes.js';

// Load environment variables
dotenv.config();
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' folder (where images will be stored)
app.use('/uploads', express.static('uploads'));  // Important for serving uploaded images

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
app.use('/api/animal-cases', animalCaseRoutes);  // Use multer upload middleware for image handling

/* Other Routes */
app.use('/api/tourists', touristRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/tourGuides', tourGuideRoutes);
app.use('/api/wildlifeOfficers', wildlifeOfficerRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/emergencyOfficers', emergencyOfficeroutes);
app.use('/api/callOperators', callOperatorRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chatbot', chatbotRoutes);

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
app.use('/api/inventory', medicationRoutes); 

/* Auth Routes */
app.post('/api/login', systemLogin); 

/* Protected System Routes */
import systemRoutes from './src/routes/auth/systemLogin.js';
app.use('/api/system', systemRoutes);

// Root Route
app.get("/", (req, res) => res.send("Backend is running..."));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
