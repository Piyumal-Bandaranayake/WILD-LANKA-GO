import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { DashboardLayout, TabbedContent } from '../../components/common/DashboardLayout';
import { 
  Modal, 
  Field, 
  Input, 
  Button, 
  StatusBadge, 
  Avatar, 
  DataTable, 
  Card, 
  LoadingSpinner, 
  EmptyState,
  MiniCalendar
} from '../../components/common/DashboardComponents';

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

  // Modal states
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

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
      setShowRejectionModal(false);
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
      setShowMaterialModal(false);
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

  // Dashboard configuration
  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'assignments', label: 'Assignments', icon: '📋' },
    { key: 'progress', label: 'Progress', icon: '🎯' },
    { key: 'materials', label: 'Materials', icon: '📚' },
    { key: 'reports', label: 'Reports', icon: '📄' },
    { key: 'profile', label: 'Profile', icon: '👤' }
  ];

  const statsCards = [
    {
      title: 'Pending Tours',
      value: assignedTours.filter(t => t.status === 'pending').length,
      color: 'blue',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      title: 'Completed Tours',
      value: tourHistory.length,
      color: 'green',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Average Rating',
      value: ratings.average.toFixed(1),
      color: 'yellow',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      title: 'Materials',
      value: tourMaterials.length,
      color: 'purple',
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'assignments', label: 'Tour Assignments' },
    { key: 'progress', label: 'Tour Progress' },
    { key: 'materials', label: 'Tour Materials' },
    { key: 'reports', label: 'Reports' },
    { key: 'profile', label: 'Profile' }
  ];

  const rightWidgets = [
    {
      title: 'Active Tour',
      content: activeTour ? (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">{activeTour.activityName}</h4>
            <p className="text-sm text-blue-700">{activeTour.touristName}</p>
            <div className="mt-2 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateTourStatus(activeTour._id, 'break')}
              >
                Take Break
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={() => updateTourStatus(activeTour._id, 'completed')}
              >
                End Tour
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState message="No active tour in progress" />
      )
    },
    {
      title: 'Quick Actions',
      content: (
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('assignments')}
            className="w-full"
          >
            View Assignments
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMaterialModal(true)}
            className="w-full"
          >
            Upload Material
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateReport('weekly')}
            className="w-full"
          >
            Generate Report
          </Button>
        </div>
      )
    },
    {
      title: 'Profile Status',
      content: profile ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar name={profile.fullName} />
            <div>
              <div className="font-medium text-sm">{profile.fullName}</div>
              <StatusBadge 
                status={profile.isAvailable ? 'Available' : 'Unavailable'}
                variant={profile.isAvailable ? 'success' : 'danger'}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div>⭐ {ratings.average.toFixed(1)} ({ratings.total} reviews)</div>
            <div>📅 {profile.experience} years experience</div>
          </div>
        </div>
      ) : (
        <EmptyState message="Profile not loaded" />
      )
    }
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['tourGuide']}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <LoadingSpinner message="Loading your dashboard..." />
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
        
        <DashboardLayout
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchPlaceholder="Search tours, materials..."
          greetingMessage={`Welcome back, ${user?.name || 'Tour Guide'}!`}
          statsCards={statsCards}
          rightWidgets={rightWidgets}
          headerColor="purple"
        >
          <TabbedContent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headerColor="purple"
          >

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card title="Dashboard Overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-2">
                        {tourHistory.slice(0, 5).map((tour) => (
                          <div key={tour._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">✅ {tour.activityName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(tour.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {tourHistory.length === 0 && (
                          <EmptyState message="No completed tours yet" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Pending Assignments</h4>
                      <div className="space-y-2">
                        {assignedTours.filter(t => t.status === 'pending').slice(0, 3).map((tour) => (
                          <div key={tour._id} className="p-3 bg-yellow-50 rounded-lg">
                            <div className="font-medium text-sm">{tour.activityName}</div>
                            <div className="text-xs text-gray-600">{tour.touristName}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(tour.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        {assignedTours.filter(t => t.status === 'pending').length === 0 && (
                          <EmptyState message="No pending assignments" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tour Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <Card title="Tour Assignment Panel">
                  <div className="space-y-4">
                    {assignedTours.filter(t => t.status === 'pending').map((tour) => (
                      <div key={tour._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tour.activityName}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                              <div>👤 Tourist: {tour.touristName}</div>
                              <div>📅 Date: {new Date(tour.date).toLocaleDateString()}</div>
                              <div>🕒 Time: {tour.time}</div>
                              <div>👥 Participants: {tour.participants}</div>
                              <div>📍 Location: {tour.location}</div>
                              <div>💰 Fee: ${tour.guideFee}</div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              variant="success"
                              onClick={() => acceptTour(tour._id)}
                            >
                              Accept Tour
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                setRejectionForm({ tourId: tour._id, reason: '' });
                                setShowRejectionModal(true);
                              }}
                            >
                              Reject Tour
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {assignedTours.filter(t => t.status === 'pending').length === 0 && (
                      <EmptyState message="No pending tour assignments" />
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Tour Progress Tab */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <Card title="Tour Progress Tracker">
                  {activeTour ? (
                    <div className="border border-blue-200 rounded-lg p-6 mb-6 bg-blue-50">
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
                              <Button
                                variant="success"
                                onClick={() => updateTourStatus(activeTour._id, 'started')}
                                className="w-full"
                              >
                                🚀 Start Tour
                              </Button>
                            )}
                            {activeTour.status === 'started' && (
                              <>
                                <Button
                                  variant="warning"
                                  onClick={() => updateTourStatus(activeTour._id, 'break')}
                                  className="w-full"
                                >
                                  ⏸️ Take Break
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={() => updateTourStatus(activeTour._id, 'completed')}
                                  className="w-full"
                                >
                                  ✅ End Tour
                                </Button>
                              </>
                            )}
                            {activeTour.status === 'break' && (
                              <Button
                                variant="success"
                                onClick={() => updateTourStatus(activeTour._id, 'started')}
                                className="w-full"
                              >
                                ▶️ Resume Tour
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="No active tour in progress" />
                  )}

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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTourMaterial(tour.materialId, 'tour-materials.zip')}
                              >
                                📥 Download Materials
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => updateTourStatus(tour._id, 'started')}
                              >
                                🚀 Start Tour
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {assignedTours.filter(t => t.status === 'accepted').length === 0 && (
                        <EmptyState message="No accepted tours" />
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tour Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Tour Materials</h3>
                  <Button
                    variant="primary"
                    onClick={() => setShowMaterialModal(true)}
                  >
                    Upload Material
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card title="My Tour Materials">
                    <div className="space-y-4">
                      {tourMaterials.map((material) => (
                        <div key={material._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{material.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <StatusBadge 
                                  status={material.type.toUpperCase()}
                                  variant={
                                    material.type === 'document' ? 'primary' :
                                    material.type === 'image' ? 'success' :
                                    material.type === 'audio' ? 'warning' : 'secondary'
                                  }
                                />
                                <span className="text-xs text-gray-500">
                                  {new Date(material.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTourMaterial(material._id, material.filename)}
                              >
                                📥 Download
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => deleteTourMaterial(material._id)}
                              >
                                🗑️ Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tourMaterials.length === 0 && (
                        <EmptyState message="No materials uploaded yet" />
                      )}
                    </div>
                  </Card>

                  <Card title="Material Statistics">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {tourMaterials.filter(m => m.type === 'document').length}
                          </div>
                          <div className="text-sm text-blue-800">Documents</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {tourMaterials.filter(m => m.type === 'image').length}
                          </div>
                          <div className="text-sm text-green-800">Images</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {tourMaterials.filter(m => m.type === 'audio').length}
                          </div>
                          <div className="text-sm text-yellow-800">Audio</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {tourMaterials.filter(m => m.type === 'video').length}
                          </div>
                          <div className="text-sm text-purple-800">Videos</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Generate Reports">
                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        onClick={() => generateReport('weekly')}
                        className="w-full"
                      >
                        📄 Weekly Report
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => generateReport('monthly')}
                        className="w-full"
                      >
                        📊 Monthly Report
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => generateReport('tour-history')}
                        className="w-full"
                      >
                        📈 Tour History Report
                      </Button>
                    </div>
                  </Card>

                  <Card title="Performance Summary">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Total Tours Completed:</span>
                        <span className="font-medium text-gray-900">{tourHistory.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Average Rating:</span>
                        <span className="font-medium text-gray-900">{ratings.average.toFixed(1)} ⭐</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Total Reviews:</span>
                        <span className="font-medium text-gray-900">{ratings.total}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">This Month's Tours:</span>
                        <span className="font-medium text-gray-900">
                          {tourHistory.filter(t =>
                            new Date(t.completedAt).getMonth() === new Date().getMonth()
                          ).length}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card title="Profile Management">
                  {profile ? (
                    <div className="max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Field label="Full Name">
                            <Input value={profile.fullName} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Email">
                            <Input value={profile.email} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Phone">
                            <Input value={profile.phone} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Experience">
                            <Input value={`${profile.experience} years`} readOnly />
                          </Field>
                        </div>
                        <div className="md:col-span-2">
                          <Field label="Languages">
                            <Input value={profile.languages?.join(', ') || 'Not specified'} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Status">
                            <StatusBadge 
                              status={profile.isAvailable ? 'Available' : 'Unavailable'}
                              variant={profile.isAvailable ? 'success' : 'danger'}
                            />
                          </Field>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button variant="primary">
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="Profile not loaded" />
                  )}
                </Card>
              </div>
            )}
          </TabbedContent>
        </DashboardLayout>

        {/* Rejection Modal */}
        <Modal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          title="Reject Tour"
        >
          <form onSubmit={rejectTour} className="space-y-4">
            <Field label="Reason for Rejection">
              <textarea
                value={rejectionForm.reason}
                onChange={(e) => setRejectionForm({...rejectionForm, reason: e.target.value})}
                rows="4"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Please provide a reason for rejecting this tour..."
              />
            </Field>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRejectionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
              >
                Reject Tour
              </Button>
            </div>
          </form>
        </Modal>

        {/* Material Upload Modal */}
        <Modal
          isOpen={showMaterialModal}
          onClose={() => setShowMaterialModal(false)}
          title="Upload Tour Material"
        >
          <form onSubmit={uploadTourMaterial} className="space-y-4">
            <Field label="Title">
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                placeholder="Material title"
                required
              />
            </Field>
            <Field label="Type">
              <select
                value={materialForm.type}
                onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Material description"
              />
            </Field>
            <Field label="File">
              <input
                type="file"
                onChange={(e) => setMaterialForm({...materialForm, file: e.target.files[0]})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </Field>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowMaterialModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Upload Material
              </Button>
            </div>
          </form>
        </Modal>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default TourGuideDashboard;