import { useState } from 'react';
import './App.css';
import Chatbot from './Chatbot';
import Navbar from './components/Navbar';
import HeroSection from './components/hero';


function App() {
  const [count, setCount] = useState(0);

  return (
    <>
 
      <Navbar />
      <hero/>
     
      
    </>
  );
}



export default App;

