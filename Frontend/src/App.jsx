import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/home';
import AboutUs from './pages/AboutUs';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ContactUs from './pages/contactus';

// Role-specific dashboards
import RoleDashboardRouter from './components/RoleDashboardRouter';
import WildlifeOfficerDashboard from './pages/wildlife-officer/WildlifeOfficerDashboard';
import TouristDashboard from './pages/tourist/TouristDashboard';
import TourGuideDashboard from './pages/tour-guide/TourGuideDashboard';
import SafariDriverDashboard from './pages/safari-driver/SafariDriverDashboard';
import VetDashboard from './pages/vet/VetDashboard';
import CallOperatorDashboard from './pages/call-operator/CallOperatorDashboard';
import EmergencyOfficerDashboard from './pages/emergency-officer/EmergencyOfficerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Legacy pages (kept for backward compatibility)
import AssignNowPage from './pages/tourmanagement/AssignNowPage';
import GuideDashboard from './pages/tourmanagement/guidedashboard';
import NewBookings from './pages/tourmanagement/newBookings';
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';
import ApplyJobForm from './pages/tourmanagement/ApplyJobForm';
import NewApplications from './pages/tourmanagement/NewApplications';
import AdminCreateUserPage from './pages/tourmanagement/AdminCreateUserPage';
import AllToursPage from './pages/tourmanagement/AllToursPage';

// New pages for all subsystems
import ActivityList from './pages/activities/ActivityList';
import EventList from './pages/events/EventList';
import AnimalCaseList from './pages/animal-care/AnimalCaseList';
import FeedbackList from './pages/feedback/FeedbackList';
import ComplaintList from './pages/complaints/ComplaintList';
import DonationList from './pages/donations/DonationList';
import UserManagement from './pages/user-management/UserManagement';
import EmergencyList from './pages/emergency/EmergencyList';
import TourList from './pages/tourmanagement/TourList';
import FuelClaimList from './pages/fuel-claims/FuelClaimList';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Role-based Dashboard Routes */}
        <Route path="/dashboard" element={<RoleDashboardRouter />} />

        {/* Direct Role Dashboard Routes (for specific access) */}
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/wildlife-officer" element={<WildlifeOfficerDashboard />} />
        <Route path="/dashboard/tourist" element={<TouristDashboard />} />
        <Route path="/dashboard/tour-guide" element={<TourGuideDashboard />} />
        <Route path="/dashboard/safari-driver" element={<SafariDriverDashboard />} />
        <Route path="/dashboard/vet" element={<VetDashboard />} />
        <Route path="/dashboard/call-operator" element={<CallOperatorDashboard />} />
        <Route path="/dashboard/emergency-officer" element={<EmergencyOfficerDashboard />} />

        {/* Legacy Routes (kept for backward compatibility) */}
        <Route path="/availabilityGuideDriver" element={<AvailabilityGuideDriver />} />
        <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
        <Route path="/guidedashboard" element={<GuideDashboard />} />
        <Route path="/ApplyJobForm" element={<ApplyJobForm />} />
        <Route path="/newApplications" element={<NewApplications />} />
        <Route path="/AdminCreateUserPage" element={<AdminCreateUserPage />} />
        <Route path="/AllToursPage" element={<AllToursPage />} />
        <Route path="/new-bookings" element={<NewBookings />} />

        {/* Emergency Management Routes */}
        <Route path="/emergency/officer" element={<EmergencyOfficerDashboard />} />
        <Route path="/emergency" element={<EmergencyList />} />

        {/* Tour Management Routes */}
        <Route path="/tours" element={<TourList />} />

        {/* Activity & Event Management Routes */}
        <Route path="/activities" element={<ActivityList />} />
        <Route path="/events" element={<EventList />} />

        {/* Animal Care Management Routes */}
        <Route path="/vet-dashboard" element={<VetDashboard />} />
        <Route path="/animal-care" element={<AnimalCaseList />} />

        {/* Feedback & Complaint Routes */}
        <Route path="/feedback" element={<FeedbackList />} />
        <Route path="/complaints" element={<ComplaintList />} />

        {/* Donation Routes */}
        <Route path="/donations" element={<DonationList />} />

        {/* User Management Routes */}
        <Route path="/user-management" element={<UserManagement />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Fuel Claims Routes */}
        <Route path="/fuel-claims" element={<FuelClaimList />} />

        {/* User Profile */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;