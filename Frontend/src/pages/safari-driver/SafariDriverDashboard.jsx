import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const SafariDriverDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [profile, setProfile] = useState(null);
  const [assignedTours, setAssignedTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [tourHistory, setTourHistory] = useState([]);
  const [ratings, setRatings] = useState({ average: 0, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [fuelClaims, setFuelClaims] = useState([]);
  const [odometerReadings, setOdometerReadings] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);

  // Form states
  const [rejectionForm, setRejectionForm] = useState({
    tourId: '',
    reason: ''
  });
  const [odometerForm, setOdometerForm] = useState({
    reading: '',
    image: null,
    type: 'start' // start or end
  });
  const [fuelClaimForm, setFuelClaimForm] = useState({
    tourIds: [],
    claimType: 'per-tour' // per-tour, weekly, monthly
  });

  // Map and location refs
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    if (navigator.geolocation) {
      startLocationTracking();
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          setCurrentLocation(location);
          
          // Update location for active tour
          if (activeTour) {
            protectedApi.updateDriverLocation(activeTour._id, location);
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        profileRes,
        toursRes,
        historyRes,
        ratingsRes,
        reviewsRes,
        claimsRes,
        odometerRes
      ] = await Promise.all([
        protectedApi.getDriverProfile(),
        protectedApi.getDriverAssignedTours(),
        protectedApi.getDriverTourHistory(),
        protectedApi.getDriverRatings(),
        protectedApi.getDriverReviews(),
        protectedApi.getFuelClaims(),
        protectedApi.uploadOdometerReading() // This will be a get method
      ]);

      setProfile(profileRes.data);
      setAssignedTours(toursRes.data || []);
      setTourHistory(historyRes.data || []);
      setRatings(ratingsRes.data || { average: 0, total: 0 });
      setReviews(reviewsRes.data || []);
      setFuelClaims(claimsRes.data || []);
      setOdometerReadings(odometerRes.data || []);

      // Check for active tour
      const active = (toursRes.data || []).find(tour => tour.status === 'in-progress');
      setActiveTour(active || null);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const acceptTour = async (tourId) => {
    try {
      if (!odometerForm.reading || !odometerForm.image) {
        setError('Please provide odometer reading and photo before accepting the tour.');
        return;
      }

      const formData = new FormData();
      formData.append('reading', odometerForm.reading);
      formData.append('image', odometerForm.image);

      await protectedApi.acceptDriverTour(tourId, formData);
      setOdometerForm({ reading: '', image: null, type: 'start' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      console.error('Failed to accept tour:', error);
      setError('Failed to accept tour. Please try again.');
    }
  };

  const rejectTour = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.rejectDriverTour(rejectionForm.tourId, { 
        reason: rejectionForm.reason,
        notifyOfficer: true
      });
      setRejectionForm({ tourId: '', reason: '' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      console.error('Failed to reject tour:', error);
      setError('Failed to reject tour. Please try again.');
    }
  };

  const submitOdometerReading = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('reading', odometerForm.reading);
      formData.append('type', odometerForm.type);
      if (odometerForm.image) {
        formData.append('image', odometerForm.image);
      }

      await protectedApi.uploadOdometerReading(activeTour._id, odometerForm.type, formData);
      setOdometerForm({ reading: '', image: null, type: 'start' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      console.error('Failed to submit odometer reading:', error);
      setError('Failed to submit odometer reading.');
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      // For ending tours, require end odometer reading
      if (status === 'completed' && (!odometerForm.reading || !odometerForm.image)) {
        setError('Please submit end odometer reading before completing the tour.');
        setOdometerForm({...odometerForm, type: 'end'});
        return;
      }

      let additionalData = {};
      if (status === 'completed' && odometerForm.reading) {
        additionalData.endOdometerReading = odometerForm.reading;
        additionalData.endOdometerImage = odometerForm.image;
      }

      await protectedApi.updateDriverTourStatus(tourId, status, additionalData);
      
      if (status === 'completed') {
        setOdometerForm({ reading: '', image: null, type: 'start' });
      }
      
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      console.error('Failed to update tour status:', error);
      setError(`Failed to update tour status to ${status}.`);
    }
  };

  const submitFuelClaim = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.submitFuelClaim(fuelClaimForm);
      setFuelClaimForm({ tourIds: [], claimType: 'per-tour' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to submit fuel claim.');
    }
  };

  const generateReport = async (type) => {
    try {
      const response = await protectedApi.generateDriverReport(type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `driver-${type}-report.pdf`;
      a.click();
    } catch (error) {
      setError(`Failed to generate ${type} report.`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['safariDriver']}>
        <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['safariDriver']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        <div className="flex-1 pt-32 pb-16">
          <div className="container mx-auto px-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Active Tour Alert */}
            {activeTour && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">Active Tour in Progress</h3>
                    <p className="text-blue-700 text-sm">
                      {activeTour.activityName} - {activeTour.touristName}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Started: {new Date(activeTour.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOdometerForm({...odometerForm, type: 'end'})}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      📊 End Reading
                    </button>
                    <button
                      onClick={() => updateTourStatus(activeTour._id, 'completed')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      ✅ Complete Tour
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modern 3-Column Layout */}
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 md:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
                    <h1 className="text-lg font-bold">Safari Driver</h1>
                    <p className="text-blue-100 text-sm mt-1">Welcome back, {backendUser?.name || user?.name || 'Driver'}!</p>
                    {profile && (
                      <div className="flex items-center mt-3 space-x-3">
                        <div className="flex items-center">
                          <span className="text-yellow-300 mr-1">⭐</span>
                          <span className="text-xs">{profile.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          profile.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {profile.isAvailable ? 'Available' : 'On Tour'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Menu */}
                  <nav className="space-y-2">
                    {[
                      { id: 'overview', name: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { id: 'assignments', name: 'Tours', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { id: 'odometer', name: 'Odometer', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                      { id: 'fuelClaims', name: 'Fuel Claims', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                      { id: 'map', name: 'Live Map', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                      { id: 'history', name: 'History', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                        </svg>
                        <span className="font-medium">{item.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 md:col-span-7">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    title="Pending Tours"
                    value={assignedTours.filter(t => t.status === 'pending').length}
                    color="blue"
                    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                  <StatCard
                    title="Completed Tours"
                    value={tourHistory.length}
                    color="green"
                    iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <StatCard
                    title="Total Distance"
                    value={`${tourHistory.reduce((sum, tour) => sum + (tour.distance || 0), 0)} km`}
                    color="yellow"
                    iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                  <StatCard
                    title="Fuel Claims"
                    value={fuelClaims.length}
                    color="purple"
                    iconPath="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </div>

                {/* Content Container */}
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Dashboard Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recent Tours</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {tourHistory.slice(0, 5).map((tour) => (
                              <div key={tour._id} className="flex justify-between">
                                <span>🚗 {tour.activityName}</span>
                                <span>{tour.distance} km</span>
                              </div>
                            ))}
                            {tourHistory.length === 0 && (
                              <p className="text-gray-500">No completed tours yet</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => setActiveTab('assignments')}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              📋 View Tour Assignments
                            </button>
                            <button
                              onClick={() => setActiveTab('fuelClaims')}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              ⛽ Submit Fuel Claim
                            </button>
                            <button
                              onClick={() => generateReport('weekly')}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              📄 Generate Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tour Assignments Tab */}
                  {activeTab === 'assignments' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Tour Assignment Panel</h3>
                        {assignedTours.filter(t => t.status === 'pending').length > 0 && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            🔔 {assignedTours.filter(t => t.status === 'pending').length} New Assignment{assignedTours.filter(t => t.status === 'pending').length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {assignedTours.filter(t => t.status === 'pending').map((tour) => (
                          <div key={tour._id} className="border-l-4 border-green-400 bg-green-50 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <h4 className="font-semibold text-gray-900 text-lg">{tour.activityName}</h4>
                                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    NEW ASSIGNMENT
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span><strong>Tourist:</strong> {tour.touristName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <span><strong>Contact:</strong> {tour.touristPhone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-8h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8" />
                                      </svg>
                                      <span><strong>Date:</strong> {new Date(tour.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span><strong>Time:</strong> {tour.time}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span><strong>Participants:</strong> {tour.participants}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span><strong>Pickup:</strong> {tour.pickupLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span><strong>Destination:</strong> {tour.destination}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span className="font-medium text-green-800">Driver Fee: ${tour.driverFee}</span>
                                  </div>
                                </div>

                                {/* Odometer Reading Required for Accept */}
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <h5 className="font-medium text-blue-900 mb-3">📊 Start Odometer Reading Required</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-blue-800 mb-1">
                                        Current Reading (km)
                                      </label>
                                      <input
                                        type="number"
                                        value={odometerForm.reading}
                                        onChange={(e) => setOdometerForm({...odometerForm, reading: e.target.value})}
                                        className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter current reading"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-blue-800 mb-1">
                                        Odometer Photo
                                      </label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setOdometerForm({...odometerForm, image: e.target.files[0]})}
                                        className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <p className="text-xs text-blue-600 mt-2">
                                    📸 Please upload a clear photo of your odometer showing the current reading before accepting the tour.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-3 ml-6">
                                <button
                                  onClick={() => acceptTour(tour._id)}
                                  disabled={!odometerForm.reading || !odometerForm.image}
                                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                                >
                                  ✅ Accept Tour
                                </button>
                                <button
                                  onClick={() => setRejectionForm({ tourId: tour._id, reason: '' })}
                                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                  ❌ Reject Tour
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {assignedTours.filter(t => t.status === 'pending').length === 0 && (
                          <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-500 mb-2">No Pending Assignments</h3>
                            <p className="text-gray-400">You're all caught up! New tour assignments will appear here.</p>
                          </div>
                        )}
                      </div>

                      {/* Rejection Modal */}
                      {rejectionForm.tourId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Tour Assignment</h3>
                            <form onSubmit={rejectTour}>
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Reason for Rejection *
                                </label>
                                <textarea
                                  value={rejectionForm.reason}
                                  onChange={(e) => setRejectionForm({...rejectionForm, reason: e.target.value})}
                                  rows="4"
                                  required
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  placeholder="Please provide a detailed reason (e.g., vehicle maintenance, personal emergency, scheduling conflict)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  The wildlife officer will be notified and will reassign this tour to another driver.
                                </p>
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  type="button"
                                  onClick={() => setRejectionForm({ tourId: '', reason: '' })}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                  Reject & Notify Officer
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Odometer Tab */}
                  {activeTab === 'odometer' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Odometer Management</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Real-time tracking required for active tours
                        </div>
                      </div>

                      {/* Active Tours Requiring Odometer */}
                      <div className="space-y-6">
                        {assignedTours.filter(t => t.status === 'accepted' || t.status === 'in-progress').map((tour) => (
                          <div key={tour._id} className="border-l-4 border-blue-400 bg-blue-50 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{tour.activityName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    tour.status === 'accepted' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                                  }`}>
                                    {tour.status === 'accepted' ? '🟡 READY TO START' : '🟢 IN PROGRESS'}
                                  </span>
                                  <span className="text-sm text-gray-600">Tourist: {tour.touristName}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">📅 {new Date(tour.date).toLocaleDateString()}</div>
                                <div className="text-sm text-gray-600">🕒 {tour.time}</div>
                              </div>
                            </div>

                            {/* Current Readings Display */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-white rounded-lg p-4 border">
                                <div className="text-sm font-medium text-gray-700">Start Reading</div>
                                <div className="text-xl font-bold text-blue-600">
                                  {tour.startReading ? `${tour.startReading} km` : 'Not set'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {tour.startTime ? new Date(tour.startTime).toLocaleTimeString() : 'Pending'}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border">
                                <div className="text-sm font-medium text-gray-700">Current Reading</div>
                                <div className="text-xl font-bold text-orange-600">
                                  {tour.currentReading ? `${tour.currentReading} km` : 'Live tracking'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Last updated: {new Date().toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border">
                                <div className="text-sm font-medium text-gray-700">Distance Covered</div>
                                <div className="text-xl font-bold text-green-600">
                                  {tour.startReading && tour.currentReading 
                                    ? `${(tour.currentReading - tour.startReading).toFixed(1)} km`
                                    : '0.0 km'
                                  }
                                </div>
                                <div className="text-xs text-gray-500">
                                  Fuel cost: ${tour.startReading && tour.currentReading 
                                    ? ((tour.currentReading - tour.startReading) * 0.15).toFixed(2)
                                    : '0.00'
                                  }
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                              {tour.status === 'accepted' && (
                                <button
                                  onClick={() => updateTourStatus(tour._id, 'in-progress')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                  🚗 Start Tour
                                </button>
                              )}
                              
                              {tour.status === 'in-progress' && (
                                <>
                                  <button
                                    onClick={() => setOdometerForm({
                                      ...odometerForm,
                                      tourId: tour._id,
                                      reading: '',
                                      image: null,
                                      type: 'intermediate'
                                    })}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                                  >
                                    📊 Update Reading
                                  </button>
                                  <button
                                    onClick={() => setOdometerForm({
                                      ...odometerForm,
                                      tourId: tour._id,
                                      reading: '',
                                      image: null,
                                      type: 'end'
                                    })}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                  >
                                    🏁 End Tour
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* No Active Tours */}
                        {assignedTours.filter(t => t.status === 'accepted' || t.status === 'in-progress').length === 0 && (
                          <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-500 mb-2">No Active Tours</h3>
                            <p className="text-gray-400">Accept a tour assignment to start tracking odometer readings.</p>
                          </div>
                        )}
                      </div>

                      {/* Odometer History */}
                      <div className="mt-8">
                        <h4 className="font-medium text-gray-900 mb-4">Recent Odometer Readings</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {odometerReadings.map((reading) => (
                                <tr key={reading._id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reading.tourName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      reading.type === 'start' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {reading.type.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reading.reading} km</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(reading.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {reading.distance ? `${reading.distance} km` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Odometer Update Modal */}
                      {odometerForm.tourId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              {odometerForm.type === 'end' ? '🏁 End Tour - Final Reading' : '📊 Update Odometer Reading'}
                            </h3>
                            <form onSubmit={submitOdometerReading}>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Odometer Reading (km) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={odometerForm.reading}
                                    onChange={(e) => setOdometerForm({...odometerForm, reading: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter current reading"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Odometer Photo *
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setOdometerForm({...odometerForm, image: e.target.files[0]})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    📸 Upload a clear photo showing the odometer reading
                                  </p>
                                </div>
                                {odometerForm.type === 'end' && (
                                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2 text-red-800">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                      <span className="font-medium">Final Reading Confirmation</span>
                                    </div>
                                    <p className="text-sm text-red-700 mt-1">
                                      This will mark the tour as completed and cannot be undone. Ensure the reading is accurate for fuel claim calculations.
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-3 mt-6">
                                <button
                                  type="button"
                                  onClick={() => setOdometerForm({ tourId: '', reading: '', image: null, type: '' })}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                                    odometerForm.type === 'end' 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                      : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                                >
                                  {odometerForm.type === 'end' ? '🏁 Complete Tour' : '📊 Update Reading'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fuel Claims Tab */}
                  {activeTab === 'fuelClaims' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Submit Fuel Claim */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Fuel Claim</h3>
                          <form onSubmit={submitFuelClaim} className="bg-gray-50 rounded-lg p-6">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Claim Type
                              </label>
                              <select
                                value={fuelClaimForm.claimType}
                                onChange={(e) => setFuelClaimForm({...fuelClaimForm, claimType: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="per-tour">Per Tour</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                            {fuelClaimForm.claimType === 'per-tour' && (
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Select Tours
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {tourHistory.filter(t => !t.fuelClaimed).map((tour) => (
                                    <label key={tour._id} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={fuelClaimForm.tourIds.includes(tour._id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFuelClaimForm({
                                              ...fuelClaimForm,
                                              tourIds: [...fuelClaimForm.tourIds, tour._id]
                                            });
                                          } else {
                                            setFuelClaimForm({
                                              ...fuelClaimForm,
                                              tourIds: fuelClaimForm.tourIds.filter(id => id !== tour._id)
                                            });
                                          }
                                        }}
                                        className="mr-2"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {tour.activityName} - {tour.distance} km
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              type="submit"
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              ⛽ Submit Claim
                            </button>
                          </form>
                        </div>

                        {/* Fuel Claim Status */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fuel Claim Status</h3>
                          <div className="space-y-4">
                            {fuelClaims.map((claim) => (
                              <div key={claim._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">Claim #{claim.claimNumber}</h4>
                                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                                      <div>💰 Amount: ${claim.amount}</div>
                                      <div>📏 Distance: {claim.totalDistance} km</div>
                                      <div>📅 Submitted: {new Date(claim.createdAt).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {claim.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {fuelClaims.length === 0 && (
                              <p className="text-gray-500 text-center py-8">No fuel claims submitted yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tour History Tab */}
                  {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Tour History</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => generateReport('weekly')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            📄 Weekly Report
                          </button>
                          <button
                            onClick={() => generateReport('monthly')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            📊 Monthly Report
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tourist</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Claim</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tourHistory.map((tour) => (
                              <tr key={tour._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tour.activityName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tour.touristName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(tour.completedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tour.distance} km</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tour.driverFee}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    tour.fuelClaimed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {tour.fuelClaimed ? 'CLAIMED' : 'PENDING'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Real-time Map Tab */}
                  {activeTab === 'map' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Real-time Location Tracking</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-600">
                              {isTracking ? 'Live Tracking Active' : 'Tracking Inactive'}
                            </span>
                          </div>
                          {activeTour && (
                            <button
                              onClick={isTracking ? stopLocationTracking : startLocationTracking}
                              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                                isTracking 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
                            </button>
                          )}
                        </div>
                      </div>

                      {activeTour ? (
                        <div className="space-y-6">
                          {/* Active Tour Info */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-blue-900">{activeTour.activityName}</h4>
                                <div className="text-sm text-blue-700 mt-1">
                                  <div>🧭 Route: {activeTour.pickupLocation} → {activeTour.destination}</div>
                                  <div>👥 Tourists: {activeTour.participants} passengers</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-900">
                                  Status: {activeTour.status === 'in-progress' ? '🟢 In Progress' : '🟡 Ready to Start'}
                                </div>
                                <div className="text-xs text-blue-700">
                                  {isTracking && `Tracking since: ${new Date().toLocaleTimeString()}`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Location Information */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current Location Card */}
                            <div className="bg-white border rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Current Location
                              </h5>
                              {currentLocation.latitude ? (
                                <div className="space-y-2 text-sm">
                                  <div>📍 <strong>Coordinates:</strong></div>
                                  <div className="pl-4 text-gray-600">
                                    Lat: {currentLocation.latitude.toFixed(6)}<br/>
                                    Lng: {currentLocation.longitude.toFixed(6)}
                                  </div>
                                  <div>🎯 <strong>Accuracy:</strong> ±{currentLocation.accuracy?.toFixed(0) || 'N/A'}m</div>
                                  <div>⏰ <strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
                                  {currentLocation.speed && (
                                    <div>🏃 <strong>Speed:</strong> {(currentLocation.speed * 3.6).toFixed(1)} km/h</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm">
                                  {isTracking ? '📡 Getting location...' : '📍 Location not available'}
                                </div>
                              )}
                            </div>

                            {/* Travel Statistics */}
                            <div className="bg-white border rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Tour Progress
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div>⏱️ <strong>Duration:</strong> {
                                  activeTour.startTime 
                                    ? `${Math.floor((Date.now() - new Date(activeTour.startTime)) / 60000)} minutes`
                                    : 'Not started'
                                }</div>
                                <div>🛣️ <strong>Distance:</strong> {
                                  activeTour.startReading && activeTour.currentReading
                                    ? `${(activeTour.currentReading - activeTour.startReading).toFixed(1)} km`
                                    : 'Calculating...'
                                }</div>
                                <div>⛽ <strong>Est. Fuel Cost:</strong> ${
                                  activeTour.startReading && activeTour.currentReading
                                    ? ((activeTour.currentReading - activeTour.startReading) * 0.15).toFixed(2)
                                    : '0.00'
                                }</div>
                                <div>📈 <strong>Route Progress:</strong> 
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500">Estimated 45% complete</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Map Placeholder */}
                          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                              </svg>
                              <h3 className="text-lg font-medium text-gray-500 mb-2">Interactive Map</h3>
                              <p className="text-gray-400 max-w-sm">
                                Real-time route visualization and GPS tracking would be displayed here. 
                                Integration with Google Maps or OpenStreetMap can show live position, route history, and navigation.
                              </p>
                              <div className="mt-4 flex justify-center space-x-3">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                  🗺️ Open in Maps App
                                </button>
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                  📍 Share Location
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Route History */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">📍 Recent Location Updates</h5>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-white rounded p-2">
                                  <div>
                                    <span className="font-medium">Checkpoint {5-i}</span>
                                    <div className="text-gray-500 text-xs">
                                      {(6.9311 + (i * 0.001)).toFixed(6)}, {(79.8612 + (i * 0.001)).toFixed(6)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-600">{new Date(Date.now() - (i * 60000)).toLocaleTimeString()}</div>
                                    <div className="text-xs text-gray-500">{i * 2 + 1} min ago</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-500 mb-2">No Active Tour</h3>
                          <p className="text-gray-400 mb-4">Accept a tour assignment to start real-time location tracking.</p>
                          <button
                            onClick={() => setActiveTab('assignments')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            🎯 View Available Tours
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Profile</h3>
                      {profile && (
                        <div className="max-w-2xl">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <p className="text-gray-900">{profile.fullName}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <p className="text-gray-900">{profile.email}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <p className="text-gray-900">{profile.phone}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                                <p className="text-gray-900">{profile.licenseNumber}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                <p className="text-gray-900">{profile.vehicleType}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                <p className="text-gray-900">{profile.experience} years</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                <p className="text-gray-900">{profile.rating?.toFixed(1) || '0.0'} ⭐</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  profile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {profile.isAvailable ? 'Available' : 'On Tour'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-6">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Edit Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </main>

              {/* RIGHT WIDGETS */}
              <aside className="col-span-12 md:col-span-3">
                <div className="space-y-6">
                  {/* Profile mini */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {(backendUser?.name || user?.name || 'Safari Driver').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'SD'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{backendUser?.name || user?.name || 'Safari Driver'}</div>
                        <div className="text-xs text-gray-500">Safari Driver</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Widget */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Tours</span>
                        <span className="font-medium text-blue-600">{assignedTours.filter(t => t.status === 'pending').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Tours</span>
                        <span className="font-medium text-green-600">{tourHistory.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Distance</span>
                        <span className="font-medium text-yellow-600">{tourHistory.reduce((sum, tour) => sum + (tour.distance || 0), 0)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fuel Claims</span>
                        <span className="font-medium text-purple-600">{fuelClaims.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Tours Alert */}
                  {assignedTours.filter(t => t.status === 'pending').length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm p-5">
                      <h4 className="font-semibold text-yellow-800 mb-3">Pending Tours</h4>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <div>🚗 {assignedTours.filter(t => t.status === 'pending').length} tours awaiting response</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        Review Tours
                      </button>
                    </div>
                  )}

                  {/* Active Tour Status */}
                  {activeTour && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-sm p-5">
                      <h4 className="font-semibold text-blue-800 mb-3">Active Tour</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <div>🎯 {activeTour.activityName}</div>
                        <div>👤 {activeTour.touristName}</div>
                        <div>⏰ Started: {new Date(activeTour.startTime).toLocaleTimeString()}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('odometer')}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        Submit Reading
                      </button>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
                    <div className="space-y-3 text-sm">
                      {tourHistory.slice(0, 3).map((tour) => (
                        <div key={tour._id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Completed {tour.activityName}</span>
                        </div>
                      ))}
                      {assignedTours.filter(t => t.status === 'pending').slice(0, 2).map((tour) => (
                        <div key={tour._id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-600">New assignment: {tour.activityName}</span>
                        </div>
                      ))}
                      {(tourHistory.length === 0 && assignedTours.length === 0) && (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

/* ===== Small UI helpers ===== */
const StatCard = ({ title, value, color = 'blue', iconPath }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center">
        <span className={`p-2 rounded-xl ${colorMap[color]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} /></svg>
        </span>
        <div className="ml-3">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-bold text-gray-800">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default SafariDriverDashboard;