import { protectedApi } from './authService.js';
import api from './authService.js';

/**
 * Tourist Service - Handles all tourist-related API calls
 * 
 * This service provides methods to interact with tourist endpoints:
 * - Dashboard stats and user data
 * - Activity bookings management
 * - Event registrations management  
 * - Donations management
 * - Feedback management (CRUD)
 * - Complaints management (CRUD)
 * - Emergency reporting
 */

export const touristService = {
  // ============================================================================
  // DASHBOARD & USER DATA
  // ============================================================================

  /**
   * Get tourist dashboard statistics
   * Returns: stats object with counts and recent activity
   */
  getDashboardStats: () => api.get('/tourist/dashboard/stats'),

  /**
   * Get tourist's bookings
   * Returns: Array of bookings with populated activity details
   */
  getMyBookings: async () => {
    try {
      console.log('🔍 Fetching my bookings...');
      const response = await api.get('/tourist/my-bookings');
      console.log('✅ Bookings response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      throw error;
    }
  },

  /**
   * Get tourist's event registrations
   * Returns: Array of registrations with populated event details
   */
  getMyEventRegistrations: async () => {
    try {
      console.log('🔍 Fetching my event registrations...');
      const response = await api.get('/tourist/my-registrations');
      console.log('✅ Event registrations response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching event registrations:', error);
      throw error;
    }
  },

  /**
   * Get tourist's donations
   * Returns: Array of donations made by the tourist
   */
  getMyDonations: () => api.get('/tourist/my-donations'),

  /**
   * Get tourist's feedback submissions
   * Returns: Array of feedback submitted by the tourist
   */
  getMyFeedback: () => api.get('/tourist/my-feedback'),

  /**
   * Get tourist's complaints
   * Returns: Array of complaints submitted by the tourist
   */
  getMyComplaints: () => api.get('/tourist/my-complaints'),

  // ============================================================================
  // ACTIVITY BOOKING MANAGEMENT
  // ============================================================================

  /**
   * Check available slots for an activity on a specific date
   * @param {string} activityId - Activity ID
   * @param {string} date - Date in YYYY-MM-DD format
   * Returns: Object with available slots information
   */
  checkAvailableSlots: (activityId, date) => 
    api.get(`/tourist/activities/check-slots?activityId=${activityId}&date=${date}`),

  /**
   * Create a new activity booking
   * @param {Object} bookingData - Booking details
   * @param {string} bookingData.activityId - Activity ID
   * @param {string} bookingData.bookingDate - Date in YYYY-MM-DD format
   * @param {number} bookingData.numberOfParticipants - Number of participants
   * @param {boolean} bookingData.requestTourGuide - Whether to request a tour guide
   * @param {string} bookingData.preferredDate - Preferred date (optional)
   * @param {string} bookingData.paymentMethod - Payment method (optional)
   * Returns: Created booking with payment details
   */
  createBooking: async (bookingData) => {
    try {
      console.log('🎯 createBooking called with:', bookingData);
      
      // Validate data
      const validationErrors = validateTouristData.booking(bookingData);
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors);
        return Promise.reject(new Error(validationErrors.join(', ')));
      }
      
      // Ensure proper data types
      const validatedData = {
        ...bookingData,
        numberOfParticipants: parseInt(bookingData.numberOfParticipants),
        requestTourGuide: Boolean(bookingData.requestTourGuide)
      };
      
      console.log('✅ Validated data being sent:', validatedData);
      
      const response = await api.post('/tourist/bookings', validatedData);
      console.log('✅ Booking response:', response.data);
      
      return response;
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      if (error.response) {
        console.error('📋 Error response data:', error.response.data);
        console.error('📋 Error status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Cancel a booking (legacy route for backward compatibility)
   * @param {string} bookingId - Booking ID
   * Returns: Updated booking with cancelled status
   */
  cancelBooking: (bookingId) => api.put(`/tourist/bookings/${bookingId}/cancel`),

  // ============================================================================
  // EVENT REGISTRATION MANAGEMENT
  // ============================================================================

  /**
   * Register for an event
   * @param {Object} registrationData - Registration details
   * @param {string} registrationData.eventId - Event ID
   * @param {number} registrationData.numberOfParticipants - Number of participants
   * Returns: Created registration with event details
   */
  registerForEvent: (registrationData) => {
    // Validate data
    const validationErrors = validateTouristData.eventRegistration(registrationData);
    if (validationErrors.length > 0) {
      return Promise.reject(new Error(validationErrors.join(', ')));
    }
    
    // Ensure proper data types
    const validatedData = {
      ...registrationData,
      numberOfParticipants: parseInt(registrationData.numberOfParticipants)
    };
    
    return api.post('/tourist/registrations', validatedData);
  },

  /**
   * Modify event registration (update participant count)
   * @param {string} registrationId - Registration ID
   * @param {Object} updateData - Update details
   * @param {number} updateData.numberOfParticipants - New number of participants
   * Returns: Updated registration
   */
  modifyEventRegistration: (registrationId, updateData) => {
    // Validate required fields
    if (!registrationId || !updateData.numberOfParticipants) {
      return Promise.reject(new Error('Registration ID and number of participants are required'));
    }
    
    // Ensure numberOfParticipants is a number
    const validatedData = {
      ...updateData,
      numberOfParticipants: parseInt(updateData.numberOfParticipants)
    };
    
    return api.put(`/tourist/registrations/${registrationId}`, validatedData);
  },

  /**
   * Cancel event registration
   * @param {string} registrationId - Registration ID
   * Returns: Success message
   */
  cancelEventRegistration: (registrationId) => 
    api.delete(`/tourist/registrations/${registrationId}`),

  // ============================================================================
  // DONATION MANAGEMENT
  // ============================================================================

  /**
   * Create a donation
   * @param {Object} donationData - Donation details
   * @param {number} donationData.amount - Donation amount
   * @param {string} donationData.message - Personal message (optional)
   * @param {string} donationData.category - Donation category (optional)
   * @param {string} donationData.donationType - One-time or recurring (optional)
   * @param {boolean} donationData.isAnonymous - Whether donation is anonymous (optional)
   * Returns: Created donation
   */
  createDonation: (donationData) => api.post('/tourist/donations', donationData),

  /**
   * Update donation message
   * @param {string} donationId - Donation ID
   * @param {string} message - New message
   * Returns: Updated donation
   */
  updateDonationMessage: (donationId, message) => 
    api.put(`/tourist/donations/${donationId}/message`, { message }),

  // ============================================================================
  // FEEDBACK MANAGEMENT (CRUD)
  // ============================================================================

  /**
   * Get all feedback (view others' feedback)
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * Returns: Paginated feedback list
   */
  getAllFeedback: (page = 1, limit = 10) => 
    api.get(`/tourist/feedback/all?page=${page}&limit=${limit}`),

  /**
   * Create new feedback
   * @param {Object} feedbackData - Feedback details
   * @param {string} feedbackData.message - Feedback message
   * @param {string} feedbackData.tourGuideName - Tour guide name (optional)
   * @param {string} feedbackData.eventType - Event type (optional)
   * @param {string} feedbackData.activityType - Activity type (optional)
   * @param {Array} feedbackData.images - Image URLs (optional)
   * Returns: Created feedback
   */
  createFeedback: (feedbackData) => protectedApi.createFeedback(feedbackData),

  /**
   * Update own feedback
   * @param {string} feedbackId - Feedback ID
   * @param {Object} updateData - Updated feedback data
   * Returns: Updated feedback
   */
  updateFeedback: (feedbackId, updateData) => 
    api.put(`/tourist/feedback/${feedbackId}`, updateData),

  /**
   * Delete own feedback
   * @param {string} feedbackId - Feedback ID
   * Returns: Success message
   */
  deleteFeedback: (feedbackId) => api.delete(`/tourist/feedback/${feedbackId}`),

  // ============================================================================
  // COMPLAINT MANAGEMENT (CRUD)
  // ============================================================================

  /**
   * Create new complaint
   * @param {Object} complaintData - Complaint details
   * @param {string} complaintData.message - Complaint message
   * @param {string} complaintData.location - Location where issue occurred (optional)
   * Returns: Created complaint
   */
  createComplaint: (complaintData) => protectedApi.createComplaint(complaintData),

  /**
   * Update own complaint
   * @param {string} complaintId - Complaint ID
   * @param {Object} updateData - Updated complaint data
   * @param {string} updateData.message - Updated message (optional)
   * @param {string} updateData.location - Updated location (optional)
   * Returns: Updated complaint
   */
  updateComplaint: (complaintId, updateData) => 
    api.put(`/tourist/complaints/${complaintId}`, updateData),

  /**
   * Delete own complaint
   * @param {string} complaintId - Complaint ID
   * Returns: Success message
   */
  deleteComplaint: (complaintId) => api.delete(`/tourist/complaints/${complaintId}`),

  // ============================================================================
  // EMERGENCY REPORTING
  // ============================================================================

  /**
   * Report an emergency
   * @param {Object} emergencyData - Emergency details
   * @param {string} emergencyData.emergencyType - Type of emergency (optional)
   * @param {string} emergencyData.description - Emergency description
   * @param {string} emergencyData.location - Emergency location
   * @param {string} emergencyData.severity - Emergency severity (optional)
   * @param {string} emergencyData.contactNumber - Contact number
   * @param {Object} emergencyData.coordinates - GPS coordinates (optional)
   * Returns: Emergency report confirmation
   */
  reportEmergency: (emergencyData) => protectedApi.reportEmergency(emergencyData),
};

// ============================================================================
// USAGE EXAMPLES AND INTEGRATION HELPERS
// ============================================================================

/**
 * Example usage patterns for React components:
 * 
 * // Dashboard Component
 * const fetchDashboardData = async () => {
 *   try {
 *     const response = await touristService.getDashboardStats();
 *     setDashboardData(response.data);
 *   } catch (error) {
 *     console.error('Error fetching dashboard:', error);
 *   }
 * };
 * 
 * // Booking Component
 * const handleBooking = async (bookingData) => {
 *   try {
 *     // First check availability
 *     const slotsResponse = await touristService.checkAvailableSlots(
 *       bookingData.activityId, 
 *       bookingData.bookingDate
 *     );
 *     
 *     if (slotsResponse.data.availableSlots >= bookingData.numberOfParticipants) {
 *       const bookingResponse = await touristService.createBooking(bookingData);
 *       // Handle payment processing with bookingResponse.data.payment
 *       setBookingResult(bookingResponse.data);
 *     }
 *   } catch (error) {
 *     console.error('Booking error:', error);
 *   }
 * };
 * 
 * // Feedback Component
 * const submitFeedback = async (feedbackData) => {
 *   try {
 *     const response = await touristService.createFeedback(feedbackData);
 *     toast.success('Feedback submitted successfully!');
 *     refreshFeedbackList();
 *   } catch (error) {
 *     toast.error('Failed to submit feedback');
 *   }
 * };
 */

/**
 * Error handling helper
 */
export const handleTouristApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Invalid request data';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred';
    }
  }
  
  return 'Network error. Please check your connection.';
};

/**
 * Tourist service configuration
 */
export const touristConfig = {
  // Default pagination settings
  defaultPageSize: 10,
  
  // Booking constraints
  maxParticipants: 20,
  advanceBookingDays: 1, // Minimum days in advance for booking
  
  // Emergency severity levels
  emergencySeverityLevels: ['Low', 'Medium', 'High', 'Critical'],
  
  // Emergency types
  emergencyTypes: [
    'Wildlife Encounter',
    'Medical Emergency', 
    'Vehicle Breakdown',
    'Lost/Missing Person',
    'Natural Disaster',
    'Security Issue',
    'General'
  ],
  
  // Donation categories
  donationCategories: [
    'General Wildlife Conservation',
    'Animal Rescue & Rehabilitation',
    'Habitat Protection',
    'Research & Education',
    'Emergency Wildlife Care',
    'Community Outreach'
  ],
  
  // Activity types for feedback
  activityTypes: [
    'Safari Tour',
    'Nature Walk',
    'Bird Watching',
    'Photography Tour',
    'Educational Visit',
    'Research Program',
    'Volunteer Activity'
  ],
  
  // Event types for feedback
  eventTypes: [
    'Wildlife Conservation Workshop',
    'Educational Seminar',
    'Community Event',
    'Fundraising Event',
    'Volunteer Training',
    'Research Presentation'
  ]
};

/**
 * Validation utility functions
 */
export const validateTouristData = {
  /**
   * Validate booking data
   */
  booking: (data) => {
    const errors = [];
    
    if (!data.activityId || typeof data.activityId !== 'string') {
      errors.push('Activity ID is required and must be a string');
    }
    
    if (!data.bookingDate) {
      errors.push('Booking date is required');
    } else {
      const bookingDate = new Date(data.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        errors.push('Booking date cannot be in the past');
      }
    }
    
    if (!data.numberOfParticipants) {
      errors.push('Number of participants is required');
    } else {
      const participants = parseInt(data.numberOfParticipants);
      if (isNaN(participants) || participants < 1) {
        errors.push('Number of participants must be at least 1');
      }
      if (participants > touristConfig.maxParticipants) {
        errors.push(`Number of participants cannot exceed ${touristConfig.maxParticipants}`);
      }
    }
    
    return errors;
  },
  
  /**
   * Validate event registration data
   */
  eventRegistration: (data) => {
    const errors = [];
    
    if (!data.eventId || typeof data.eventId !== 'string') {
      errors.push('Event ID is required and must be a string');
    }
    
    if (!data.numberOfParticipants) {
      errors.push('Number of participants is required');
    } else {
      const participants = parseInt(data.numberOfParticipants);
      if (isNaN(participants) || participants < 1) {
        errors.push('Number of participants must be at least 1');
      }
      if (participants > touristConfig.maxParticipants) {
        errors.push(`Number of participants cannot exceed ${touristConfig.maxParticipants}`);
      }
    }
    
    return errors;
  },
  
  /**
   * Validate donation data
   */
  donation: (data) => {
    const errors = [];
    
    if (!data.amount) {
      errors.push('Donation amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 100) {
        errors.push('Donation amount must be at least LKR 100');
      }
    }
    
    if (data.category && !touristConfig.donationCategories.includes(data.category)) {
      errors.push('Invalid donation category');
    }
    
    return errors;
  },
  
  /**
   * Validate feedback data
   */
  feedback: (data) => {
    const errors = [];
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Feedback message must be at least 10 characters long');
    }
    
    if (data.activityType && !touristConfig.activityTypes.includes(data.activityType)) {
      errors.push('Invalid activity type');
    }
    
    if (data.eventType && !touristConfig.eventTypes.includes(data.eventType)) {
      errors.push('Invalid event type');
    }
    
    return errors;
  },
  
  /**
   * Validate complaint data
   */
  complaint: (data) => {
    const errors = [];
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Complaint message must be at least 10 characters long');
    }
    
    return errors;
  },
  
  /**
   * Validate emergency data
   */
  emergency: (data) => {
    const errors = [];
    
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Emergency description must be at least 10 characters long');
    }
    
    if (!data.location || data.location.trim().length < 3) {
      errors.push('Emergency location is required');
    }
    
    if (!data.contactNumber || data.contactNumber.trim().length < 10) {
      errors.push('Valid contact number is required');
    }
    
    if (data.emergencyType && !touristConfig.emergencyTypes.includes(data.emergencyType)) {
      errors.push('Invalid emergency type');
    }
    
    if (data.severity && !touristConfig.emergencySeverityLevels.includes(data.severity)) {
      errors.push('Invalid emergency severity level');
    }
    
    return errors;
  }
};

export default touristService;