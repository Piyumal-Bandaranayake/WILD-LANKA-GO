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
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);

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
        ratingsRes,
        reviewsRes
      ] = await Promise.all([
        protectedApi.getTourGuideProfile(),
        protectedApi.getAssignedTours(),
        protectedApi.getTourHistory(),
        protectedApi.getTourMaterials(),
        protectedApi.getTourGuideRatings(),
        protectedApi.getTourGuideReviews()
      ]);

      setProfile(profileRes.data);
      setAssignedTours(toursRes.data || []);
      setTourHistory(historyRes.data || []);
      setTourMaterials(materialsRes.data || []);
      setRatings(ratingsRes.data || { average: 0, total: 0 });
      setReviews(reviewsRes.data || []);

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
      const response = await protectedApi.acceptTour(tourId);
      
      // Update profile availability if needed
      if (response.data.profileUpdated) {
        setProfile(prev => ({ ...prev, isAvailable: false }));
      }
      
      await fetchDashboardData();
      setError(null);
      
      // Show success message
      const tourName = assignedTours.find(t => t._id === tourId)?.activityName;
      console.log(`✅ Tour "${tourName}" accepted successfully. You are now marked as unavailable.`);
    } catch (error) {
      console.error('Failed to accept tour:', error);
      setError('Failed to accept tour. Please try again.');
    }
  };

  const rejectTour = async (e) => {
    e.preventDefault();
    try {
      const response = await protectedApi.rejectTour(rejectionForm.tourId, { 
        reason: rejectionForm.reason,
        notifyOfficer: true
      });
      
      setRejectionForm({ tourId: '', reason: '' });
      await fetchDashboardData();
      setError(null);
      
      // Show success message
      const tourName = assignedTours.find(t => t._id === rejectionForm.tourId)?.activityName;
      console.log(`❌ Tour "${tourName}" rejected. Wildlife officer has been notified for reassignment.`);
    } catch (error) {
      console.error('Failed to reject tour:', error);
      setError('Failed to reject tour. Please try again.');
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      const response = await protectedApi.updateTourStatus(tourId, status);
      
      // If tour is completed, update profile availability
      if (status === 'completed' && response.data.profileUpdated) {
        setProfile(prev => ({ ...prev, isAvailable: true }));
      }
      
      await fetchDashboardData();
      setError(null);
      
      // Show success message based on status
      const tourName = assignedTours.find(t => t._id === tourId)?.activityName || activeTour?.activityName;
      const statusMessages = {
        'started': `🚀 Tour "${tourName}" has been started. Have a great tour!`,
        'break': `⏸️ Break started for "${tourName}". Take your time.`,
        'completed': `✅ Tour "${tourName}" completed successfully. You are now available for new assignments.`
      };
      
      console.log(statusMessages[status] || `Tour status updated to ${status}.`);
    } catch (error) {
      console.error('Failed to update tour status:', error);
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
                    <div className="space-y-6">
                      {/* Welcome Section */}
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

                      {/* Tourist Ratings Section */}
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tourist Ratings & Reviews</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Rating Summary */}
                          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-yellow-600">{ratings.average.toFixed(1)}</div>
                              <div className="flex justify-center items-center space-x-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-5 h-5 ${
                                      star <= Math.round(ratings.average) ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                ))}
                              </div>
                              <div className="text-sm text-gray-600 mt-2">
                                Based on {ratings.total} reviews
                              </div>
                            </div>
                          </div>

                          {/* Recent Reviews */}
                          <div className="space-y-4 max-h-64 overflow-y-auto">
                            {reviews.slice(0, 3).map((review) => (
                              <div key={review._id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-gray-900">{review.touristName}</div>
                                    <div className="flex items-center space-x-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700">{review.comment}</p>
                                <div className="text-xs text-gray-500 mt-1">
                                  Tour: {review.activityName}
                                </div>
                              </div>
                            ))}
                            {reviews.length === 0 && (
                              <p className="text-gray-500 text-center py-8">No reviews yet</p>
                            )}
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
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            🔔 {assignedTours.filter(t => t.status === 'pending').length} New Assignment{assignedTours.filter(t => t.status === 'pending').length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {assignedTours.filter(t => t.status === 'pending').map((tour) => (
                          <div key={tour._id} className="border-l-4 border-yellow-400 bg-yellow-50 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <h4 className="font-semibold text-gray-900 text-lg">{tour.activityName}</h4>
                                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
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
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span><strong>Time:</strong> {tour.time}</span>
                                    </div>
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
                                      <span><strong>Location:</strong> {tour.location}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span className="font-medium text-green-800">Guide Fee: ${tour.guideFee}</span>
                                  </div>
                                </div>

                                {tour.specialRequirements && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div>
                                        <div className="font-medium text-blue-800">Special Requirements:</div>
                                        <div className="text-blue-700 text-sm">{tour.specialRequirements}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col space-y-3 ml-6">
                                <button
                                  onClick={() => acceptTour(tour._id)}
                                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
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
                                  placeholder="Please provide a detailed reason for rejecting this tour (e.g., scheduling conflict, personal emergency, etc.)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  The wildlife officer will be notified and will reassign this tour to another guide.
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

                  {/* Tour Progress Tab */}
                  {activeTab === 'progress' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Tour Progress Tracker</h3>

                      {activeTour ? (
                        <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="font-semibold text-gray-900 text-xl">🎯 Current Active Tour</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              activeTour.status === 'started' ? 'bg-green-100 text-green-800' :
                              activeTour.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                              activeTour.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activeTour.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Tourist Details */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                              <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Tourist Details
                              </h5>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Name:</span>
                                  <span className="font-medium text-gray-900">{activeTour.touristName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Contact:</span>
                                  <span className="font-medium text-gray-900">
                                    {activeTour.touristPhone ? (
                                      <a href={`tel:${activeTour.touristPhone}`} className="text-blue-600 hover:text-blue-800">
                                        {activeTour.touristPhone}
                                      </a>
                                    ) : 'Not provided'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="font-medium text-gray-900">
                                    {activeTour.touristEmail ? (
                                      <a href={`mailto:${activeTour.touristEmail}`} className="text-blue-600 hover:text-blue-800">
                                        {activeTour.touristEmail}
                                      </a>
                                    ) : 'Not provided'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Participants:</span>
                                  <span className="font-medium text-gray-900">{activeTour.participants}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Activity:</span>
                                  <span className="font-medium text-gray-900">{activeTour.activityName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium text-gray-900">{activeTour.location}</span>
                                </div>
                                {activeTour.specialRequirements && (
                                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-sm">
                                      <div className="font-medium text-yellow-800 mb-1">Special Requirements:</div>
                                      <div className="text-yellow-700">{activeTour.specialRequirements}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tour Controls */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                              <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                                Tour Controls
                              </h5>
                              
                              {/* Download Materials */}
                              <div className="mb-6">
                                <button
                                  onClick={() => downloadTourMaterial(activeTour.materialId || 'general', `${activeTour.activityName}-materials.zip`)}
                                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 mb-3"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  📥 Download Tour Materials
                                </button>
                              </div>

                              {/* Status Control Buttons */}
                              <div className="space-y-3">
                                {activeTour.status === 'accepted' && (
                                  <button
                                    onClick={() => updateTourStatus(activeTour._id, 'started')}
                                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    🚀 Start Tour
                                  </button>
                                )}
                                {activeTour.status === 'started' && (
                                  <>
                                    <button
                                      onClick={() => updateTourStatus(activeTour._id, 'break')}
                                      className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      ⏸️ Take Break
                                    </button>
                                    <button
                                      onClick={() => updateTourStatus(activeTour._id, 'completed')}
                                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      ✅ End Tour
                                    </button>
                                  </>
                                )}
                                {activeTour.status === 'break' && (
                                  <button
                                    onClick={() => updateTourStatus(activeTour._id, 'started')}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    ▶️ Resume Tour
                                  </button>
                                )}
                              </div>

                              {/* Tour Duration */}
                              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Start Time:</span>
                                    <span>{activeTour.startTime ? new Date(activeTour.startTime).toLocaleTimeString() : 'Not started'}</span>
                                  </div>
                                  {activeTour.status === 'started' && (
                                    <div className="flex justify-between mt-1">
                                      <span>Duration:</span>
                                      <span className="text-green-600 font-medium">In Progress</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-500 mb-2">No Active Tour</h3>
                          <p className="text-gray-400 mb-4">Accept a tour assignment to start tracking progress</p>
                          <button
                            onClick={() => setActiveTab('assignments')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            View Assignments
                          </button>
                        </div>
                      )}

                      {/* Accepted Tours Waiting to Start */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Accepted Tours (Ready to Start)</h4>
                        <div className="space-y-4">
                          {assignedTours.filter(t => t.status === 'accepted').map((tour) => (
                            <div key={tour._id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{tour.activityName}</h5>
                                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div>👤 {tour.touristName}</div>
                                    <div>📅 {new Date(tour.date).toLocaleDateString()}</div>
                                    <div>📍 {tour.location}</div>
                                    <div>👥 {tour.participants} participants</div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => downloadTourMaterial(tour.materialId || 'general', `${tour.activityName}-materials.zip`)}
                                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    📥 Materials
                                  </button>
                                  <button
                                    onClick={() => updateTourStatus(tour._id, 'started')}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    🚀 Start
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {assignedTours.filter(t => t.status === 'accepted').length === 0 && (
                            <p className="text-gray-500 text-center py-8">No accepted tours waiting to start</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tour Materials Tab */}
                  {activeTab === 'materials' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Tour Materials Management</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Upload Material */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload New Material
                          </h4>
                          <form onSubmit={uploadTourMaterial} className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Material Title *
                              </label>
                              <input
                                type="text"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Wildlife Photography Guide"
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Material Type
                              </label>
                              <select
                                value={materialForm.type}
                                onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="document">📄 Document (PDF, DOC)</option>
                                <option value="image">🖼️ Image (JPG, PNG)</option>
                                <option value="audio">🎵 Audio (MP3, WAV)</option>
                                <option value="video">🎥 Video (MP4, MOV)</option>
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Brief description of the material and its use case..."
                              />
                            </div>
                            
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Upload *
                              </label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => setMaterialForm({...materialForm, file: e.target.files[0]})}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  accept={
                                    materialForm.type === 'document' ? '.pdf,.doc,.docx' :
                                    materialForm.type === 'image' ? '.jpg,.jpeg,.png,.gif' :
                                    materialForm.type === 'audio' ? '.mp3,.wav,.m4a' :
                                    materialForm.type === 'video' ? '.mp4,.mov,.avi' : '*'
                                  }
                                />
                                {materialForm.file && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    Selected: {materialForm.file.name} ({(materialForm.file.size / 1024 / 1024).toFixed(2)} MB)
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              type="submit"
                              disabled={!materialForm.title || !materialForm.file}
                              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              📤 Upload Material
                            </button>
                          </form>
                        </div>

                        {/* Materials List */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            My Tour Materials ({tourMaterials.length})
                          </h4>
                          
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {tourMaterials.map((material) => (
                              <div key={material._id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="font-medium text-gray-900">{material.title}</h5>
                                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        material.type === 'document' ? 'bg-blue-100 text-blue-800' :
                                        material.type === 'image' ? 'bg-green-100 text-green-800' :
                                        material.type === 'audio' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-purple-100 text-purple-800'
                                      }`}>
                                        {material.type === 'document' ? '📄' :
                                         material.type === 'image' ? '🖼️' :
                                         material.type === 'audio' ? '🎵' : '🎥'} 
                                        {material.type.toUpperCase()}
                                      </span>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>📅 {new Date(material.createdAt).toLocaleDateString()}</span>
                                      {material.fileSize && (
                                        <span>📊 {(material.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                      )}
                                      {material.downloads && (
                                        <span>⬇️ {material.downloads} downloads</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col space-y-2 ml-4">
                                    <button
                                      onClick={() => downloadTourMaterial(material._id, material.filename)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      📥 Download
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
                                          deleteTourMaterial(material._id);
                                        }
                                      }}
                                      className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {tourMaterials.length === 0 && (
                              <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-500 mb-2">No Materials Yet</h3>
                                <p className="text-gray-400">Upload your first tour material to get started</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Materials Usage Tips */}
                      <div className="mt-8 bg-blue-50 rounded-lg p-6">
                        <h5 className="font-medium text-blue-900 mb-3">💡 Material Usage Tips</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                          <div>
                            <strong>📄 Documents:</strong> Create guides, maps, species information sheets
                          </div>
                          <div>
                            <strong>🖼️ Images:</strong> Wildlife photos, location maps, reference pictures
                          </div>
                          <div>
                            <strong>🎵 Audio:</strong> Bird calls, nature sounds, guided commentary
                          </div>
                          <div>
                            <strong>🎥 Videos:</strong> Educational content, location previews, safety briefings
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reports Tab */}
                  {activeTab === 'reports' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Tour Reports & Analytics</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Report Generation */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate Reports
                          </h4>
                          
                          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              <button
                                onClick={() => generateReport('weekly')}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-8h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8" />
                                </svg>
                                📄 Weekly Performance Report
                              </button>
                              
                              <button
                                onClick={() => generateReport('monthly')}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                📊 Monthly Summary Report
                              </button>
                              
                              <button
                                onClick={() => generateReport('tour-history')}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                📈 Complete Tour History
                              </button>
                              
                              <button
                                onClick={() => generateReport('ratings-feedback')}
                                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                ⭐ Ratings & Feedback Report
                              </button>
                            </div>
                            
                            <div className="border-t border-gray-300 pt-4">
                              <p className="text-xs text-gray-600 mb-2">📋 Reports include:</p>
                              <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Tour completion statistics</li>
                                <li>• Tourist ratings and feedback</li>
                                <li>• Earnings and performance metrics</li>
                                <li>• Activity breakdowns and trends</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Performance Summary */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Performance Summary
                          </h4>
                          
                          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-green-600">{tourHistory.length}</div>
                                <div className="text-sm text-gray-600">Total Tours</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-yellow-600">{ratings.average.toFixed(1)} ⭐</div>
                                <div className="text-sm text-gray-600">Average Rating</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">{ratings.total}</div>
                                <div className="text-sm text-gray-600">Total Reviews</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-purple-600">
                                  {tourHistory.filter(t => 
                                    new Date(t.completedAt).getMonth() === new Date().getMonth()
                                  ).length}
                                </div>
                                <div className="text-sm text-gray-600">This Month</div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 mb-2">Recent Performance</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tours This Week:</span>
                                    <span className="font-medium text-gray-900">
                                      {tourHistory.filter(t => {
                                        const weekAgo = new Date();
                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                        return new Date(t.completedAt) >= weekAgo;
                                      }).length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Latest Rating:</span>
                                    <span className="font-medium text-gray-900">
                                      {reviews.length > 0 ? 
                                        `${reviews[0].rating}/5 ⭐` : 'No ratings yet'
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Materials Uploaded:</span>
                                    <span className="font-medium text-gray-900">{tourMaterials.length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Completion Rate:</span>
                                    <span className="font-medium text-green-600">
                                      {assignedTours.length > 0 ? 
                                        `${Math.round((tourHistory.length / (tourHistory.length + assignedTours.length)) * 100)}%` : 
                                        '100%'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Activity Timeline */}
                      <div className="mt-8">
                        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Recent Activity Timeline
                        </h4>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="space-y-4 max-h-64 overflow-y-auto">
                            {/* Combine and sort recent activities */}
                            {[
                              ...tourHistory.slice(0, 5).map(tour => ({
                                type: 'completed',
                                date: tour.completedAt,
                                title: `Completed: ${tour.activityName}`,
                                description: `Tourist: ${tour.touristName}`,
                                icon: '✅',
                                color: 'text-green-600'
                              })),
                              ...assignedTours.filter(t => t.status === 'accepted').slice(0, 3).map(tour => ({
                                type: 'accepted',
                                date: tour.acceptedAt || tour.createdAt,
                                title: `Accepted: ${tour.activityName}`,
                                description: `Scheduled for ${new Date(tour.date).toLocaleDateString()}`,
                                icon: '👍',
                                color: 'text-blue-600'
                              })),
                              ...reviews.slice(0, 3).map(review => ({
                                type: 'review',
                                date: review.createdAt,
                                title: `New Review: ${review.rating}/5 stars`,
                                description: `From ${review.touristName}`,
                                icon: '⭐',
                                color: 'text-yellow-600'
                              }))
                            ]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 8)
                            .map((activity, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm ${activity.color}`}>
                                  {activity.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{activity.title}</div>
                                  <div className="text-sm text-gray-600">{activity.description}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {tourHistory.length === 0 && assignedTours.length === 0 && reviews.length === 0 && (
                              <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-gray-500">No recent activity to display</p>
                              </div>
                            )}
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