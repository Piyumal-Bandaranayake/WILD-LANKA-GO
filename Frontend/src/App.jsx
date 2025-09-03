import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Chatbot from './Chatbot';
import AssignNowPage from './pages/tourmanagement/AssignNowPage';  // Import the new AssignNowPage
import GuideDashboard from './pages/tourmanagement/guidedashboard';


// ✅ Import your NewBookings page
import NewBookings from './pages/tourmanagement/newBookings';  // Capitalize page name as needed
import AvailabilityGuideDriver from './pages/tourmanagement/avalabilityGuideDriver';  // Fix case and path

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <>
        <h1>Welcome to WildLanka Go</h1>
        <Chatbot />
        
        {/* Example usage of count state if needed */}
        <p>Current count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>

        {/* ✅ Set the default route to NewBookings */}
        <Routes>
          {/* This will render NewBookings page at "/" */}
          <Route path="/" element={<NewBookings />} />
          {/* Fixed route path */}
          <Route path="/availabilityGuideDriver" element={<AvailabilityGuideDriver />} />
          <Route path="/assignnow/:bookingId" element={<AssignNowPage />} />
          <Route path="/guidedashboard" element={<GuideDashboard />} />
        </Routes>
      </>
    </BrowserRouter>
  );
}

export default App;
