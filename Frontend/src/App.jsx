// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Chatbot from './Chatbot';
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
        <Route path="/emergency/officer" element={<EmergencyOfficerDashboard />} />
      </Routes>
    </Router>
  );
}
