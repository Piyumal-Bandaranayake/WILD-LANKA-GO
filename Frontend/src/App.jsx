import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/home';
import AboutUs from './pages/AboutUs';
import AssignNowPage from './pages/tourmanagement/AssignNowPage';
import GuideDashboard from './pages/tourmanagement/guidedashboard';
import NewBookings from './pages/tourmanagement/newBookings';
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';
import ApplyJobForm from './pages/tourmanagement/ApplyJobForm';
import NewApplications from './pages/tourmanagement/NewApplications';
import AdminCreateUserPage from './pages/tourmanagement/AdminCreateUserPage';
import AllToursPage from './pages/tourmanagement/AllToursPage';
import EmergencyOfficerDashboard from './pages/emergency/EmergencyOfficerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/availabilityGuideDriver" element={<AvailabilityGuideDriver />} />
        <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
        <Route path="/guidedashboard" element={<GuideDashboard />} />
        <Route path="/ApplyJobForm" element={<ApplyJobForm />} />
        <Route path="/newApplications" element={<NewApplications />} />
        <Route path="/AdminCreateUserPage" element={<AdminCreateUserPage />} />
        <Route path="/AllToursPage" element={<AllToursPage />} />
        <Route path="/emergency/officer" element={<EmergencyOfficerDashboard />} />
        <Route path="/new-bookings" element={<NewBookings />} />
      </Routes>
    </Router>
  );
}

export default App;