import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand and description */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Ready for Your Wildlife Adventure?
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Join thousands of nature lovers who have experienced the magic of Sri Lankan wildlife. 
              Your adventure awaits!
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors">
                Get Started Today
              </button>
              <button className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-gray-700 px-6 py-2 rounded-full transition-colors">
                Contact Us
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Discover Sri Lanka's incredible wildlife through expert-guided experiences. 
              Your gateway to unforgettable adventures in nature.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Home</a></li>
                <li><a href="/events" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Events</a></li>
                <li><a href="/activities" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Activities</a></li>
                <li><a href="/about" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Contact</a></li>
              </ul>
              
              <ul className="space-y-2">
                <li><a href="/tours" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Wildlife Tours</a></li>
                <li><a href="/booking" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Event Booking</a></li>
                <li><a href="/support" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Emergency Support</a></li>
                <li><a href="/guides" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Guide Services</a></li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">Contact Us</h4>
            <div className="space-y-3">
              <p className="flex items-start">
                <i className="fas fa-phone-alt text-green-600 dark:text-green-400 mr-3 mt-1"></i>
                <span>+94 11 123 4567</span>
              </p>
              <p className="flex items-start">
                <i className="fas fa-envelope text-green-600 dark:text-green-400 mr-3 mt-1"></i>
                <span>info@wildlankago.lk</span>
              </p>
              <p className="flex items-start">
                <i className="fas fa-map-marker-alt text-green-600 dark:text-green-400 mr-3 mt-1"></i>
                <span>Colombo, Sri Lanka</span>
              </p>
            </div>

            <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mt-6 mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © 2025 Wild Lanka Go. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;