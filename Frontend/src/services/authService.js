import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
let getTokenFunction = null;

export const setTokenProvider = (tokenProvider) => {
  getTokenFunction = tokenProvider;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    if (getTokenFunction) {
      try {
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get token for request:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Development mode flag
let isDevelopmentMode = false;

export const setDevelopmentMode = (enabled) => {
  isDevelopmentMode = enabled;
};

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - redirecting to login');
      
      // Check if it's an Auth0 rate limit error
      if (error.response?.data?.details?.includes('429')) {
        console.log('🚨 Auth0 rate limit detected in API call');
        setDevelopmentMode(true);
      }
    }
    return Promise.reject(error);
  }
);

// Function to handle user login/registration with backend
export const handleUserLogin = async (accessToken) => {
  try {
    const response = await api.post('/auth/login', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during backend login:', error);
    
    // Check if it's an Auth0 rate limit error (429)
    if (error.response?.status === 401 && 
        error.response?.data?.details?.includes('429')) {
      console.log('🚨 Auth0 rate limit detected in backend - creating development user');
      
      // Return a development user object that matches backend structure
      return {
        id: 'dev_user_' + Date.now(),
        auth0Id: 'auth0|dev_user',
        email: 'dev.vet@wildlanka.com',
        name: 'Dr. Development Vet',
        role: 'vet',
        permissions: ['vet:read', 'vet:write', 'vet:manage'],
        profilePicture: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDevelopmentMode: true
      };
    }
    
    throw error;
  }
};

// Function to get user profile from backend
export const getUserProfile = async (accessToken) => {
  try {
    const response = await api.get('/users/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Protected API calls (automatically include token)
export const protectedApi = {
  // User endpoints
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),

  // Tour endpoints
  getTours: () => api.get('/tour'),
  createTour: (data) => api.post('/tour', data),

  // Activity endpoints
  getActivities: () => api.get('/activities'),
  createActivity: (data) => api.post('/activities', data),
  updateActivity: (id, data) => api.put(`/activities/${id}`, data),
  deleteActivity: (id) => api.delete(`/activities/${id}`),

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
  updateTourGuideAvailability: (id, data) => api.put(`/tourGuides/${id}/availability`, data),

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

  // Tourist-specific endpoints
  getMyBookings: () => api.get('/tourist/my-bookings'),
  getMyEventRegistrations: () => api.get('/tourist/my-registrations'),
  getMyDonations: () => api.get('/tourist/my-donations'),
  getMyFeedback: () => api.get('/tourist/my-feedback'),
  getMyComplaints: () => api.get('/tourist/my-complaints'),

  // Enhanced tourist booking endpoints
  createBooking: (data) => api.post('/tourist/bookings', data),
  checkAvailableSlots: (activityId, date) => api.get(`/tourist/activities/check-slots?activityId=${activityId}&date=${date}`),

  // Enhanced tourist event endpoints
  registerForEvent: (data) => api.post('/tourist/registrations', data),
  modifyEventRegistration: (registrationId, data) => api.put(`/tourist/registrations/${registrationId}`, data),
  cancelEventRegistration: (registrationId) => api.delete(`/tourist/registrations/${registrationId}`),

  // Enhanced tourist donation endpoints
  createDonation: (data) => api.post('/tourist/donations', data),
  updateDonationMessage: (donationId, message) => api.put(`/tourist/donations/${donationId}/message`, { message }),

  // Enhanced tourist feedback endpoints
  createFeedback: (data) => api.post('/tourist/feedback', data),
  getAllFeedback: (page = 1, limit = 10) => api.get(`/tourist/feedback/all?page=${page}&limit=${limit}`),
  updateFeedback: (feedbackId, data) => api.put(`/tourist/feedback/${feedbackId}`, data),
  deleteFeedback: (feedbackId) => api.delete(`/tourist/feedback/${feedbackId}`),

  // Enhanced tourist complaint endpoints
  createComplaint: (data) => api.post('/tourist/complaints', data),
  updateComplaint: (complaintId, data) => api.put(`/tourist/complaints/${complaintId}`, data),
  deleteComplaint: (complaintId) => api.delete(`/tourist/complaints/${complaintId}`),

  // Tourist emergency reporting
  reportEmergency: (data) => api.post('/tourist/emergency', data),

  // Job applications
  submitApplication: (data) => api.post('/applications', data),
  getApplications: () => api.get('/applications'),
  updateApplicationStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),

  // Admin endpoints
  createUser: (data) => api.post('/admin/users', data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),
  getAdminStats: () => api.get('/admin/stats'),

  // Wildlife Officer specific endpoints
  getBookings: () => api.get('/bookings'),
  assignDriver: (bookingId, driverId) => api.put(`/bookings/${bookingId}/assign-driver`, { driverId }),
  assignGuide: (bookingId, guideId) => api.put(`/bookings/${bookingId}/assign-guide`, { guideId }),
  getAvailableDrivers: () => api.get('/wildlife-officer/available-drivers'),
  getAvailableGuides: () => api.get('/wildlife-officer/available-guides'),
  getDailyBookings: () => api.get('/wildlife-officer/daily-bookings'),
  
  // Enhanced complaints management
  getComplaints: () => api.get('/complaints'),
  updateComplaintStatus: (id, status) => api.put(`/complaints/${id}/status`, { status }),
  deleteComplaint: (id) => api.delete(`/complaints/${id}`),
  generateComplaintReport: (params) => api.get('/reports/complaints', { params, responseType: 'blob' }),
  
  // Job applications management
  getApplications: () => api.get('/applications'),
  approveApplication: (id, data) => api.put(`/applications/${id}/approve`, data),
  rejectApplication: (id, data) => api.put(`/applications/${id}/reject`, data),
  
  // Enhanced fuel claims management
  getFuelClaims: () => api.get('/fuel-claims'),
  approveFuelClaim: (id) => api.put(`/fuel-claims/${id}/approve`),
  rejectFuelClaim: (id, reason) => api.put(`/fuel-claims/${id}/reject`, { reason }),
  getFuelClaimDetails: (id) => api.get(`/fuel-claims/${id}`),
  
  // Financial reports
  generateMonthlyReport: (month, year) => api.get('/reports/monthly-income', { 
    params: { month, year }, 
    responseType: 'blob' 
  }),
  getMonthlyStats: (month, year) => api.get('/reports/monthly-stats', { params: { month, year } }),
  
  // Emergency management
  getEmergencies: () => api.get('/emergencies'),
  assignEmergencyStaff: (emergencyId, staffId, staffType) => api.put(`/emergencies/${emergencyId}/assign`, { 
    staffId, 
    staffType 
  }),
  updateEmergencyStatus: (emergencyId, status) => api.put(`/emergencies/${emergencyId}/status`, { status }),
  
  // Medication inventory access
  getMedicationInventory: () => api.get('/medication-inventory'),
  getMedicationAlerts: () => api.get('/medication-inventory/alerts'),
  
  // Dashboard statistics
  getWildlifeOfficerStats: () => api.get('/wildlife-officer/dashboard-stats'),

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

  // Tour Guide specific endpoints
  getTourGuideProfile: () => api.get('/tour-guide/profile'),
  updateTourGuideProfile: (data) => api.put('/tour-guide/profile', data),
  getAssignedTours: () => api.get('/tour-guide/assigned-tours'),
  getTourHistory: () => api.get('/tour-guide/tour-history'),
  getTourMaterials: () => api.get('/tour-guide/materials'),
  getTourGuideRatings: () => api.get('/tour-guide/ratings'),
  getTourGuideReviews: () => api.get('/tour-guide/reviews'),
  acceptTour: (tourId) => api.put(`/tour-guide/tours/${tourId}/accept`),
  rejectTour: (tourId, data) => api.put(`/tour-guide/tours/${tourId}/reject`, data),
  updateTourStatus: (tourId, status) => api.put(`/tour-guide/tours/${tourId}/status`, { status }),
  uploadTourMaterial: (formData) => api.post('/tour-guide/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteTourMaterial: (materialId) => api.delete(`/tour-guide/materials/${materialId}`),
  downloadTourMaterial: (materialId) => api.get(`/tour-guide/materials/${materialId}/download`, {
    responseType: 'blob'
  }),
  generateTourGuideReport: (type) => api.get(`/tour-guide/reports/${type}`, {
    responseType: 'blob'
  }),

  // Safari Driver specific endpoints
  getDriverProfile: () => api.get('/safari-driver/profile'),
  updateDriverProfile: (data) => api.put('/safari-driver/profile', data),
  getDriverAssignedTours: () => api.get('/safari-driver/assigned-tours'),
  getDriverTourHistory: () => api.get('/safari-driver/tour-history'),
  getDriverRatings: () => api.get('/safari-driver/ratings'),
  getDriverReviews: () => api.get('/safari-driver/reviews'),
  acceptDriverTour: (tourId, data) => api.put(`/safari-driver/tours/${tourId}/accept`, data),
  rejectDriverTour: (tourId, data) => api.put(`/safari-driver/tours/${tourId}/reject`, data),
  updateDriverTourStatus: (tourId, status, data) => api.put(`/safari-driver/tours/${tourId}/status`, { status, ...data }),
  uploadOdometerReading: (tourId, type, formData) => api.post(`/safari-driver/tours/${tourId}/odometer/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFuelClaims: () => api.get('/safari-driver/fuel-claims'),
  submitFuelClaim: (data) => api.post('/safari-driver/fuel-claims', data),
  getFuelClaimDetails: (claimId) => api.get(`/safari-driver/fuel-claims/${claimId}`),
  generateDriverReport: (type) => api.get(`/safari-driver/reports/${type}`, {
    responseType: 'blob'
  }),
  getTourRoute: (tourId) => api.get(`/safari-driver/tours/${tourId}/route`),
  updateDriverLocation: (tourId, location) => api.put(`/safari-driver/tours/${tourId}/location`, location),
};

export default api;