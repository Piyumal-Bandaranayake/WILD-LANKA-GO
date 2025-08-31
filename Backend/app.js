import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/DB.js';
import touristRoutes from './src/routes/user/touristroute.js';
import driverRoutes from './src/routes/user/safariDriverroute.js';
import tourGuideRoutes from './src/routes/user/tourGuideroute.js';
import wildlifeOfficerRoutes from './src/routes/user/Wildlifeofficerroute.js';
import vetRoutes from './src/routes/user/vetroute.js';
import emergencyOfficeroutes from './src/routes/user/emergencyOfficerroute.js';
import callOperatorRoutes from './src/routes/user/calloperatorroute.js';
import adminRoutes from './src/routes/user/adminroute.js';
import feedbackRoutes from './src/routes/Feedback/FeedbackRoute.js';
import complaintRoutes from './src/routes/Complaint/ComplaintRoute.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// ✅ Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/tourists', touristRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/tourGuides', tourGuideRoutes);
app.use('/api/wildlifeOfficers', wildlifeOfficerRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/emergencyOfficers', emergencyOfficeroutes);
app.use('/api/callOperators', callOperatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);

app.get("/", (req, res) => res.send("Backend is running..."));

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server running on port ${port}`));
