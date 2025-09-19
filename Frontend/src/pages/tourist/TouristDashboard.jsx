import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const TouristDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);

  // Form states
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    participants: 1,
    requestGuide: false
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationForm, setRegistrationForm] = useState({
    participants: 1
  });
  const [donationForm, setDonationForm] = useState({
    amount: '',
    message: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    rating: 5
  });
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    description: ''
  });
  const [emergencyForm, setEmergencyForm] = useState({
    type: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        activitiesRes,
        eventsRes,
        bookingsRes,
        registrationsRes,
        donationsRes,
        feedbackRes,
        complaintsRes
      ] = await Promise.all([
        protectedApi.getActivities(),
        protectedApi.getEvents(),
        protectedApi.getMyBookings(),
        protectedApi.getMyEventRegistrations(),
        protectedApi.getMyDonations(),
        protectedApi.getMyFeedback(),
        protectedApi.getMyComplaints()
      ]);

      setActivities(activitiesRes.data || []);
      setEvents(eventsRes.data || []);
      setMyBookings(bookingsRes.data || []);
      setMyRegistrations(registrationsRes.data || []);
      setMyDonations(donationsRes.data || []);
      setMyFeedback(feedbackRes.data || []);
      setMyComplaints(complaintsRes.data || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityBooking = async (e) => {
    e.preventDefault();
    if (!selectedActivity) return;

    try {
      await protectedApi.bookActivity({
        activityId: selectedActivity._id,
        ...bookingForm
      });
      setSelectedActivity(null);
      setBookingForm({ date: '', participants: 1, requestGuide: false });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to book activity. Please try again.');
    }
  };

  const handleEventRegistration = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      await protectedApi.registerForEvent({
        eventId: selectedEvent._id,
        ...registrationForm
      });
      setSelectedEvent(null);
      setRegistrationForm({ participants: 1 });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to register for event. Please try again.');
    }
  };

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.makeDonation(donationForm);
      setDonationForm({ amount: '', message: '' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to process donation. Please try again.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.submitFeedback(feedbackForm);
      setFeedbackForm({ subject: '', message: '', rating: 5 });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to submit feedback. Please try again.');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.submitComplaint(complaintForm);
      setComplaintForm({ subject: '', description: '' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to submit complaint. Please try again.');
    }
  };

  const handleEmergencyReport = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.reportEmergency(emergencyForm);
      setEmergencyForm({ type: '', description: '', location: '' });
      setError(null);
      alert('Emergency reported successfully. Help is on the way!');
    } catch (error) {
      setError('Failed to report emergency. Please try calling directly.');
    }
  };

  const updateEventRegistration = async (registrationId, participants) => {
    try {
      await protectedApi.updateEventRegistration(registrationId, { participants });
      await fetchDashboardData();
    } catch (error) {
      setError('Failed to update registration.');
    }
  };

  const cancelEventRegistration = async (registrationId) => {
    try {
      await protectedApi.cancelEventRegistration(registrationId);
      await fetchDashboardData();
    } catch (error) {
      setError('Failed to cancel registration.');
    }
  };

  const updateDonationMessage = async (donationId, message) => {
    try {
      await protectedApi.updateDonationMessage(donationId, { message });
      await fetchDashboardData();
    } catch (error) {
      setError('Failed to update donation message.');
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      await protectedApi.deleteFeedback(feedbackId);
      await fetchDashboardData();
    } catch (error) {
      setError('Failed to delete feedback.');
    }
  };

  const deleteComplaint = async (complaintId) => {
    try {
      await protectedApi.deleteComplaint(complaintId);
      await fetchDashboardData();
    } catch (error) {
      setError('Failed to delete complaint.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['tourist']}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your portal...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['tourist']}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 pt-32 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white mb-8">
              <h1 className="text-3xl font-bold">Tourist Portal</h1>
              <p className="text-blue-100 mt-2">Welcome to Wild Lanka Go, {user?.name}!</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">My Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">{myBookings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Event Registrations</p>
                    <p className="text-2xl font-semibold text-gray-900">{myRegistrations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Donations</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${myDonations.reduce((sum, d) => sum + d.amount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Emergency</p>
                    <p className="text-xl font-semibold text-red-600">REPORT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
                  {[
                    { id: 'overview', name: 'Overview', icon: '🏠' },
                    { id: 'activities', name: 'Book Activities', icon: '🏃' },
                    { id: 'events', name: 'Register Events', icon: '🎪' },
                    { id: 'donations', name: 'Donations', icon: '💝' },
                    { id: 'feedback', name: 'Feedback', icon: '💬' },
                    { id: 'complaints', name: 'Complaints', icon: '📝' },
                    { id: 'emergency', name: 'Emergency', icon: '🚨' },
                    { id: 'myBookings', name: 'My Bookings', icon: '📅' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to Your Portal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => setActiveTab('activities')}
                            className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                          >
                            🏃 Book New Activity
                          </button>
                          <button
                            onClick={() => setActiveTab('events')}
                            className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                          >
                            🎪 Register for Event
                          </button>
                          <button
                            onClick={() => setActiveTab('donations')}
                            className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                          >
                            💝 Make a Donation
                          </button>
                          <button
                            onClick={() => setActiveTab('emergency')}
                            className="block w-full text-left px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                          >
                            🚨 Report Emergency
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          {myBookings.slice(0, 3).map((booking) => (
                            <div key={booking._id} className="flex justify-between">
                              <span>🏃 {booking.activityName}</span>
                              <span>{new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                          ))}
                          {myDonations.slice(0, 2).map((donation) => (
                            <div key={donation._id} className="flex justify-between">
                              <span>💝 Donation</span>
                              <span>${donation.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Available Activities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activities.map((activity) => (
                        <div key={activity._id} className="border border-gray-200 rounded-lg p-4">
                          {activity.image && (
                            <img
                              src={activity.image}
                              alt={activity.title}
                              className="w-full h-40 object-cover rounded-md mb-3"
                            />
                          )}
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="font-bold text-green-600">${activity.price}</span>
                            <span className="text-sm text-gray-500">{activity.duration}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Max participants: {activity.maxParticipants}
                          </div>
                          <button
                            onClick={() => setSelectedActivity(activity)}
                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Book Now
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Booking Modal */}
                    {selectedActivity && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Book: {selectedActivity.title}
                          </h3>
                          <form onSubmit={handleActivityBooking}>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Date
                              </label>
                              <input
                                type="date"
                                value={bookingForm.date}
                                onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Participants
                              </label>
                              <input
                                type="number"
                                value={bookingForm.participants}
                                onChange={(e) => setBookingForm({...bookingForm, participants: parseInt(e.target.value)})}
                                min="1"
                                max={selectedActivity.maxParticipants}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={bookingForm.requestGuide}
                                  onChange={(e) => setBookingForm({...bookingForm, requestGuide: e.target.checked})}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Request Tour Guide (+$25)</span>
                              </label>
                            </div>
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <div className="text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Activity Price:</span>
                                  <span>${selectedActivity.price} × {bookingForm.participants}</span>
                                </div>
                                {bookingForm.requestGuide && (
                                  <div className="flex justify-between">
                                    <span>Tour Guide:</span>
                                    <span>$25</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold border-t pt-2">
                                  <span>Total:</span>
                                  <span>
                                    ${(selectedActivity.price * bookingForm.participants) + (bookingForm.requestGuide ? 25 : 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Important: Once confirmed, bookings cannot be updated or cancelled.
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={() => setSelectedActivity(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Confirm Booking
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4">
                          {event.image && (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-40 object-cover rounded-md mb-3"
                            />
                          )}
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="mt-3 space-y-1 text-sm text-gray-500">
                            <div>📅 {new Date(event.date).toLocaleDateString()}</div>
                            <div>🕒 {event.time}</div>
                            <div>📍 {event.location}</div>
                            <div>👥 {event.availableSlots} slots available</div>
                            <div className="font-bold text-green-600">${event.price}</div>
                          </div>
                          <button
                            onClick={() => setSelectedEvent(event)}
                            disabled={event.availableSlots === 0}
                            className={`mt-3 w-full px-4 py-2 rounded-md ${
                              event.availableSlots === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {event.availableSlots === 0 ? 'Fully Booked' : 'Register Now'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Event Registration Modal */}
                    {selectedEvent && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Register for: {selectedEvent.title}
                          </h3>
                          <form onSubmit={handleEventRegistration}>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Participants
                              </label>
                              <input
                                type="number"
                                value={registrationForm.participants}
                                onChange={(e) => setRegistrationForm({...registrationForm, participants: parseInt(e.target.value)})}
                                min="1"
                                max={selectedEvent.availableSlots}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <div className="text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Price per person:</span>
                                  <span>${selectedEvent.price}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Participants:</span>
                                  <span>{registrationForm.participants}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-2">
                                  <span>Total:</span>
                                  <span>${selectedEvent.price * registrationForm.participants}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                              <p className="text-sm text-green-800">
                                ✅ You can modify or cancel this registration after confirmation.
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                              >
                                Register
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Donations Tab */}
                {activeTab === 'donations' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Make Donation */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Make a Donation</h3>
                        <form onSubmit={handleDonation} className="bg-gray-50 rounded-lg p-6">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Donation Amount ($)
                            </label>
                            <input
                              type="number"
                              value={donationForm.amount}
                              onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                              min="1"
                              step="0.01"
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Enter amount"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Message (Optional)
                            </label>
                            <textarea
                              value={donationForm.message}
                              onChange={(e) => setDonationForm({...donationForm, message: e.target.value})}
                              rows="3"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Leave a message with your donation..."
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Donate Now
                          </button>
                        </form>
                      </div>

                      {/* Donation History */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Donation History</h3>
                        <div className="space-y-4">
                          {myDonations.map((donation) => (
                            <div key={donation._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">${donation.amount}</div>
                                  <div className="text-sm text-gray-600 mt-1">{donation.message}</div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    {new Date(donation.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const newMessage = prompt('Update donation message:', donation.message);
                                    if (newMessage !== null) {
                                      updateDonationMessage(donation._id, newMessage);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit Message
                                </button>
                              </div>
                            </div>
                          ))}
                          {myDonations.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No donations yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Submit Feedback */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Feedback</h3>
                        <form onSubmit={handleFeedbackSubmit} className="bg-gray-50 rounded-lg p-6">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={feedbackForm.subject}
                              onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Feedback subject"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rating
                            </label>
                            <select
                              value={feedbackForm.rating}
                              onChange={(e) => setFeedbackForm({...feedbackForm, rating: parseInt(e.target.value)})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                              <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                              <option value={4}>⭐⭐⭐⭐ Good</option>
                              <option value={3}>⭐⭐⭐ Average</option>
                              <option value={2}>⭐⭐ Poor</option>
                              <option value={1}>⭐ Very Poor</option>
                            </select>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Message
                            </label>
                            <textarea
                              value={feedbackForm.message}
                              onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                              rows="4"
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Share your experience..."
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Submit Feedback
                          </button>
                        </form>
                      </div>

                      {/* My Feedback */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">My Feedback</h3>
                        <div className="space-y-4">
                          {myFeedback.map((feedback) => (
                            <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900">{feedback.subject}</h4>
                                    <span className="text-sm">
                                      {'⭐'.repeat(feedback.rating)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{feedback.message}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {new Date(feedback.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      // Edit feedback logic
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteFeedback(feedback._id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {myFeedback.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No feedback submitted yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complaints Tab */}
                {activeTab === 'complaints' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Submit Complaint */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Complaint</h3>
                        <form onSubmit={handleComplaintSubmit} className="bg-gray-50 rounded-lg p-6">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={complaintForm.subject}
                              onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Complaint subject"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={complaintForm.description}
                              onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                              rows="4"
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Describe your complaint in detail..."
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Submit Complaint
                          </button>
                        </form>
                      </div>

                      {/* My Complaints */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">My Complaints</h3>
                        <div className="space-y-4">
                          {myComplaints.map((complaint) => (
                            <div key={complaint._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{complaint.subject}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      complaint.status === 'in-review' ? 'bg-blue-100 text-blue-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {complaint.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(complaint.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      // Edit complaint logic
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteComplaint(complaint._id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {myComplaints.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No complaints submitted</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Tab */}
                {activeTab === 'emergency' && (
                  <div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center">
                        <div className="text-red-600 mr-3">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-800">Emergency Reporting</h3>
                          <p className="text-red-700 text-sm">
                            For life-threatening emergencies, call emergency services immediately. Use this form for park-related incidents.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-md mx-auto">
                      <form onSubmit={handleEmergencyReport} className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Emergency</h3>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Type
                          </label>
                          <select
                            value={emergencyForm.type}
                            onChange={(e) => setEmergencyForm({...emergencyForm, type: e.target.value})}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          >
                            <option value="">Select type</option>
                            <option value="medical">Medical Emergency</option>
                            <option value="animal">Animal Incident</option>
                            <option value="fire">Fire</option>
                            <option value="accident">Accident</option>
                            <option value="lost">Lost Person</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            value={emergencyForm.location}
                            onChange={(e) => setEmergencyForm({...emergencyForm, location: e.target.value})}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Describe your current location"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={emergencyForm.description}
                            onChange={(e) => setEmergencyForm({...emergencyForm, description: e.target.value})}
                            rows="4"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Describe the emergency situation..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                        >
                          🚨 REPORT EMERGENCY
                        </button>
                      </form>

                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Emergency Contacts</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <div>🚨 Emergency Services: 911</div>
                          <div>🏥 Park Medical: (555) 123-4567</div>
                          <div>🐾 Wildlife Emergency: (555) 123-4568</div>
                          <div>🔥 Fire Department: (555) 123-4569</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* My Bookings Tab */}
                {activeTab === 'myBookings' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">My Bookings & Registrations</h3>

                    {/* Activity Bookings */}
                    <div className="mb-8">
                      <h4 className="font-medium text-gray-900 mb-3">Activity Bookings</h4>
                      <div className="space-y-4">
                        {myBookings.map((booking) => (
                          <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{booking.activityName}</h5>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <div>📅 {new Date(booking.date).toLocaleDateString()}</div>
                                  <div>👥 {booking.participants} participants</div>
                                  <div>💰 ${booking.totalAmount}</div>
                                  {booking.guideRequested && (
                                    <div>🎯 Tour guide requested</div>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {myBookings.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No activity bookings yet</p>
                        )}
                      </div>
                    </div>

                    {/* Event Registrations */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Event Registrations</h4>
                      <div className="space-y-4">
                        {myRegistrations.map((registration) => (
                          <div key={registration._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{registration.eventName}</h5>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <div>📅 {new Date(registration.eventDate).toLocaleDateString()}</div>
                                  <div>👥 {registration.participants} participants</div>
                                  <div>💰 ${registration.totalAmount}</div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {registration.status.toUpperCase()}
                                </span>
                                <button
                                  onClick={() => {
                                    const newParticipants = prompt('Update participants:', registration.participants);
                                    if (newParticipants && newParticipants !== registration.participants.toString()) {
                                      updateEventRegistration(registration._id, parseInt(newParticipants));
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to cancel this registration?')) {
                                      cancelEventRegistration(registration._id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {myRegistrations.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No event registrations yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default TouristDashboard;