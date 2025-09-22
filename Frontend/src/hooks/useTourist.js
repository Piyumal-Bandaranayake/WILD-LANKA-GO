import { useState, useEffect, useCallback } from 'react';
import { touristService, handleTouristApiError } from '../services/touristService.js';

/**
 * Custom React hooks for tourist functionality
 * These hooks provide state management and API integration for tourist features
 */

// ============================================================================
// DASHBOARD HOOK
// ============================================================================

/**
 * Hook for tourist dashboard data
 * @returns {Object} { data, loading, error, refetch }
 */
export const useTouristDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getDashboardStats();
      setData(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};

// ============================================================================
// BOOKING HOOKS
// ============================================================================

/**
 * Hook for managing tourist bookings
 * @returns {Object} { bookings, loading, error, refetch, createBooking, cancelBooking, checkSlots }
 */
export const useTouristBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getMyBookings();
      setBookings(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData) => {
    try {
      setError(null);
      
      // Client-side validation
      if (!bookingData.activityId || !bookingData.bookingDate || !bookingData.numberOfParticipants) {
        throw new Error('Activity ID, booking date, and number of participants are required');
      }
      
      const response = await touristService.createBooking(bookingData);
      await fetchBookings(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      setError(null);
      await touristService.cancelBooking(bookingId);
      await fetchBookings(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchBookings]);

  const checkSlots = useCallback(async (activityId, date) => {
    try {
      const response = await touristService.checkAvailableSlots(activityId, date);
      return response.data.data;
    } catch (err) {
      throw new Error(handleTouristApiError(err));
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { 
    bookings, 
    loading, 
    error, 
    refetch: fetchBookings, 
    createBooking, 
    cancelBooking,
    checkSlots 
  };
};

// ============================================================================
// EVENT REGISTRATION HOOKS
// ============================================================================

/**
 * Hook for managing event registrations
 * @returns {Object} { registrations, loading, error, refetch, registerForEvent, modifyRegistration, cancelRegistration }
 */
export const useTouristEventRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getMyEventRegistrations();
      setRegistrations(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const registerForEvent = useCallback(async (registrationData) => {
    try {
      setError(null);
      
      // Client-side validation
      if (!registrationData.eventId || !registrationData.numberOfParticipants) {
        throw new Error('Event ID and number of participants are required');
      }
      
      const response = await touristService.registerForEvent(registrationData);
      await fetchRegistrations(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchRegistrations]);

  const modifyRegistration = useCallback(async (registrationId, updateData) => {
    try {
      setError(null);
      
      // Client-side validation
      if (!registrationId || !updateData.numberOfParticipants) {
        throw new Error('Registration ID and number of participants are required');
      }
      
      await touristService.modifyEventRegistration(registrationId, updateData);
      await fetchRegistrations(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchRegistrations]);

  const cancelRegistration = useCallback(async (registrationId) => {
    try {
      setError(null);
      await touristService.cancelEventRegistration(registrationId);
      await fetchRegistrations(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchRegistrations]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { 
    registrations, 
    loading, 
    error, 
    refetch: fetchRegistrations, 
    registerForEvent, 
    modifyRegistration, 
    cancelRegistration 
  };
};

// ============================================================================
// DONATION HOOKS
// ============================================================================

/**
 * Hook for managing donations
 * @returns {Object} { donations, loading, error, refetch, createDonation, updateMessage }
 */
export const useTouristDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getMyDonations();
      setDonations(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createDonation = useCallback(async (donationData) => {
    try {
      setError(null);
      const response = await touristService.createDonation(donationData);
      await fetchDonations(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchDonations]);

  const updateMessage = useCallback(async (donationId, message) => {
    try {
      setError(null);
      await touristService.updateDonationMessage(donationId, message);
      await fetchDonations(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchDonations]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return { 
    donations, 
    loading, 
    error, 
    refetch: fetchDonations, 
    createDonation, 
    updateMessage 
  };
};

// ============================================================================
// FEEDBACK HOOKS
// ============================================================================

/**
 * Hook for managing feedback
 * @returns {Object} { myFeedback, allFeedback, loading, error, refetch, createFeedback, updateFeedback, deleteFeedback, loadAllFeedback }
 */
export const useTouristFeedback = () => {
  const [myFeedback, setMyFeedback] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  const fetchMyFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getMyFeedback();
      setMyFeedback(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllFeedback = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getAllFeedback(page, limit);
      setAllFeedback(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createFeedback = useCallback(async (feedbackData) => {
    try {
      setError(null);
      const response = await touristService.createFeedback(feedbackData);
      await fetchMyFeedback(); // Refresh my feedback list
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchMyFeedback]);

  const updateFeedback = useCallback(async (feedbackId, updateData) => {
    try {
      setError(null);
      await touristService.updateFeedback(feedbackId, updateData);
      await fetchMyFeedback(); // Refresh my feedback list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchMyFeedback]);

  const deleteFeedback = useCallback(async (feedbackId) => {
    try {
      setError(null);
      await touristService.deleteFeedback(feedbackId);
      await fetchMyFeedback(); // Refresh my feedback list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchMyFeedback]);

  useEffect(() => {
    fetchMyFeedback();
  }, [fetchMyFeedback]);

  return { 
    myFeedback, 
    allFeedback,
    loading, 
    error, 
    pagination,
    refetch: fetchMyFeedback, 
    createFeedback, 
    updateFeedback, 
    deleteFeedback,
    loadAllFeedback 
  };
};

// ============================================================================
// COMPLAINT HOOKS
// ============================================================================

/**
 * Hook for managing complaints
 * @returns {Object} { complaints, loading, error, refetch, createComplaint, updateComplaint, deleteComplaint }
 */
export const useTouristComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.getMyComplaints();
      setComplaints(response.data.data);
    } catch (err) {
      setError(handleTouristApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createComplaint = useCallback(async (complaintData) => {
    try {
      setError(null);
      const response = await touristService.createComplaint(complaintData);
      await fetchComplaints(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchComplaints]);

  const updateComplaint = useCallback(async (complaintId, updateData) => {
    try {
      setError(null);
      await touristService.updateComplaint(complaintId, updateData);
      await fetchComplaints(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchComplaints]);

  const deleteComplaint = useCallback(async (complaintId) => {
    try {
      setError(null);
      await touristService.deleteComplaint(complaintId);
      await fetchComplaints(); // Refresh list
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchComplaints]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { 
    complaints, 
    loading, 
    error, 
    refetch: fetchComplaints, 
    createComplaint, 
    updateComplaint, 
    deleteComplaint 
  };
};

// ============================================================================
// EMERGENCY HOOK
// ============================================================================

/**
 * Hook for emergency reporting
 * @returns {Object} { reportEmergency, loading, error }
 */
export const useTouristEmergency = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportEmergency = useCallback(async (emergencyData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await touristService.reportEmergency(emergencyData);
      return response.data;
    } catch (err) {
      const errorMessage = handleTouristApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { reportEmergency, loading, error };
};

// ============================================================================
// COMBINED TOURIST DATA HOOK
// ============================================================================

/**
 * Hook that provides all tourist data in one place
 * Useful for dashboard or profile pages
 * @returns {Object} Combined tourist data and functions
 */
export const useTouristData = () => {
  const dashboard = useTouristDashboard();
  const bookings = useTouristBookings();
  const registrations = useTouristEventRegistrations();
  const donations = useTouristDonations();
  const feedback = useTouristFeedback();
  const complaints = useTouristComplaints();
  const emergency = useTouristEmergency();

  const isLoading = dashboard.loading || bookings.loading || registrations.loading || 
                   donations.loading || feedback.loading || complaints.loading;

  const hasError = dashboard.error || bookings.error || registrations.error || 
                  donations.error || feedback.error || complaints.error;

  const refetchAll = useCallback(() => {
    dashboard.refetch();
    bookings.refetch();
    registrations.refetch();
    donations.refetch();
    feedback.refetch();
    complaints.refetch();
  }, [dashboard, bookings, registrations, donations, feedback, complaints]);

  return {
    dashboard: dashboard.data,
    bookings: bookings.bookings,
    registrations: registrations.registrations,
    donations: donations.donations,
    feedback: feedback.myFeedback,
    complaints: complaints.complaints,
    
    // Loading states
    isLoading,
    hasError,
    
    // Actions
    actions: {
      // Booking actions
      createBooking: bookings.createBooking,
      cancelBooking: bookings.cancelBooking,
      checkSlots: bookings.checkSlots,
      
      // Event actions
      registerForEvent: registrations.registerForEvent,
      modifyRegistration: registrations.modifyRegistration,
      cancelRegistration: registrations.cancelRegistration,
      
      // Donation actions
      createDonation: donations.createDonation,
      updateDonationMessage: donations.updateMessage,
      
      // Feedback actions
      createFeedback: feedback.createFeedback,
      updateFeedback: feedback.updateFeedback,
      deleteFeedback: feedback.deleteFeedback,
      loadAllFeedback: feedback.loadAllFeedback,
      
      // Complaint actions
      createComplaint: complaints.createComplaint,
      updateComplaint: complaints.updateComplaint,
      deleteComplaint: complaints.deleteComplaint,
      
      // Emergency action
      reportEmergency: emergency.reportEmergency,
      
      // Refresh all data
      refetchAll,
    }
  };
};