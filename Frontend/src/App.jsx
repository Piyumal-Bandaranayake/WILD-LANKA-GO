// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Chatbot from './Chatbot';
import AssignNowPage from './pages/tourmanagement/AssignNowPage';
import GuideDashboard from './pages/tourmanagement/guidedashboard';
import NewBookings from './pages/tourmanagement/newBookings';
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';
import ApplyJobForm from './pages/tourmanagement/ApplyJobForm';
import NewApplications from './pages/tourmanagement/NewApplications';
import AdminCreateUserPage from './pages/tourmanagement/AdminCreateUserPage';
import AllToursPage from './pages/tourmanagement/AllToursPage';
import EmergencyOfficerDashboard from './pages/emergency/EmergencyOfficerDashboard';

function Home() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <h1>Welcome to WildLanka Go</h1>
      <Chatbot />
      <p>Current count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/availabilityGuideDriver" element={<AvailabilityGuideDriver />} />
        <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
        <Route path="/guidedashboard" element={<GuideDashboard />} />
        <Route path="/ApplyJobForm" element={<ApplyJobForm />} />
        <Route path="/newApplications" element={<NewApplications />} />
        <Route path="/AdminCreateUserPage" element={<AdminCreateUserPage />} />
        <Route path="/AllToursPage" element={<AllToursPage />} />
        <Route path="/emergency/officer" element={<EmergencyOfficerDashboard />} />
      </Routes>
    </Router>
  );
}