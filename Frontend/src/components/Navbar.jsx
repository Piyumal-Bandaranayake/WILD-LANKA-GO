import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // ✅ Update path if needed

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Activity', path: '/activity' },
    { name: 'Event', path: '/event' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Scroll listener to detect if the page has been scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`w-full px-6 py-4 md:px-16 lg:px-24 xl:px-32
        flex items-center justify-between 
        bg-white text-gray-700 shadow-lg rounded-b-2xl fixed top-0 left-0 z-50 
        ${isScrolled ? 'backdrop-blur-lg bg-white/80' : 'bg-white'}
      `}
    >
      {/* Logo + Brand */}
      <Link to="/" className="flex items-center gap-3 font-bold text-lg text-green-700">
        <img src={logo} alt="Wild Lanka Go" className="h-10 w-auto" />
        Wild Lanka Go
      </Link>

      {/* Desktop Nav */}
      <ul className="md:flex hidden items-center gap-10">
        {navLinks.map((link, index) => (
          <li key={index}>
            <Link to={link.path} className="hover:text-green-600 transition-colors">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right Buttons */}
      <div className="flex items-center gap-4">
        {/* Login Button */}
        <button
          className="bg-white text-gray-600 border border-gray-300 hover:bg-green-100 transition-colors px-6 py-2 rounded-full text-sm"
        >
          Login
        </button>

        {/* Mobile Menu Button */}
        <button
          aria-label="menu"
          type="button"
          className="md:hidden text-2xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-[70px] left-0 w-full bg-white p-6 md:hidden z-40 rounded-b-2xl shadow">
          <ul className="flex flex-col space-y-4 text-lg">
            {navLinks.map((link, index) => (
              <li key={index}>
                <Link to={link.path} className="text-sm hover:text-green-600 transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Login */}
          <button className="bg-white text-gray-600 border border-gray-300 hover:bg-green-100 transition-colors mt-6 px-6 py-2 rounded-full text-sm">
            Login
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;