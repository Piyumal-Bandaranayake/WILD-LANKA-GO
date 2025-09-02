import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Chatbot from './Chatbot';

// ✅ Import your NewBookings page
import NewBookings from './tourmanagement/newBookings';

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
        </Routes>
      </>
    </BrowserRouter>
  );
}

export default App;
