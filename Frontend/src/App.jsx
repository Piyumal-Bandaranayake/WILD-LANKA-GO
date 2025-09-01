import { useState } from 'react';
import './App.css';
import Chatbot from './Chatbot';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Welcome to WildLanka Go</h1>
      <Chatbot />

      {/* Example usage of count state if needed */}
      <p>Current count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </>
  );
}

export default App;
