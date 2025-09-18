import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; // Make sure the path is correct
import AboutUs from './pages/AboutUs';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* Fixed component capitalization */}
        <Route path="/about" element={<AboutUs />} /> 
      </Routes>
    </Router>
  );
}

export default App;
