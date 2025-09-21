import React, { useState, useEffect } from 'react';
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
  const [fuelClaims, setFuelClaims] = useState([]);
  const [odometerReadings, setOdometerReadings] = useState([]);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        profileRes,
        toursRes,
        historyRes,
        claimsRes,
        odometerRes
      ] = await Promise.all([
        protectedApi.getDriverProfile(),
        protectedApi.getAssignedTours(),
        protectedApi.getTourHistory(),
        protectedApi.getFuelClaims(),
        protectedApi.getOdometerReadings()
      ]);

      setProfile(profileRes.data);
      setAssignedTours(toursRes.data || []);
      setTourHistory(historyRes.data || []);
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
      await protectedApi.acceptTour(tourId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to accept tour. Please try again.');
    }
  };

  const rejectTour = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.rejectTour(rejectionForm.tourId, { reason: rejectionForm.reason });
      setRejectionForm({ tourId: '', reason: '' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to reject tour. Please try again.');
    }
  };

  const submitOdometerReading = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('reading', odometerForm.reading);
      formData.append('type', odometerForm.type);
      formData.append('tourId', activeTour._id);
      if (odometerForm.image) {
        formData.append('image', odometerForm.image);
      }

      await protectedApi.submitOdometerReading(formData);
      setOdometerForm({ reading: '', image: null, type: 'start' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to submit odometer reading.');
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      await protectedApi.updateTourStatus(tourId, status);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
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
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tour Assignment Panel</h3>
                      <div className="space-y-4">
                        {assignedTours.filter(t => t.status === 'pending').map((tour) => (
                          <div key={tour._id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{tour.activityName}</h4>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <div>👤 Tourist: {tour.touristName}</div>
                                  <div>📅 Date: {new Date(tour.date).toLocaleDateString()}</div>
                                  <div>🕒 Time: {tour.time}</div>
                                  <div>👥 Participants: {tour.participants}</div>
                                  <div>📍 Pickup: {tour.pickupLocation}</div>
                                  <div>🏁 Destination: {tour.destination}</div>
                                  <div>💰 Fee: ${tour.driverFee}</div>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => acceptTour(tour._id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                >
                                  Accept Tour
                                </button>
                                <button
                                  onClick={() => setRejectionForm({ tourId: tour._id, reason: '' })}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                >
                                  Reject Tour
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {assignedTours.filter(t => t.status === 'pending').length === 0 && (
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-500">No pending tour assignments</p>
                          </div>
                        )}
                      </div>

                      {/* Rejection Modal */}
                      {rejectionForm.tourId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Tour</h3>
                            <form onSubmit={rejectTour}>
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Reason for Rejection
                                </label>
                                <textarea
                                  value={rejectionForm.reason}
                                  onChange={(e) => setRejectionForm({...rejectionForm, reason: e.target.value})}
                                  rows="4"
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Please provide a reason for rejecting this tour..."
                                />
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  type="button"
                                  onClick={() => setRejectionForm({ tourId: '', reason: '' })}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  Reject Tour
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Odometer Tracking Tab */}
                  {activeTab === 'odometer' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Odometer Tracking & Fuel Claims</h3>

                      {/* Submit Odometer Reading */}
                      {activeTour && (
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                          <h4 className="font-medium text-gray-900 mb-4">Submit Odometer Reading</h4>
                          <form onSubmit={submitOdometerReading} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reading Type
                              </label>
                              <select
                                value={odometerForm.type}
                                onChange={(e) => setOdometerForm({...odometerForm, type: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="start">Start Reading</option>
                                <option value="end">End Reading</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Odometer Reading (km)
                              </label>
                              <input
                                type="number"
                                value={odometerForm.reading}
                                onChange={(e) => setOdometerForm({...odometerForm, reading: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Enter reading"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Photo
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setOdometerForm({...odometerForm, image: e.target.files[0]})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="submit"
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                📊 Submit Reading
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Odometer History */}
                      <div>
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