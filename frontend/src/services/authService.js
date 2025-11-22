import axios from 'axios';
import apiErrorHandler from '../utils/apiErrorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for all operations
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
          console.log('🔑 Token added to request:', config.url, 'Token preview:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ No token available for request:', config.url);
          // Don't continue without token for protected endpoints
          if (config.url.includes('/tourist/') || config.url.includes('/auth/') || config.url.includes('/events') || config.url.includes('/admin/') || config.url.includes('/fuel-claims/')) {
            throw new Error('Authentication required for this endpoint');
          }
        }
      } catch (error) {
        console.error('❌ Failed to get token for request:', config.url, error);
        // Don't continue without token for protected endpoints
        if (config.url.includes('/tourist/') || config.url.includes('/auth/') || config.url.includes('/events') || config.url.includes('/admin/') || config.url.includes('/fuel-claims/')) {
          throw new Error('Authentication required for this endpoint');
        }
      }
    } else {
      console.warn('⚠️ No token provider set for request:', config.url);
      // Don't continue without token for protected endpoints
      if (config.url.includes('/tourist/') || config.url.includes('/auth/') || config.url.includes('/events') || config.url.includes('/admin/') || config.url.includes('/fuel-claims/')) {
        throw new Error('Authentication required for this endpoint');
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
      console.error('🔒 Authentication failed - 401 Unauthorized');
      console.error('Request URL:', originalRequest?.url);
      console.error('Request method:', originalRequest?.method);
      
      // Check if this is a protected endpoint that requires authentication
      if (originalRequest?.url?.includes('/tourist/') || originalRequest?.url?.includes('/auth/') || originalRequest?.url?.includes('/events')) {
        console.error('❌ Protected endpoint requires valid authentication');
        
        // Dispatch a custom event for global authentication error handling
        const authErrorEvent = new CustomEvent('authError', {
          detail: {
            status: 401,
            message: 'Authentication failed',
            url: originalRequest?.url,
            method: originalRequest?.method
          }
        });
        window.dispatchEvent(authErrorEvent);
        
        // Don't continue - this endpoint requires authentication
        return Promise.reject(enhancedError);
      } else {
        console.warn('⚠️ Public endpoint - continuing without authentication');
      }
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
  changePassword: createProtectedApiCall((data) => api.put('/auth/change-password', data), 'change_password'),
  
  // Token management
  validateToken: createProtectedApiCall(() => api.get('/auth/validate-token'), 'validate_token'),
  refreshToken: createProtectedApiCall(() => api.post('/auth/refresh-token'), 'refresh_token'),
  logout: createProtectedApiCall(() => api.post('/auth/logout'), 'logout'),

  // Tour endpoints
  getTours: () => api.get('/tour'),
  createTour: (data) => api.post('/tours/create', data),
  createTourWithAssignment: (data) => api.post('/tours/create-with-assignment', data),
  assignDriver: (bookingId, driverId) => api.put('/tours/assign', { bookingId, assignedDriver: driverId }),
  assignGuide: (bookingId, guideId) => api.put('/tours/assign', { bookingId, assignedTourGuide: guideId }),
  getToursByDriver: (driverId) => api.get(`/tours/driver/${driverId}`),
  driverAcceptTour: (tourId) => api.put(`/tours/${tourId}/accept`),
  driverRejectTour: (tourId, reason) => api.put(`/tours/${tourId}/reject`, { reason }),
  submitTourRejection: ({ tourId, driverId, reason }) => api.post('/tour-rejection/submit', { tourId, driverId, reason }),
  driverUpdateTourStatus: (tourId, status) => api.put(`/tours/${tourId}/status`, { status }),

  // Activity endpoints
  getActivities: createProtectedApiCall(() => api.get('/activities'), 'get_activities'),
  createActivity: createProtectedApiCall((data) => {
    // Check if data is FormData (for image uploads)
    if (data instanceof FormData) {
      return api.post('/activities', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/activities', data);
  }, 'create_activity'),
  updateActivity: createProtectedApiCall((id, data) => {
    // Check if data is FormData (for image uploads)
    if (data instanceof FormData) {
      return api.put(`/activities/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/activities/${id}`, data);
  }, 'update_activity'),
  deleteActivity: createProtectedApiCall((id) => api.delete(`/activities/${id}`), 'delete_activity'),

  // Event endpoints
  getEvents: () => api.get('/events'),
  createEvent: (data) => {
    // Check if data is FormData (for image uploads)
    if (data instanceof FormData) {
      return api.post('/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/events', data);
  },
  updateEvent: (id, data) => {
    console.log('🔧 updateEvent called with:', { id, isFormData: data instanceof FormData });
    console.log('🔧 Axios baseURL:', api.defaults.baseURL);
    console.log('🔧 Full URL will be:', `${api.defaults.baseURL}/events/${id}`);
    
    // Check if data is FormData (for image uploads)
    if (data instanceof FormData) {
      return api.put(`/events/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/events/${id}`, data);
  },
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (data) => api.post(`/tourist/registrations`, data),

  // Emergency endpoints
  getEmergencies: (params = {}) => api.get('/emergencies', { params }),
  getEmergencyById: (id) => api.get(`/emergencies/${id}`),
  createEmergency: (data) => api.post('/emergencies/report', data),
  createEmergencyByCallOperator: (data) => api.post('/emergencies/call-operator', data),
  assignEmergency: (id, data) => api.put(`/emergencies/${id}/assign`, data),
  updateEmergencyStatus: (id, data) => api.put(`/emergencies/${id}/status`, data),
  updateEmergencyStatusSimple: (id, data) => api.put(`/emergencies/${id}/status-simple`, data),
  deleteEmergency: (id) => api.delete(`/emergencies/${id}`),
  getEmergencyStats: (params = {}) => api.get('/emergencies/stats', { params }),
  getAssignedEmergencies: (params = {}) => api.get('/emergencies/assigned', { params }),

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
  createTreatment: (caseId, data) => api.post(`/animal-cases/${caseId}/treatments`, data),
  getTreatmentById: (id) => api.get(`/animal-cases/treatments/${id}`),
  updateTreatment: (id, data) => api.put(`/animal-cases/treatments/${id}`, data),
  deleteTreatmentImage: (treatmentId, imageId) => api.delete(`/animal-cases/treatments/${treatmentId}/images/${imageId}`),
  generateTreatmentReport: (caseId, params) => api.get(`/animal-cases/${caseId}/treatments/report`, { params }),

  // Vet Support endpoints
  getAvailableVets: (params) => api.get('/vet-support/vets', { params }),
  sendSupportRequest: (data) => api.post('/vet-support/request', data),
  getSupportRequests: (params) => api.get('/vet-support/requests', { params }),
  respondToSupportRequest: (requestId, action) => api.put(`/vet-support/requests/${requestId}/respond`, { action }),
  getCollaborationDetails: (caseId) => api.get(`/vet-support/collaboration/${caseId}`),

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
    timeout: 45000 // 45 seconds for image uploads (reduced from 60)
    // Note: Don't set Content-Type manually - let axios handle it for FormData
  }),
  updateAnimalCase: (id, data) => api.put(`/animal-cases/${id}`, data),
  updateAnimalCaseWithImages: (id, formData) => api.put(`/animal-cases/${id}/with-images`, formData, {
    // Note: Don't set Content-Type manually - let axios handle it for FormData
  }),
  deleteAnimalCase: (id) => api.delete(`/animal-cases/${id}`),
  assignCaseToVet: (caseId, vetId) => api.put(`/animal-cases/${caseId}/assign`, { vetId }),

  // Feedback endpoints
  getFeedbacks: () => api.get('/feedback/public'),
  getAllFeedback: () => api.get('/feedback/public'),
  getMyFeedback: () => api.get('/feedback/my-feedback'),
  createFeedback: (data) => {
    if (data instanceof FormData) {
      return api.post('/feedback', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/feedback', data);
  },
  updateFeedback: (id, data) => api.put(`/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/feedback/${id}`),

  // Complaint endpoints
  getComplaints: () => api.get('/complaints'),
  getMyComplaints: () => api.get('/tourist/my-complaints'),
  createComplaint: (data) => api.post('/complaints', data),
  submitComplaint: (data) => api.post('/complaints', data), // Alias for createComplaint
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  searchComplaints: (params) => api.get('/complaints/search', { params }),
  advancedSearchComplaints: (params) => api.get('/complaints/search/advanced', { params }),
  getComplaintStats: (params) => api.get('/complaints/stats', { params }),
  // Reply endpoints
  addReply: (id, data) => api.post(`/complaints/${id}/reply`, data),
  updateReply: (id, data) => api.put(`/complaints/${id}/reply`, data),
  deleteReply: (id, replyId) => api.delete(`/complaints/${id}/reply?replyId=${replyId}`),
  generateComplaintPDF: (id) => api.get(`/complaints/${id}/pdf`, { responseType: 'blob' }),
  updateComplaint: (id, data) => api.put(`/complaints/${id}`, data),
  updateComplaintStatus: (id, status) => api.put(`/complaints/${id}/status`, { status }),
  deleteComplaint: (id, email) => api.delete(`/complaints/${id}?email=${encodeURIComponent(email)}`),
  // Wildlife Officer delete complaint (with all replies)
  deleteComplaintByOfficer: (id) => api.delete(`/complaints/${id}/officer`),

  // Donation endpoints
  getDonations: () => api.get('/donations'),
  getAllDonations: () => api.get('/donations'), // Alias for getDonations
  createDonation: (data) => api.post('/donations', data),
  updateDonation: (id, data) => api.put(`/donations/${id}`, data),
  deleteDonation: (id) => api.delete(`/donations/${id}`),

  // Booking PDF endpoints
  downloadBookingPDF: () => api.get('/activity-bookings/pdf/my-bookings', {
    responseType: 'blob'
  }),

  // User management - Updated to use admin endpoints
  getUserById: (id) => api.get(`/admin/users/${id}`),

  // Tour Guide management - Updated to use admin endpoints
  getTourGuides: () => api.get('/admin/users?role=tourGuide'),
  getAvailableGuides: () => api.get('/users/available-staff?role=tourGuide&isAvailable=true'),
  getTourGuideProfile: () => api.get('/auth/profile'), // This should work
  updateTourGuideAvailability: (id, data) => api.put(`/admin/users/${id}`, data),
  
  // Tour management - using existing endpoints
  getAssignedTours: (guideId) => api.get(`/tours/guide/${guideId}`), // Use guide-specific endpoint
  getTourHistory: (guideId) => api.get(`/tours/guide/${guideId}`), // Use guide-specific endpoint  
  getTourMaterials: () => api.get('/tour-materials'), // This exists
  
  // Placeholder endpoints (will return 404 but handled gracefully)
  getTourGuideRatings: () => Promise.reject(new Error('Ratings endpoint not implemented')),
  acceptTour: (tourId) => Promise.reject(new Error('Accept tour endpoint not implemented')),
  rejectTour: (tourId, data) => Promise.reject(new Error('Reject tour endpoint not implemented')),
  updateTourStatus: (tourId, status) => Promise.reject(new Error('Update tour status endpoint not implemented')),
  getTourMaterials: () => api.get('/tour-materials'),
  uploadTourMaterial: (formData) => api.post('/tour-materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteTourMaterial: (materialId) => api.delete(`/tour-materials/${materialId}`),
  downloadTourMaterial: (materialId) => api.get(`/tour-materials/${materialId}`, { responseType: 'blob' }),
  generateTourGuideReport: (type) => Promise.reject(new Error('Generate report endpoint not implemented')),
  updateTourGuideProfile: (data) => api.put('/auth/profile', data), // This should work

  // Safari Driver management - using existing auth endpoints
  // Note: Driver-specific endpoints don't exist in backend, using user profile instead

  // Wildlife Officer management
  getWildlifeOfficers: () => api.get('/wildlifeOfficers'),

  // Booking endpoints
  getBookings: () => api.get('/activity-bookings'),
  createBooking: (data) => api.post('/activity-bookings', data),
  updateBooking: (id, data) => api.put(`/activity-bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/activity-bookings/${id}`),

  // Activity booking endpoints
  bookActivity: (data) => api.post('/activity-bookings', data),
  getActivityBookings: () => api.get('/activity-bookings'),
  checkAvailableSlots: (params) => api.get('/activity-bookings/check-slots', { params }),
  verifySlotReduction: (params) => api.get('/activity-bookings/verify-slots', { params }),
  
  // Event slot checking endpoints
  checkEventAvailableSlots: (params) => api.get('/tourist/events/check-slots', { params }),
  
  // Tourist-specific endpoints
  getMyBookings: createProtectedApiCall(() => api.get('/tourist/my-bookings'), 'get_my_bookings'),
  getMyEventRegistrations: createProtectedApiCall(() => api.get('/tourist/my-registrations'), 'get_my_event_registrations'),
  getMyDonations: createProtectedApiCall(() => api.get('/donations/my-donations'), 'get_my_donations'),
  getMyFeedback: createProtectedApiCall(() => api.get('/tourist/my-feedback'), 'get_my_feedback'),
  getMyComplaints: createProtectedApiCall(() => api.get('/tourist/my-complaints'), 'get_my_complaints'),
  getMyEmergencies: createProtectedApiCall(() => api.get('/tourist/my-emergencies'), 'get_my_emergencies'),
  
  // Event registration endpoints
  getEventRegistrations: () => api.get('/eventRegistrations'),
  updateEventRegistration: (registrationId, data) => api.put(`/tourist/registrations/${registrationId}`, data),
  cancelEventRegistration: (registrationId) => api.delete(`/tourist/registrations/${registrationId}`),

  // Job applications
  submitApplication: (data) => api.post('/applications', data),
  getApplications: (params = {}) => api.get('/applications', { params }),
  getJobApplications: (params = {}) => api.get('/applications/job-applications', { params }),
  updateApplicationStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
  approveApplication: (id, notes) => api.patch(`/applications/${id}/wpo`, { action: 'approve', notes }),
  rejectApplication: (id, notes) => api.patch(`/applications/${id}/wpo`, { action: 'reject', notes }),
  createAccountFromApplication: (id, customPassword = null) => api.post(`/applications/${id}/admin-create-account`, { customPassword }),
  getApplicationById: (id) => api.get(`/applications/${id}`),

  // Admin endpoints
  createUser: (data) => api.post('/admin/users', data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllUsers: (params = {}) => api.get('/admin/users', { params: { limit: 100, ...params } }),
  getAdminStats: () => api.get('/admin/stats'),
  
  // Staff endpoints
  getAvailableStaff: (params = {}) => api.get('/users/available-staff', { params }),
  
  // Tour management endpoints
  createTourWithAssignment: (data) => api.post('/tours/create-with-assignment', data),
  getAllTours: () => api.get('/tours'),
  getTourById: (id) => api.get(`/tours/${id}`),

  // Fuel claims
  getFuelClaims: () => api.get('/fuel-claims'),
  getFuelClaimsByDriver: (driverId) => api.get(`/fuel-claims/driver/${driverId}`),
  submitFuelClaim: (data) => api.post('/fuel-claims/submit-simple', data),
  updateFuelClaimStatus: (id, status) => api.put(`/fuel-claims/${id}/status`, { status }),
  uploadOdometerReading: (formData) => api.post('/fuel-claims/odometer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitOdometerReading: (formData) => api.post('/fuel-claims/odometer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getOdometerReadings: () => api.get('/fuel-claims/odometer'),

  // Reports
  generateMonthlyReport: () => api.get('/reports/monthly'),

  // Emergency forms
  getEmergencyForms: (params = {}) => api.get('/emergency-forms', { params }),
  getEmergencyFormById: (id) => api.get(`/emergency-forms/${id}`),
  createEmergencyForm: (data) => api.post('/emergency-forms/submit', data),
  updateEmergencyFormStatus: (id, data) => api.put(`/emergency-forms/${id}/status`, data),
  deleteEmergencyForm: (id) => api.delete(`/emergency-forms/${id}`),

  // Notification system
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  createNotification: (data) => api.post('/notifications', data),
  
  // Safari Driver Notifications
  getDriverNotifications: (driverId, options = {}) => api.get(`/safari-drivers/${driverId}/notifications`, { params: options }),
  markNotificationAsRead: (driverId, notificationId) => api.put(`/safari-drivers/${driverId}/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: (driverId) => api.put(`/safari-drivers/${driverId}/notifications/read-all`),

  // Reports
  generateTourReport: (params) => api.get('/reports/tours', { params }),
  generateActivityReport: (params) => api.get('/reports/activities', { params }),
  generateEmergencyReport: (params) => api.get('/reports/emergencies', { params }),
  generateComplaintReport: (params) => api.get('/reports/complaints', { params }),

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
  createTreatment: (caseId, data) => api.post(`/animal-cases/${caseId}/treatments`, data),
  getTreatmentById: (id) => api.get(`/animal-cases/treatments/${id}`),
  updateTreatment: (id, data) => api.put(`/animal-cases/treatments/${id}`, data),
  deleteTreatmentImage: (treatmentId, imageId) => api.delete(`/animal-cases/treatments/${treatmentId}/images/${imageId}`),
  generateTreatmentReport: (caseId, params) => api.get(`/animal-cases/${caseId}/treatments/report`, { params }),

  // Animal case with images
  createAnimalCaseWithImages: (formData) => api.post('/animal-cases/with-images', formData, {
    timeout: 45000 // 45 seconds for image uploads (reduced from 60)
    // Note: Don't set Content-Type manually - let axios handle it for FormData
  }),
  updateAnimalCaseWithImages: (id, formData) => api.put(`/animal-cases/${id}/with-images`, formData, {
    // Note: Don't set Content-Type manually - let axios handle it for FormData
  }),
  deleteAnimalCase: (id) => api.delete(`/animal-cases/${id}`),
  assignCaseToVet: (caseId, vetId) => api.put(`/animal-cases/${caseId}/assign`, { vetId }),

  // Inventory/Medicine endpoints
  getInventoryStats: () => api.get('/inventory/stats'),
  getMedicines: (params) => api.get('/inventory', { params }),
  getMedicineById: (id) => api.get(`/inventory/${id}`),
  createMedicine: (data) => api.post('/inventory', data),
  updateMedicine: (id, data) => api.put(`/inventory/${id}`, data),
  deleteMedicine: (id) => api.delete(`/inventory/${id}`),
  updateStock: (id, data) => api.put(`/inventory/${id}/stock`, data),
};

export default api;