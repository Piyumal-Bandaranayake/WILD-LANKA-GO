import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/footer';
import Home from './pages/home';
import Chatbot from './components/Chatbot';

// Tour Management Pages
import NewBookings from './pages/tourmanagement/newBookings';
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';
import AssignNowPage from './pages/tourmanagement/AssignNowPage';
import GuideDashboard from './pages/tourmanagement/guidedashboard';
import ApplyJobForm from './pages/tourmanagement/ApplyJobForm';
import NewApplications from './pages/tourmanagement/NewApplications';
import AdminCreateUserPage from './pages/tourmanagement/AdminCreateUserPage';
import AllToursPage from './pages/tourmanagement/AllToursPage';

// Emergency Pages
import EmergencyOfficerDashboard from './pages/emergency/EmergencyOfficerDashboard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Theme handling - load before rendering
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
    setThemeLoaded(true);
  }, []);

  // Toggle theme
  const toggleDarkMode = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    if (newIsDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!themeLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bookings" element={<NewBookings />} />
            <Route path="/availability" element={<AvailabilityGuideDriver />} />
            <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
            <Route path="/guide-dashboard" element={<GuideDashboard />} />
            <Route path="/apply-job" element={<ApplyJobForm />} />
            <Route path="/applications" element={<NewApplications />} />
            <Route path="/admin/create-user" element={<AdminCreateUserPage />} />
            <Route path="/tours" element={<AllToursPage />} />
            <Route path="/emergency/officer" element={<EmergencyOfficerDashboard />} />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;