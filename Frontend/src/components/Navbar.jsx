import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import ProfileImage from './ProfileImage';
import logo from '../assets/logo.png';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { 
    isFullyAuthenticated, 
    isLoading, 
    user, 
    backendUser, 
    loginWithRedirect, 
    logout 
  } = useAuthContext();

  const publicNavLinks = [
    { name: 'Home', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'About', path: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Activities', path: '/activities', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Events', path: '/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Contact', path: '/contact', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { name: 'Donation', path: '/donation', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  ];

  const protectedNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
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
      className={`w-full px-6 py-3 md:px-8 lg:px-12
        flex items-center justify-between 
        fixed top-0 left-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'backdrop-blur-xl bg-white/90 shadow-lg border-b border-emerald-100' 
          : 'bg-transparent'
        }
      `}
    >
      {/* Logo + Brand */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          <img 
            src={logo} 
            alt="Wild Lanka Go" 
            className="h-12 w-auto transition-transform duration-300 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="hidden sm:block">
          <div className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Wild Lanka
          </div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">
            Adventures
          </div>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center">
        <ul className="flex items-center gap-1">
          {!isFullyAuthenticated && publicNavLinks.map((link, index) => (
            <li key={index}>
              <Link 
                to={link.path} 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all duration-300 font-medium"
              >
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                </svg>
                <span className="relative">
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
            </li>
          ))}
          {isFullyAuthenticated && [
            ...publicNavLinks.map((link, index) => (
              <li key={`public-${index}`}>
                <Link 
                  to={link.path} 
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all duration-300 font-medium"
                >
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                  </svg>
                  <span className="relative">
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </li>
            )),
            ...protectedNavLinks.map((link, index) => (
              <li key={`protected-${index}`}>
                <Link 
                  to={link.path} 
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all duration-300 font-medium"
                >
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                  </svg>
                  <span className="relative">
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </li>
            ))
          ]}
        </ul>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Authentication Buttons */}
        {!isFullyAuthenticated ? (
          <button
            className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
            onClick={() => loginWithRedirect()}
            disabled={isLoading}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {/* User Profile Section */}
            <div className="hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-emerald-100">
              <ProfileImage
                src={user?.picture}
                alt={user?.name}
                fallbackText={user?.name}
                className="w-8 h-8 rounded-full border-2 border-emerald-400 shadow-md"
              />
              <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                {user?.name}
              </span>
            </div>
            
            {/* Logout Button */}
            <button
              className="group relative px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:border-red-300 hover:text-red-600 rounded-full transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </span>
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          aria-label="Toggle menu"
          type="button"
          className="lg:hidden relative w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 flex items-center justify-center transition-all duration-300 hover:bg-emerald-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="relative w-5 h-5">
            <span className={`absolute block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'top-2 rotate-45' : 'top-1'}`}></span>
            <span className={`absolute block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'top-2'}`}></span>
            <span className={`absolute block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'top-2 -rotate-45' : 'top-3'}`}></span>
          </div>
        </button>
      </div>

      {/* Modern Mobile Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Wild Lanka Go" className="h-8 w-auto" />
                <div>
                  <div className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Wild Lanka
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    Adventures
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="p-6">
              <ul className="space-y-2">
                {!isFullyAuthenticated && publicNavLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.path} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                      </svg>
                      {link.name}
                    </Link>
                  </li>
                ))}
                {isFullyAuthenticated && [
                  ...publicNavLinks.map((link, index) => (
                    <li key={`mobile-public-${index}`}>
                      <Link 
                        to={link.path} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                        </svg>
                        {link.name}
                      </Link>
                    </li>
                  )),
                  ...protectedNavLinks.map((link, index) => (
                    <li key={`mobile-protected-${index}`}>
                      <Link 
                        to={link.path} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                        </svg>
                        {link.name}
                      </Link>
                    </li>
                  ))
                ]}
              </ul>

              {/* Mobile Authentication Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                {!isFullyAuthenticated ? (
                  <button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    onClick={() => {
                      loginWithRedirect();
                      setIsMenuOpen(false);
                    }}
                    disabled={isLoading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* User Profile in Mobile */}
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                      <ProfileImage
                        src={user?.picture}
                        alt={user?.name}
                        fallbackText={user?.name}
                        className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow-md"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{user?.name}</div>
                        <div className="text-sm text-emerald-600">Authenticated User</div>
                      </div>
                    </div>
                    
                    {/* Logout Button */}
                    <button
                      className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-50 font-semibold py-3 rounded-xl transition-all duration-300"
                      onClick={() => {
                        logout({ logoutParams: { returnTo: window.location.origin } });
                        setIsMenuOpen(false);
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default NavBar;
