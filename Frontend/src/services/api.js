const API_BASE_URL = 'http://localhost:5002/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth headers from localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Tourist specific methods - Updated to use clean auth system
  async loginTourist(credentials) {
    return this.post('/auth/login', credentials);
  }

  async registerTourist(userData) {
    return this.post('/auth/register', userData);
  }

  async getTouristProfile() {
    return this.get('/tourist/profile');
  }

  async getMyBookings() {
    return this.get('/tourist/my-bookings');
  }

  async getMyEventRegistrations() {
    return this.get('/tourist/my-registrations');
  }

  async getMyDonations() {
    return this.get('/donations/my-donations');
  }

  async getMyFeedback() {
    return this.get('/tourist/my-feedback');
  }

  async getMyComplaints() {
    return this.get('/tourist/my-complaints');
  }

  async getMyEmergencies() {
    return this.get('/tourist/my-emergencies');
  }

  async getDashboardStats() {
    return this.get('/tourist/dashboard/stats');
  }
}

export default new ApiService();
