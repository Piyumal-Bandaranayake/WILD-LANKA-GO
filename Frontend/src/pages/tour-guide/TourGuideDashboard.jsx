import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const TourGuideDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [profile, setProfile] = useState(null);
  const [assignedTours, setAssignedTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [tourHistory, setTourHistory] = useState([]);
  const [tourMaterials, setTourMaterials] = useState([]);
  const [ratings, setRatings] = useState({ average: 0, total: 0 });

  // Form states
  const [rejectionForm, setRejectionForm] = useState({
    tourId: '',
    reason: ''
  });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'document',
    file: null
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
        materialsRes,
        ratingsRes
      ] = await Promise.all([
        protectedApi.getTourGuideProfile(),
        protectedApi.getAssignedTours(),
        protectedApi.getTourHistory(),
        protectedApi.getTourMaterials(),
        protectedApi.getTourGuideRatings()
      ]);

      setProfile(profileRes.data);
      setAssignedTours(toursRes.data || []);
      setTourHistory(historyRes.data || []);
      setTourMaterials(materialsRes.data || []);
      setRatings(ratingsRes.data || { average: 0, total: 0 });

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

  const updateTourStatus = async (tourId, status) => {
    try {
      await protectedApi.updateTourStatus(tourId, status);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError(`Failed to update tour status to ${status}.`);
    }
  };

  const uploadTourMaterial = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', materialForm.title);
      formData.append('description', materialForm.description);
      formData.append('type', materialForm.type);
      if (materialForm.file) {
        formData.append('file', materialForm.file);
      }

      await protectedApi.uploadTourMaterial(formData);
      setMaterialForm({ title: '', description: '', type: 'document', file: null });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to upload material. Please try again.');
    }
  };

  const deleteTourMaterial = async (materialId) => {
    try {
      await protectedApi.deleteTourMaterial(materialId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to delete material.');
    }
  };

  const downloadTourMaterial = async (materialId, filename) => {
    try {
      const response = await protectedApi.downloadTourMaterial(materialId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (error) {
      setError('Failed to download material.');
    }
  };

  const generateReport = async (type) => {
    try {
      const response = await protectedApi.generateTourGuideReport(type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tour-guide-${type}-report.pdf`;
      a.click();
    } catch (error) {
      setError(`Failed to generate ${type} report.`);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await protectedApi.updateTourGuideProfile(profileData);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['tourGuide']}>
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
    <ProtectedRoute allowedRoles={['tourGuide']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        <div className="flex-1 pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 md:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {(backendUser?.name || user?.name || 'Tour Guide').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'TG'}
                      </div>
                      <div>
                        <div className="font-semibold">{backendUser?.name || user?.name || 'Tour Guide'}</div>
                        <div className="text-xs text-blue-100">Tour Guide</div>
                        {profile && (
                          <div className="flex items-center mt-1 text-xs">
                            <span className="text-yellow-300 mr-1">⭐</span>
                            <span>{ratings.average.toFixed(1)} ({ratings.total} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Active Tour Alert */}
                  {activeTour && (
                    <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm">
                        <h4 className="font-medium text-blue-900">Active Tour</h4>
                        <p className="text-blue-700">{activeTour.activityName}</p>
                        <div className="flex space-x-1 mt-2">
                          <button
                            onClick={() => updateTourStatus(activeTour._id, 'break')}
                            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                          >
                            Break
                          </button>
                          <button
                            onClick={() => updateTourStatus(activeTour._id, 'completed')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            End
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <nav className="p-4">
                    <div className="space-y-1">
                      {[
                        { id: 'overview', name: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                        { id: 'assignments', name: 'Tour Assignments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'progress', name: 'Tour Progress', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'materials', name: 'Tour Materials', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                        { id: 'reports', name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                          </svg>
                          <span className="text-sm">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </nav>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 md:col-span-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
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
                    title="Average Rating"
                    value={`${ratings.average.toFixed(1)} ⭐`}
                    color="yellow"
                    iconPath="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                  <StatCard
                    title="Materials"
                    value={tourMaterials.length}
                    color="purple"
                    iconPath="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
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
                          <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {tourHistory.slice(0, 5).map((tour) => (
                              <div key={tour._id} className="flex justify-between">
                                <span>✅ {tour.activityName}</span>
                                <span>{new Date(tour.completedAt).toLocaleDateString()}</span>
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
                              onClick={() => setActiveTab('materials')}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              📚 Manage Materials
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
                                  <div>📍 Location: {tour.location}</div>
                                  <div>💰 Fee: ${tour.guideFee}</div>
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

                  {/* Tour Progress Tab */}
                  {activeTab === 'progress' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tour Progress Tracker</h3>

                      {activeTour ? (
                        <div className="border border-gray-200 rounded-lg p-6 mb-6">
                          <h4 className="font-medium text-gray-900 mb-4">Current Active Tour</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Tour Details</h5>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>🎯 Activity: {activeTour.activityName}</div>
                                <div>👤 Tourist: {activeTour.touristName}</div>
                                <div>📱 Contact: {activeTour.touristPhone}</div>
                                <div>👥 Participants: {activeTour.participants}</div>
                                <div>📍 Location: {activeTour.location}</div>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Tour Controls</h5>
                              <div className="space-y-2">
                                {activeTour.status === 'accepted' && (
                                  <button
                                    onClick={() => updateTourStatus(activeTour._id, 'started')}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    🚀 Start Tour
                                  </button>
                                )}
                                {activeTour.status === 'started' && (
                                  <>
                                    <button
                                      onClick={() => updateTourStatus(activeTour._id, 'break')}
                                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                                    >
                                      ⏸️ Take Break
                                    </button>
                                    <button
                                      onClick={() => updateTourStatus(activeTour._id, 'completed')}
                                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                      ✅ End Tour
                                    </button>
                                  </>
                                )}
                                {activeTour.status === 'break' && (
                                  <button
                                    onClick={() => updateTourStatus(activeTour._id, 'started')}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    ▶️ Resume Tour
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-gray-500">No active tour in progress</p>
                        </div>
                      )}

                      {/* Accepted Tours */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Accepted Tours</h4>
                        <div className="space-y-4">
                          {assignedTours.filter(t => t.status === 'accepted').map((tour) => (
                            <div key={tour._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{tour.activityName}</h5>
                                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div>👤 {tour.touristName}</div>
                                    <div>📅 {new Date(tour.date).toLocaleDateString()}</div>
                                    <div>📍 {tour.location}</div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => downloadTourMaterial(tour.materialId, 'tour-materials.zip')}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    📥 Download Materials
                                  </button>
                                  <button
                                    onClick={() => updateTourStatus(tour._id, 'started')}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    🚀 Start Tour
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tour Materials Tab */}
                  {activeTab === 'materials' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Upload Material */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Tour Material</h3>
                          <form onSubmit={uploadTourMaterial} className="bg-gray-50 rounded-lg p-6">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                              </label>
                              <input
                                type="text"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Material title"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                              </label>
                              <select
                                value={materialForm.type}
                                onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="document">Document</option>
                                <option value="image">Image</option>
                                <option value="audio">Audio</option>
                                <option value="video">Video</option>
                              </select>
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                                rows="3"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Material description"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                File
                              </label>
                              <input
                                type="file"
                                onChange={(e) => setMaterialForm({...materialForm, file: e.target.files[0]})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📤 Upload Material
                            </button>
                          </form>
                        </div>

                        {/* Materials List */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Tour Materials</h3>
                          <div className="space-y-4">
                            {tourMaterials.map((material) => (
                              <div key={material._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{material.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        material.type === 'document' ? 'bg-blue-100 text-blue-800' :
                                        material.type === 'image' ? 'bg-green-100 text-green-800' :
                                        material.type === 'audio' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-purple-100 text-purple-800'
                                      }`}>
                                        {material.type.toUpperCase()}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(material.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => downloadTourMaterial(material._id, material.filename)}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      📥 Download
                                    </button>
                                    <button
                                      onClick={() => deleteTourMaterial(material._id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {tourMaterials.length === 0 && (
                              <p className="text-gray-500 text-center py-8">No materials uploaded yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reports Tab */}
                  {activeTab === 'reports' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tour Reports</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-4">Generate Reports</h4>
                          <div className="space-y-3">
                            <button
                              onClick={() => generateReport('weekly')}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📄 Weekly Report
                            </button>
                            <button
                              onClick={() => generateReport('monthly')}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📊 Monthly Report
                            </button>
                            <button
                              onClick={() => generateReport('tour-history')}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📈 Tour History Report
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-4">Performance Summary</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Total Tours Completed:</span>
                              <span className="font-medium text-gray-900">{tourHistory.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average Rating:</span>
                              <span className="font-medium text-gray-900">{ratings.average.toFixed(1)} ⭐</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Reviews:</span>
                              <span className="font-medium text-gray-900">{ratings.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>This Month's Tours:</span>
                              <span className="font-medium text-gray-900">
                                {tourHistory.filter(t =>
                                  new Date(t.completedAt).getMonth() === new Date().getMonth()
                                ).length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Management</h3>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                <p className="text-gray-900">{profile.experience} years</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                                <p className="text-gray-900">{profile.languages?.join(', ') || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  profile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {profile.isAvailable ? 'Available' : 'Unavailable'}
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
                        {(backendUser?.name || user?.name || 'Tour Guide').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'TG'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{backendUser?.name || user?.name || 'Tour Guide'}</div>
                        <div className="text-xs text-gray-500">Tour Guide</div>
                        {profile?.isAvailable !== undefined && (
                          <div className={`text-xs px-1 py-0.5 rounded ${
                            profile.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {profile.isAvailable ? 'Available' : 'Unavailable'}
                          </div>
                        )}
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
                        <span className="text-sm text-gray-600">Rating</span>
                        <span className="font-medium text-yellow-600">{ratings.average.toFixed(1)} ⭐</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Materials</span>
                        <span className="font-medium text-purple-600">{tourMaterials.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Tours Alert */}
                  {assignedTours.filter(t => t.status === 'pending').length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm p-5">
                      <h4 className="font-semibold text-yellow-800 mb-3">Pending Tours</h4>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <div>📋 {assignedTours.filter(t => t.status === 'pending').length} tours awaiting response</div>
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
                        <div>⏰ Status: {activeTour.status}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        Manage Tour
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

export default TourGuideDashboard;