import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; // ✅ Update path if needed

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Activity', path: '/activity' },
    { name: 'Event', path: '/event' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme handling
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
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

  return (
    <nav
      className={`w-full px-6 py-4 md:px-16 lg:px-24 xl:px-32 
        flex items-center justify-between 
        bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 
        shadow-lg rounded-b-2xl transition-all z-50
        ${isScrolled ? 'fixed top-0 left-0' : 'relative'}
      `}
    >
      {/* Logo + Brand */}
      <a href="/" className="flex items-center gap-3 font-bold text-lg text-green-700 dark:text-green-400">
        <img src={logo} alt="Wild Lanka Go" className="h-10 w-auto" />
        Wild Lanka Go
      </a>

      {/* Desktop Nav */}
      <ul className="md:flex hidden items-center gap-10">
        {navLinks.map((link, index) => (
          <li key={index}>
            <a href={link.path} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              {link.name}
            </a>
          </li>
        ))}
      </ul>

      {/* Right Buttons */}
      <div className="flex items-center gap-4">
        {/* Login Button */}
        <button
          className="bg-white dark:bg-green-600 text-gray-600 dark:text-white border border-gray-300 dark:border-green-500 hover:bg-green-100 dark:hover:bg-green-700 transition-colors px-6 py-2 rounded-full text-sm"
        >
          Login
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-xl hover:text-green-600 dark:hover:text-green-400 transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? '🌙' : '🌞'}
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
        <div className="absolute top-[70px] left-0 w-full bg-white dark:bg-gray-900 p-6 md:hidden z-40 rounded-b-2xl shadow">
          <ul className="flex flex-col space-y-4 text-lg">
            {navLinks.map((link, index) => (
              <li key={index}>
                <a href={link.path} className="text-sm hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Login */}
          <button className="bg-white dark:bg-green-600 text-gray-600 dark:text-white border border-gray-300 dark:border-green-500 hover:bg-green-100 dark:hover:bg-green-700 transition-colors mt-6 px-6 py-2 rounded-full text-sm">
            Login
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
