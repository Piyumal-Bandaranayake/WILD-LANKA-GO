import React, { useState, useEffect } from 'react';
import Footer from "../components/footer";
import Navbar from "../components/Navbar";
import { protectedApi } from '../services/authService';

import Chatbot from '../Chatbot';

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
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    'https://images.unsplash.com/photo-1561739663-18a6d082d2b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
  ];

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

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
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section
        className="h-screen relative bg-cover bg-center flex items-center justify-center transition-all duration-1000"
        style={{ backgroundImage: `url(${backgroundImages[currentImageIndex]})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Discover Sri Lanka's Wildlife
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto mb-10">
            Experience unforgettable adventures with expert-guided tours through Sri Lanka's diverse ecosystems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-semibold transition-transform transform hover:scale-105 duration-300">
              Explore Activities
            </button>
            <button className="bg-white/90 hover:bg-white text-green-700 border-2 border-transparent px-8 py-4 rounded-full font-semibold transition-transform transform hover:scale-105 duration-300">
              View Events
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-green-700 mb-12">
            Upcoming Events
          </h2>
          {eventsLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : eventsError ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
              {eventsError}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event._id} className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <img
                    src={"https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop"}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Location:</span> {event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Activities Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-green-700 mb-12">
            Popular Activities
          </h2>
          {activitiesLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : activitiesError ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
              {activitiesError}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((activity) => (
                <div key={activity._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <img
                    src={"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"}
                    alt={activity.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Price:</span> ${activity.price}</p>
                    <p><span className="font-medium">Duration:</span> {activity.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Ready for Your Wildlife Adventure?</h2>
          <button className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg transition-colors transform hover:scale-105 duration-300">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-green-700 mb-12">
            What Our Visitors Say
          </h2>
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading testimonials...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex mb-4">{renderStars(feedback.rating)}</div>
                  <p className="text-gray-600 mb-4">"{feedback.message}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-600 rounded-full mr-3 flex items-center justify-center text-white font-bold">
                      {feedback.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold">{feedback.username}</h4>
                      <p className="text-sm text-gray-500">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Home;
