// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_PROFILE: '/auth/profile',

  // Users
  USERS: '/users',
  PROFILE_IMAGE: '/profile-image',

  // Tour Management
  TOURS: '/tour',
  APPLICATIONS: '/applications',
  TOUR_GUIDES: '/tourGuides',
  DRIVERS: '/drivers',
  WILDLIFE_OFFICERS: '/wildlifeOfficers',

  // Emergency
  EMERGENCIES: '/emergencies',
  EMERGENCY_FORMS: '/emergency-forms',

  // Activities & Events
  ACTIVITIES: '/activities',
  EVENTS: '/events',
  BOOKINGS: '/bookings',
  DONATIONS: '/donations',

  // Animal Care
  ANIMAL_CASES: '/animal-cases',
  MEDICATION: '/inventory',

  // Feedback & Complaints
  FEEDBACKS: '/feedbacks',
  COMPLAINTS: '/complaints',

  // Chatbot
  CHATBOT: '/chatbot',
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
};