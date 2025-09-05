import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Chatbot from './Chatbot';
import AssignNowPage from './pages/tourmanagement/AssignNowPage';
import GuideDashboard from './pages/tourmanagement/guidedashboard';

// Pages
import NewBookings from './pages/tourmanagement/newBookings';
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';
import ApplyJobForm from './pages/tourmanagement/ApplyJobForm';

// 👇 Make sure the file is actually named NewApplications.jsx
//    and the default export is `export default function NewApplications() { ... }`
import NewApplications from './pages/tourmanagement/NewApplications';

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewBookings />} />
        <Route path="/availabilityGuideDriver" element={<AvailabilityGuideDriver />} />
        <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
        <Route path="/guidedashboard" element={<GuideDashboard />} />
        <Route path="/ApplyJobForm" element={<ApplyJobForm />} />
        {/* 👇 Use PascalCase component */}
        <Route path="/newApplications" element={<NewApplications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
