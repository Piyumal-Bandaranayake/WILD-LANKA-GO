import axios from 'axios';
import apiErrorHandler from '../utils/apiErrorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to include auth token
let getTokenFunction = null;
let isDevelopmentMode = false;

export const setTokenProvider = (tokenProvider) => {
  getTokenFunction = tokenProvider;
};

export const setDevelopmentMode = (mode) => {
  isDevelopmentMode = mode;
  if (mode) {
    console.log('Development mode enabled');
  }
};

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  async (config) => {
    // Add request timestamp for performance tracking
    config.metadata = { startTime: Date.now() };
    
    // Add auth token if available
    if (getTokenFunction) {
      try {
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get token for request:', error);
        // Continue without token since auth is now optional
      }
    }

    // Log API request in development
    if (isDevelopmentMode) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    
    // Log successful responses in development
    if (isDevelopmentMode) {
      console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        responseTime: `${responseTime}ms`,
        dataSize: JSON.stringify(response.data).length
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Create enhanced error object
    const enhancedError = {
      message: error.message,
      status: error.response?.status,
      code: error.code,
      details: {
        url: originalRequest?.url,
        method: originalRequest?.method,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    };

    // Log error with context
    apiErrorHandler.logError(enhancedError, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      attempt: originalRequest?._retryCount || 1
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('Authentication failed - but continuing since auth is optional');
      // Don't redirect to login since auth is now optional
    }

    // Retry logic for retryable errors
    if (apiErrorHandler.isRetryable(enhancedError) && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      
      try {
        // Wait before retry
        const delay = apiErrorHandler.calculateDelay(1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying API request: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
        return api(originalRequest);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(enhancedError);
      }
    }

    return Promise.reject(enhancedError);
  }
);

// Function to handle user login/registration with backend
export const handleUserLogin = async (accessToken) => {
  const context = {
    operation: 'user_login',
    hasToken: !!accessToken
  };

  try {
    const response = await apiErrorHandler.executeWithRetry(
      () => api.post('/auth/login', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      context
    );
    
    console.log('Backend login successful:', {
      userId: response.data._id,
      email: response.data.email,
      role: response.data.role
    });
    
    return response.data;
  } catch (error) {
    console.error('Error during backend login:', error);
    
    // Create user-friendly error notification
    const notification = apiErrorHandler.createErrorNotification(error, context);
    console.error('Login error notification:', notification);
    
    throw error;
  }
};

// Function to get user profile from backend
export const getUserProfile = async (accessToken) => {
  const context = {
    operation: 'get_user_profile',
    hasToken: !!accessToken
  };

  try {
    const response = await apiErrorHandler.executeWithRetry(
      () => api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      context
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Create user-friendly error notification
    const notification = apiErrorHandler.createErrorNotification(error, context);
    console.error('Profile fetch error notification:', notification);
    
    throw error;
  }
};

// Helper function to wrap API calls with error handling and retry logic
const createProtectedApiCall = (apiCall, operation) => {
  return async (...args) => {
    const context = {
      operation,
      args: args.length > 0 ? args : undefined
    };

    try {
      const response = await apiErrorHandler.executeWithRetry(
        () => apiCall(...args),
        context
      );
      return response;
    } catch (error) {
      // Log error and create notification
      const notification = apiErrorHandler.createErrorNotification(error, context);
      console.error(`API Error [${operation}]:`, notification);
      
      // Re-throw error for component handling
      throw error;
    }
  };
};

// Protected API calls (automatically include token)
export const protectedApi = {
  // User endpoints
  getProfile: createProtectedApiCall(() => api.get('/auth/profile'), 'get_profile'),
  updateProfile: createProtectedApiCall((data) => api.put('/auth/profile', data), 'update_profile'),

  // Tour endpoints
  getTours: () => api.get('/tour'),
  createTour: (data) => api.post('/tour', data),

  // Activity endpoints
  getActivities: createProtectedApiCall(() => api.get('/activities'), 'get_activities'),
  createActivity: createProtectedApiCall((data) => api.post('/activities', data), 'create_activity'),
  updateActivity: createProtectedApiCall((id, data) => api.put(`/activities/${id}`, data), 'update_activity'),
  deleteActivity: createProtectedApiCall((id) => api.delete(`/activities/${id}`), 'delete_activity'),

  // Event endpoints
  getEvents: () => api.get('/events'),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (id) => api.post(`/eventRegistrations`, { eventId: id }),

  // Emergency endpoints
  getEmergencies: () => api.get('/emergencies'),
  createEmergency: (data) => api.post('/emergencies', data),
  updateEmergencyStatus: (id, status) => api.put('/emergencies/update-status', { id, status }),
  deleteEmergency: (id) => api.delete(`/emergencies/${id}`),

  // Animal care endpoints
  getAnimalCases: (params) => api.get('/animal-cases', { params }),
  getAnimalCaseById: (id) => api.get(`/animal-cases/${id}`),
  createAnimalCase: (formData) => api.post('/animal-cases', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAnimalCase: (id, formData) => api.put(`/animal-cases/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  assignCaseToVet: (id, data) => api.put(`/animal-cases/${id}/assign`, data),
  deleteImageFromCase: (caseId, imageId) => api.delete(`/animal-cases/${caseId}/images/${imageId}`),
  getVetDashboardStats: () => api.get('/animal-cases/dashboard/stats'),
  
  // Treatment endpoints
  getTreatmentsByCase: (caseId, params) => api.get(`/animal-cases/${caseId}/treatments`, { params }),
  getTreatments: () => api.get('/animal-cases/treatments'),
  createTreatment: (caseId, formData) => api.post(`/animal-cases/${caseId}/treatments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTreatmentById: (id) => api.get(`/animal-cases/treatments/${id}`),
  updateTreatment: (id, formData) => api.put(`/animal-cases/treatments/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteTreatmentImage: (treatmentId, imageId) => api.delete(`/animal-cases/treatments/${treatmentId}/images/${imageId}`),
  generateTreatmentReport: (caseId, params) => api.get(`/animal-cases/${caseId}/treatments/report`, { params }),

  // Medication endpoints
  getMedications: () => api.get('/medications'),
  getMedicationInventory: () => api.get('/medications'), // Same as getMedications for now
  createMedication: (data) => api.post('/medications', data),
  updateMedication: (id, data) => api.put(`/medications/${id}`, data),
  deleteMedication: (id) => api.delete(`/medications/${id}`),

  // Collaboration endpoints
  getVetCollaborations: () => api.get('/collaboration/collaborating-cases'),
  createCollaboration: (data) => api.post('/collaboration', data),
  updateCollaboration: (id, data) => api.put(`/collaboration/${id}`, data),
  createAnimalCaseWithImages: (formData) => api.post('/animal-cases/with-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAnimalCase: (id, data) => api.put(`/animal-cases/${id}`, data),
  updateAnimalCaseWithImages: (id, formData) => api.put(`/animal-cases/${id}/with-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAnimalCase: (id) => api.delete(`/animal-cases/${id}`),
  assignCaseToVet: (caseId, vetId) => api.put(`/animal-cases/${caseId}/assign`, { vetId }),

  // Feedback endpoints
  getFeedbacks: () => api.get('/feedbacks'),
  createFeedback: (data) => api.post('/feedbacks', data),
  updateFeedback: (id, data) => api.put(`/feedbacks/${id}`, data),
  deleteFeedback: (id) => api.delete(`/feedbacks/${id}`),

  // Complaint endpoints
  getComplaints: () => api.get('/complaints'),
  createComplaint: (data) => api.post('/complaints', data),
  replyToComplaint: (id, data) => api.put(`/complaints/${id}/reply`, data),
  updateComplaint: (id, data) => api.put(`/complaints/${id}`, data),
  deleteComplaint: (id) => api.delete(`/complaints/${id}`),

  // Donation endpoints
  getDonations: () => api.get('/donations'),
  createDonation: (data) => api.post('/donations', data),
  updateDonation: (id, data) => api.put(`/donations/${id}`, data),
  deleteDonation: (id) => api.delete(`/donations/${id}`),

  // User management
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Tour Guide management
  getTourGuides: () => api.get('/tourGuides'),
  getTourGuideProfile: () => api.get('/auth/profile'), // This should work
  updateTourGuideAvailability: (id, data) => api.put(`/tourGuides/${id}/availability`, data),
  
  // Tour management - using existing endpoints
  getAssignedTours: () => api.get('/tours'), // Use general tours endpoint
  getTourHistory: () => api.get('/tours'), // Use general tours endpoint  
  getTourMaterials: () => api.get('/tour-materials'), // This exists
  
  // Placeholder endpoints (will return 404 but handled gracefully)
  getTourGuideRatings: () => Promise.reject(new Error('Ratings endpoint not implemented')),
  acceptTour: (tourId) => Promise.reject(new Error('Accept tour endpoint not implemented')),
  rejectTour: (tourId, data) => Promise.reject(new Error('Reject tour endpoint not implemented')),
  updateTourStatus: (tourId, status) => Promise.reject(new Error('Update tour status endpoint not implemented')),
  uploadTourMaterial: (formData) => Promise.reject(new Error('Upload material endpoint not implemented')),
  deleteTourMaterial: (materialId) => Promise.reject(new Error('Delete material endpoint not implemented')),
  downloadTourMaterial: (materialId) => Promise.reject(new Error('Download material endpoint not implemented')),
  generateTourGuideReport: (type) => Promise.reject(new Error('Generate report endpoint not implemented')),
  updateTourGuideProfile: (data) => api.put('/auth/profile', data), // This should work

  // Safari Driver management
  getDrivers: () => api.get('/drivers'),
  updateDriverAvailability: (id, data) => api.put(`/drivers/${id}/availability`, data),

  // Wildlife Officer management
  getWildlifeOfficers: () => api.get('/wildlifeOfficers'),

  // Booking endpoints
  getBookings: () => api.get('/bookings'),
  createBooking: (data) => api.post('/bookings', data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/bookings/${id}`),

  // Activity booking endpoints
  bookActivity: (data) => api.post('/activity-bookings', data),
  getActivityBookings: () => api.get('/activity-bookings'),

  // Job applications
  submitApplication: (data) => api.post('/applications', data),
  getApplications: () => api.get('/applications'),
  updateApplicationStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),

  // Admin endpoints
  createUser: (data) => api.post('/admin/users', data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),
  getAdminStats: () => api.get('/admin/stats'),

  // Fuel claims
  getFuelClaims: () => api.get('/fuel-claims'),
  submitFuelClaim: (data) => api.post('/fuel-claims', data),
  updateFuelClaimStatus: (id, status) => api.put(`/fuel-claims/${id}/status`, { status }),
  uploadOdometerReading: (formData) => api.post('/fuel-claims/odometer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Emergency forms
  getEmergencyForms: () => api.get('/emergency-forms'),
  createEmergencyForm: (data) => api.post('/emergency-forms', data),
  deleteEmergencyForm: (id) => api.delete(`/emergency-forms/${id}`),

  // Notification system
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  createNotification: (data) => api.post('/notifications', data),

  // Reports
  generateTourReport: (params) => api.get('/reports/tours', { params }),
  generateActivityReport: (params) => api.get('/reports/activities', { params }),
  generateEmergencyReport: (params) => api.get('/reports/emergencies', { params }),
  generateComplaintReport: (params) => api.get('/reports/complaints', { params }),
};

export default api;