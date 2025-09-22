import React, { useState, useEffect } from 'react';
import {
  useTouristDashboard,
  useTouristBookings,
  useTouristEventRegistrations,
  useTouristDonations,
  useTouristFeedback,
  useTouristComplaints,
  useTouristEmergency,
  useTouristData
} from '../hooks/useTourist.js';
import { touristConfig } from '../services/touristService.js';

/**
 * Example Tourist Dashboard Component
 * Demonstrates how to use the tourist hooks and services
 */
const TouristDashboard = () => {
  // Using the combined hook for all tourist data
  const {
    dashboard,
    bookings,
    registrations,
    donations,
    feedback,
    complaints,
    isLoading,
    hasError,
    actions
  } = useTouristData();

  if (isLoading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (hasError) {
    return <div className="error">Error loading dashboard data</div>;
  }

  return (
    <div className="tourist-dashboard">
      <h1>Welcome to your Wildlife Lanka Dashboard</h1>
      
      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Bookings</h3>
          <p>{dashboard?.stats?.totalBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Event Registrations</h3>
          <p>{dashboard?.stats?.totalRegistrations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Donations</h3>
          <p>{dashboard?.stats?.totalDonations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Feedback</h3>
          <p>{dashboard?.stats?.totalFeedback || 0}</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="recent-bookings">
        <h2>Recent Bookings</h2>
        {bookings?.slice(0, 3).map(booking => (
          <div key={booking._id} className="booking-card">
            <h4>{booking.activityId?.name}</h4>
            <p>Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p>Status: {booking.status}</p>
            <p>Participants: {booking.numberOfParticipants}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example Activity Booking Component
 */
const ActivityBooking = ({ activityId, onBookingComplete }) => {
  const { createBooking, checkSlots, loading, error } = useTouristBookings();
  const [bookingData, setBookingData] = useState({
    activityId: activityId,
    bookingDate: '',
    numberOfParticipants: 1,
    requestTourGuide: false,
  });
  const [availableSlots, setAvailableSlots] = useState(null);
  const [checkingSlots, setCheckingSlots] = useState(false);

  // Check available slots when date changes
  useEffect(() => {
    if (bookingData.bookingDate && activityId) {
      handleCheckSlots();
    }
  }, [bookingData.bookingDate, activityId]);

  const handleCheckSlots = async () => {
    try {
      setCheckingSlots(true);
      const slots = await checkSlots(activityId, bookingData.bookingDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error checking slots:', err);
    } finally {
      setCheckingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure numberOfParticipants is a number
      const bookingDataToSubmit = {
        ...bookingData,
        numberOfParticipants: parseInt(bookingData.numberOfParticipants)
      };
      
      const result = await createBooking(bookingDataToSubmit);
      alert('Booking created successfully! Please proceed with payment.');
      onBookingComplete?.(result);
    } catch (err) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="activity-booking">
      <h2>Book Activity</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Booking Date:</label>
          <input
            type="date"
            name="bookingDate"
            value={bookingData.bookingDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {checkingSlots && <p>Checking available slots...</p>}
        
        {availableSlots && (
          <div className="slots-info">
            <p>Available Slots: {availableSlots.availableSlots}</p>
            <p>Price per person: LKR {availableSlots.price}</p>
          </div>
        )}

        <div className="form-group">
          <label>Number of Participants:</label>
          <select
            name="numberOfParticipants"
            value={bookingData.numberOfParticipants}
            onChange={handleInputChange}
            required
          >
            {[...Array(Math.min(20, availableSlots?.availableSlots || 20))].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="requestTourGuide"
              checked={bookingData.requestTourGuide}
              onChange={handleInputChange}
            />
            Request Tour Guide (+LKR 1500)
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || !availableSlots || availableSlots.availableSlots < bookingData.numberOfParticipants}
        >
          {loading ? 'Booking...' : 'Book Now'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

/**
 * Example Event Registration Component
 */
const EventRegistration = ({ eventId, onRegistrationComplete }) => {
  const { registerForEvent, loading, error } = useTouristEventRegistrations();
  const [participants, setParticipants] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const registrationData = {
        eventId,
        numberOfParticipants: parseInt(participants) // Ensure it's a number
      };
      
      const result = await registerForEvent(registrationData);
      alert('Event registration successful!');
      onRegistrationComplete?.(result);
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  return (
    <div className="event-registration">
      <h2>Register for Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Number of Participants:</label>
          <select
            value={participants}
            onChange={(e) => setParticipants(parseInt(e.target.value))}
            required
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

/**
 * Example Donation Component
 */
const DonationForm = ({ onDonationComplete }) => {
  const { createDonation, loading, error } = useTouristDonations();
  const [donationData, setDonationData] = useState({
    amount: '',
    message: '',
    category: touristConfig.donationCategories[0],
    isAnonymous: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createDonation({
        ...donationData,
        amount: parseFloat(donationData.amount)
      });
      alert('Donation created successfully!');
      onDonationComplete?.(result);
      setDonationData({ amount: '', message: '', category: touristConfig.donationCategories[0], isAnonymous: false });
    } catch (err) {
      alert(`Donation failed: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="donation-form">
      <h2>Make a Donation</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount (LKR):</label>
          <input
            type="number"
            name="amount"
            value={donationData.amount}
            onChange={handleInputChange}
            min="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={donationData.category}
            onChange={handleInputChange}
          >
            {touristConfig.donationCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Personal Message (optional):</label>
          <textarea
            name="message"
            value={donationData.message}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="isAnonymous"
              checked={donationData.isAnonymous}
              onChange={handleInputChange}
            />
            Make this donation anonymous
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Donate'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

/**
 * Example Feedback Component
 */
const FeedbackForm = ({ onFeedbackSubmitted }) => {
  const { createFeedback, loading, error } = useTouristFeedback();
  const [feedbackData, setFeedbackData] = useState({
    message: '',
    tourGuideName: '',
    eventType: '',
    activityType: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createFeedback(feedbackData);
      alert('Feedback submitted successfully!');
      onFeedbackSubmitted?.(result);
      setFeedbackData({ message: '', tourGuideName: '', eventType: '', activityType: '' });
    } catch (err) {
      alert(`Feedback submission failed: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="feedback-form">
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Feedback Message:</label>
          <textarea
            name="message"
            value={feedbackData.message}
            onChange={handleInputChange}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label>Tour Guide Name (optional):</label>
          <input
            type="text"
            name="tourGuideName"
            value={feedbackData.tourGuideName}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Activity Type (optional):</label>
          <select
            name="activityType"
            value={feedbackData.activityType}
            onChange={handleInputChange}
          >
            <option value="">Select Activity Type</option>
            {touristConfig.activityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Event Type (optional):</label>
          <select
            name="eventType"
            value={feedbackData.eventType}
            onChange={handleInputChange}
          >
            <option value="">Select Event Type</option>
            {touristConfig.eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

/**
 * Example Emergency Report Component
 */
const EmergencyReport = ({ onEmergencyReported }) => {
  const { reportEmergency, loading, error } = useTouristEmergency();
  const [emergencyData, setEmergencyData] = useState({
    emergencyType: touristConfig.emergencyTypes[0],
    description: '',
    location: '',
    severity: 'Medium',
    contactNumber: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await reportEmergency(emergencyData);
      alert('Emergency reported successfully! Emergency officers have been notified.');
      onEmergencyReported?.(result);
      setEmergencyData({
        emergencyType: touristConfig.emergencyTypes[0],
        description: '',
        location: '',
        severity: 'Medium',
        contactNumber: ''
      });
    } catch (err) {
      alert(`Emergency report failed: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmergencyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="emergency-report">
      <h2 className="emergency-title">🚨 Report Emergency</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Emergency Type:</label>
          <select
            name="emergencyType"
            value={emergencyData.emergencyType}
            onChange={handleInputChange}
            required
          >
            {touristConfig.emergencyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Severity:</label>
          <select
            name="severity"
            value={emergencyData.severity}
            onChange={handleInputChange}
            required
          >
            {touristConfig.emergencySeverityLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={emergencyData.description}
            onChange={handleInputChange}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={emergencyData.location}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Contact Number:</label>
          <input
            type="tel"
            name="contactNumber"
            value={emergencyData.contactNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="emergency-button">
          {loading ? 'Reporting...' : '🚨 Report Emergency'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export {
  TouristDashboard,
  ActivityBooking,
  EventRegistration,
  DonationForm,
  FeedbackForm,
  EmergencyReport
};