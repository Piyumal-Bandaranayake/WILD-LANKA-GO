import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance for public API calls (no auth required)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Public API calls that don't require authentication
export const publicApiService = {
  // Animal Cases
  getAnimalCases: (params) => publicApi.get('/animal-cases', { params }),
  getAnimalCaseById: (id) => publicApi.get(`/animal-cases/${id}`),
  createAnimalCase: (formData) => publicApi.post('/animal-cases', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAnimalCase: (id, formData) => publicApi.put(`/animal-cases/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAnimalCase: (id) => publicApi.delete(`/animal-cases/${id}`),
  assignCaseToVet: (id, data) => publicApi.put(`/animal-cases/${id}/assign`, data),
  deleteImageFromCase: (caseId, imageId) => publicApi.delete(`/animal-cases/${caseId}/images/${imageId}`),
  getVetDashboardStats: () => publicApi.get('/animal-cases/dashboard/stats'),
  
  // Treatments
  getTreatmentsByCase: (caseId, params) => publicApi.get(`/animal-cases/${caseId}/treatments`, { params }),
  getTreatments: () => publicApi.get('/animal-cases/treatments'),
  createTreatment: (caseId, data) => publicApi.post(`/animal-cases/${caseId}/treatments`, data),
  getTreatmentById: (id) => publicApi.get(`/animal-cases/treatments/${id}`),
  updateTreatment: (id, data) => publicApi.put(`/animal-cases/treatments/${id}`, data),
  deleteTreatmentImage: (treatmentId, imageId) => publicApi.delete(`/animal-cases/treatments/${treatmentId}/images/${imageId}`),
  generateTreatmentReport: (caseId, params) => publicApi.get(`/animal-cases/${caseId}/treatments/report`, { params }),

  // Medications
  getMedications: () => publicApi.get('/medications'),
  createMedication: (data) => publicApi.post('/medications', data),
  updateMedication: (id, data) => publicApi.put(`/medications/${id}`, data),
  deleteMedication: (id) => publicApi.delete(`/medications/${id}`),

  // Users (for vet assignment)
  getUsers: () => publicApi.get('/users'),
  getUserById: (id) => publicApi.get(`/users/${id}`),

  // GPS Tracking
  enableGPSTracking: (caseId, data) => publicApi.post(`/gps-tracking/${caseId}/enable`, data),
  disableGPSTracking: (caseId) => publicApi.post(`/gps-tracking/${caseId}/disable`),
  updateGPSLocation: (caseId, data) => publicApi.put(`/gps-tracking/${caseId}/location`, data),
  getGPSLocation: (caseId) => publicApi.get(`/gps-tracking/${caseId}`),
  getGPSHistory: (caseId) => publicApi.get(`/gps-tracking/${caseId}/history`),
  getActiveTrackedAnimals: () => publicApi.get('/gps-tracking/active-animals'),

  // Collaboration
  addCollaborationComment: (caseId, data) => publicApi.post(`/collaboration/${caseId}/comments`, data),
  getCollaborationComments: (caseId) => publicApi.get(`/collaboration/${caseId}/comments`),
  shareCaseWithVet: (caseId, data) => publicApi.post(`/collaboration/${caseId}/share`, data),
  transferCase: (caseId, data) => publicApi.post(`/collaboration/${caseId}/transfer`, data),
  getCollaboratingCases: () => publicApi.get('/collaboration/collaborating-cases'),
  getAvailableVeterinarians: (caseId) => publicApi.get(`/collaboration/${caseId}/available-vets`),

  // Applications
  submitApplication: (data) => publicApi.post('/applications/apply', data),
};

export default publicApiService;