
import express from 'express';
import dotenv from 'dotenv';

import tourRejectionRoutes from './src/routes/tourmanagement/rejectionroute.js';
import tourMaterialRoutes from './src/routes/tourmanagement/tourMaterialRoute.js';
import fuelClaimRoutes from './src/routes/tourmanagement/fuelClaimRoute.js'; // ✅ NEW

import applicationRoutes from './src/routes/tourmanagement/applicationRoutes.js';
import eventRoutes from './src/routes/Activity Management/eventroute.js'; // Import event routes
import activityRoutes from './src/routes/Activity Management/Activityroute.js'; // Import activity routes
import eventRegistrationroutes from './src/routes/Activity Management/eventRegistrationroute.js'; // Import event registration routes
import Booking from './src/routes/Activity Management/Bookingroute.js'; // Import booking routes
import Donation from './src/routes/Activity Management/donationroute.js'; // Import donation routes  
import cors from 'cors';

import connectDB from './src/config/DB.js';

// User role routes
import touristRoutes from './src/routes/user/touristroute.js';
import driverRoutes from './src/routes/user/safariDriverroute.js';
import tourGuideRoutes from './src/routes/user/tourGuideroute.js';
import wildlifeOfficerRoutes from './src/routes/user/wildlifeOfficerroute.js';
import vetRoutes from './src/routes/user/vetroute.js';
import emergencyOfficeroutes from './src/routes/user/emergencyOfficerroute.js';
import callOperatorRoutes from './src/routes/user/calloperatorroute.js';
import adminRoutes from './src/routes/user/adminroute.js';

// Other routes
import feedbackRoutes from './src/routes/Feedback/FeedbackRoute.js';
import complaintRoutes from './src/routes/Complaint/ComplaintRoute.js';
import chatbotRoutes from './src/routes/Chatbot/chatbotRoutes.js';

// Auth controllers
import { systemLogin } from './src/controllers/auth/systemLoginController.js';


// System protected routes
import systemRoutes from './src/routes/auth/systemLogin.js';

// Load environment variables
dotenv.config();
connectDB();

// Initialize app
const app = express();

 // Middleware to parse JSON requests

// Define the route for tourists
// All admin-related routes will be prefixed with /api/admin

app.use('/api/tour', tourRoutes);
app.use('/api/tour-rejection', tourRejectionRoutes);
app.use('/api/tour-materials', tourMaterialRoutes);  
app.use('/api/fuel-claims', fuelClaimRoutes);  // ✅ NEW
app.use('/api/applications', applicationRoutes);





 // Middleware to parse JSON requests


app.use('/api/events', eventRoutes); // All event-related routes will be prefixed with /api/events
app.use('/api/activities', activityRoutes); // All activity-related routes will be prefixed with /api/activities
app.use('/api/eventRegistrations', eventRegistrationroutes); // All event registration-related routes will be prefixed with /api/eventRegistrations
app.use('/api/donations', Donation); // All donation-related routes will be prefixed with /api/donations

// To serve static files (images, etc.)

app.use('/uploads', express.static('uploads'));
app.use('/api/bookings', Booking); // All booking-related routes will be prefixed with /api/bookings




// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ---------- Public Routes ---------- //
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





// ---------- Auth Routes ---------- //
app.post('/api/login', systemLogin); // Login for system roles (username + password + role)

// ---------- Protected System Routes ---------- //
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
app.listen(port, () => console.log(`\uD83D\uDE80 Server running on port ${port}`));
