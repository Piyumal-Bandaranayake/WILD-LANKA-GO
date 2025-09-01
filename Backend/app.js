import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import connectDB from './src/config/DB.js';  // Import DB connection
import touristRoutes from './src/routes/user/touristroute.js';  // Correct path to tourist routes
import driverRoutes from './src/routes/user/safariDriverroute.js';  // Correct path to driver routes
import tourGuideRoutes from './src/routes/user/tourGuideroute.js';  // Correct path to tour guide routes
import wildlifeOfficerRoutes from './src/routes/user/Wildlifeofficerroute.js'; // Correct path to wildlife officer routes   
import vetRoutes from './src/routes/user/vetroute.js'; // Correct path to vet routes
import emergencyOfficeroutes from './src/routes/user/emergencyOfficerroute.js'; // Correct path to emergency officer routes 
import callOperatorRoutes from './src/routes/user/calloperatorroute.js'; // Correct path to call operator routes
import adminRoutes from './src/routes/user/adminroute.js'; // Correct path to admin routes
import tourRoutes from './src/routes/tourmanagement/tourroutes.js';
import tourRejectionRoutes from './src/routes/tourmanagement/rejectionroute.js';
import tourMaterialRoutes from './src/routes/tourmanagement/tourMaterialRoute.js';
import fuelClaimRoutes from './src/routes/tourmanagement/fuelClaimRoute.js'; // ✅ NEW

import applicationRoutes from './src/routes/tourmanagement/applicationRoutes.js';

dotenv.config();  // Load environment variables
connectDB();  // Connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());  // Middleware to parse JSON requests

// Define the route for tourists
app.use('/api/tourists', touristRoutes);  // All tourist-related routes will be prefixed with /api/tourists
app.use('/api/drivers', driverRoutes);  // All driver-related routes will be prefixed with /api/drivers
app.use('/api/tourGuides', tourGuideRoutes);  // All tour guide-related routes will be prefixed with /api/tourGuides
app.use('/api/wildlifeOfficers', wildlifeOfficerRoutes); // All wildlife officer-related routes will be prefixed with /api/wildlifeOfficers
app.use('/api/vets', vetRoutes); // All vet-related routes will be prefixed with /api/vets
app.use('/api/emergencyOfficers', emergencyOfficeroutes); // All emergency officer-related routes will be prefixed with /api/emergencyOfficers
app.use('/api/callOperators', callOperatorRoutes); // All call operator-related routes will be prefixed with /api/callOperators
app.use('/api/admin', adminRoutes); // All admin-related routes will be prefixed with /api/admin

app.use('/api/tour', tourRoutes);
app.use('/api/tour-rejection', tourRejectionRoutes);
app.use('/api/tour-materials', tourMaterialRoutes);  
app.use('/api/fuel-claims', fuelClaimRoutes);  // ✅ NEW
app.use('/api/applications', applicationRoutes);



app.get("/", (req, res) => {
    res.send("Backend is running...");
});

// Use port from .env or default to 5000
const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
