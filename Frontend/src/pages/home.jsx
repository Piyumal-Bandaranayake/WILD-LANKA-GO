import React, { useState, useEffect } from 'react';
import Footer from "../components/footer";
import Navbar from "../components/Navbar";
import { protectedApi } from '../services/authService';
import Chatbot from '../Chatbot';

// Add custom styles for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    opacity: 0;
  }
  
  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }
  
  .animation-delay-900 {
    animation-delay: 0.9s;
    opacity: 0;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);

  // Background images for the carousel
  const backgroundImages = [
    'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80', // Elephant in Sri Lankan wilderness
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80', // Leopard in natural habitat
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80', // Beautiful landscape
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80', // Nature scene
  ];

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000); // Slower transition for better visual impact

    return () => clearInterval(imageInterval);
  }, [backgroundImages.length]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await protectedApi.getFeedbacks();
        // Get the last 3 feedbacks
        setFeedbacks(response.data.slice(-3) || []);
      } catch (error) {
        console.error('Failed to fetch feedbacks:', error);
        setError('Failed to load feedbacks');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();

    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const response = await protectedApi.getEvents();
        setEvents(response.data.slice(-3) || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEventsError('Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await protectedApi.getActivities();
        setActivities(response.data.slice(-3) || []);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setActivitiesError('Failed to load activities');
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchEvents();
    fetchActivities();
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section with Modern Design */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-2000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          {/* Modern Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-emerald-700/60 to-teal-800/70"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-6 text-center">
            {/* Animated Main Heading */}
            <div className="mb-8 animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight">
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  Wild Lanka
                </span>
                <br />
                <span className="text-white/90 text-4xl md:text-5xl lg:text-6xl">
                  Adventures
                </span>
              </h1>
            </div>

            {/* Subtitle with Animation */}
            <div className="mb-12 animate-fade-in-up animation-delay-300">
              <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                Embark on extraordinary wildlife expeditions through Sri Lanka's pristine wilderness. 
                Experience the magic of untamed nature with expert guides and sustainable tourism.
              </p>
            </div>

            {/* Modern CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up animation-delay-600">
              <button className="group relative px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Explore Adventures
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button className="group px-10 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 transform hover:-translate-y-1">
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Events
                </span>
              </button>
            </div>

            {/* Stats Section */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up animation-delay-900">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Wildlife Species</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Happy Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">15</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">National Parks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Image Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`relative w-12 h-1 rounded-full transition-all duration-500 ${
                index === currentImageIndex 
                  ? 'bg-white shadow-lg scale-125' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentImageIndex && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Modern Upcoming Events Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming Events
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Don't Miss These
              <span className="block text-emerald-600">Amazing Events</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join us for unforgettable experiences in Sri Lanka's wilderness. Every event is carefully crafted to showcase nature's beauty.
            </p>
          </div>

          {eventsLoading ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-300 animate-pulse"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg">Discovering amazing events...</p>
            </div>
          ) : eventsError ? (
            <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-lg font-semibold">{eventsError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <div 
                  key={event._id} 
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Event Image */}
                  <div className="relative overflow-hidden h-56">
                    <img
                      src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop"
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-emerald-700 px-4 py-2 rounded-xl font-bold shadow-lg">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                    
                    {/* Event Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{event.location}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6">
                      <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modern Popular Activities Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-emerald-50 relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Popular Activities
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Adventure Awaits
              <span className="block text-emerald-600">Choose Your Experience</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From thrilling safaris to peaceful nature walks, discover activities that connect you with Sri Lanka's incredible biodiversity.
            </p>
          </div>

          {activitiesLoading ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-300 animate-pulse"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg">Loading amazing activities...</p>
            </div>
          ) : activitiesError ? (
            <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-lg font-semibold">{activitiesError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((activity, index) => (
                <div 
                  key={activity._id} 
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Activity Image */}
                  <div className="relative overflow-hidden h-64">
                    <img
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                      ${activity.price}
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">
                      Adventure
                    </div>
                  </div>

                  {/* Activity Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                      {activity.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {activity.description}
                    </p>
                    
                    {/* Activity Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-semibold uppercase">Duration</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{activity.duration}</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-xs font-semibold uppercase">Price</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">${activity.price}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">4.9 (127 reviews)</span>
                    </div>

                    {/* CTA Button */}
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-teal-300/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready for Your
            <span className="block bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
              Wildlife Adventure?
            </span>
          </h2>
          
          {/* Subtext */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of nature lovers who have discovered the magic of Sri Lanka's wilderness. 
            Your extraordinary journey starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="group relative px-10 py-4 bg-white text-emerald-700 font-bold text-lg rounded-full shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Get Started Today
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="group px-8 py-4 bg-transparent text-white font-semibold text-lg rounded-full border-2 border-white/50 hover:bg-white/10 hover:border-white transition-all duration-300">
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Us
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white/90">
              <div className="text-2xl md:text-3xl font-bold mb-2">5★</div>
              <div className="text-sm uppercase tracking-wider">Average Rating</div>
            </div>
            <div className="text-white/90">
              <div className="text-2xl md:text-3xl font-bold mb-2">100%</div>
              <div className="text-sm uppercase tracking-wider">Safe & Secure</div>
            </div>
            <div className="text-white/90">
              <div className="text-2xl md:text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm uppercase tracking-wider">Support</div>
            </div>
            <div className="text-white/90">
              <div className="text-2xl md:text-3xl font-bold mb-2">15+</div>
              <div className="text-sm uppercase tracking-wider">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Testimonials Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50 to-emerald-50/30"></div>
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Testimonials
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Visitors
              <span className="block text-emerald-600">Say About Us</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Hear from travelers who have experienced the magic of Sri Lanka's wildlife firsthand.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-300 animate-pulse"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg">Loading testimonials...</p>
            </div>
          ) : error ? (
            <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-lg font-semibold">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feedbacks.map((feedback, index) => (
                <div 
                  key={feedback._id} 
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 p-8 relative overflow-hidden"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 text-emerald-100 group-hover:text-emerald-200 transition-colors duration-300">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                  </div>

                  {/* Star Rating */}
                  <div className="flex mb-6">
                    {renderStars(feedback.rating)}
                    <span className="ml-2 text-sm text-gray-500 font-medium">
                      ({feedback.rating}/5)
                    </span>
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-8 italic">
                    "{feedback.message}"
                  </blockquote>

                  {/* User Info */}
                  <div className="flex items-center">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mr-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {feedback.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Details */}
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{feedback.username}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(feedback.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Badge */}
                  <div className="absolute bottom-6 right-6">
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-6">Want to share your experience?</p>
            <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-3 rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Write a Review
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Home;
