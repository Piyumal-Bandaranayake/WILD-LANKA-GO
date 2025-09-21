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

  // Modal states
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showOdometerModal, setShowOdometerModal] = useState(false);
  const [showFuelClaimModal, setShowFuelClaimModal] = useState(false);

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
      setShowRejectionModal(false);
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
      setShowOdometerModal(false);
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
      setShowFuelClaimModal(false);
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

  // Dashboard configuration
  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'assignments', label: 'Assignments', icon: '📋' },
    { key: 'odometer', label: 'Odometer', icon: '🚗' },
    { key: 'fuelClaims', label: 'Fuel Claims', icon: '⛽' },
    { key: 'history', label: 'History', icon: '📈' },
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
      title: 'Total Distance',
      value: `${tourHistory.reduce((sum, tour) => sum + (tour.distance || 0), 0)} km`,
      color: 'yellow',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    {
      title: 'Fuel Claims',
      value: fuelClaims.length,
      color: 'purple',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
    }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'assignments', label: 'Tour Assignments' },
    { key: 'odometer', label: 'Odometer Tracking' },
    { key: 'fuelClaims', label: 'Fuel Claims' },
    { key: 'history', label: 'Tour History' },
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
                onClick={() => setShowOdometerModal(true)}
              >
                📊 Submit Reading
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={() => updateTourStatus(activeTour._id, 'completed')}
              >
                Complete Tour
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
            onClick={() => setShowFuelClaimModal(true)}
            className="w-full"
          >
            Submit Fuel Claim
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
                status={profile.isAvailable ? 'Available' : 'On Tour'}
                variant={profile.isAvailable ? 'success' : 'danger'}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div>⭐ {profile.rating?.toFixed(1) || '0.0'} rating</div>
            <div>🚗 {profile.vehicleType}</div>
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
      <ProtectedRoute allowedRoles={['safariDriver']}>
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
    <ProtectedRoute allowedRoles={['safariDriver']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        <DashboardLayout
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchPlaceholder="Search tours, claims..."
          greetingMessage={`Welcome back, ${user?.name || 'Safari Driver'}!`}
          statsCards={statsCards}
          rightWidgets={rightWidgets}
          headerColor="orange"
        >
          <TabbedContent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headerColor="orange"
          >

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card title="Dashboard Overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Recent Tours</h4>
                      <div className="space-y-2">
                        {tourHistory.slice(0, 5).map((tour) => (
                          <div key={tour._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">🚗 {tour.activityName}</span>
                            <span className="text-xs text-gray-500">{tour.distance} km</span>
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
                              <div>📍 Pickup: {tour.pickupLocation}</div>
                              <div>🏁 Destination: {tour.destination}</div>
                              <div>💰 Fee: ${tour.driverFee}</div>
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

            {/* Odometer Tracking Tab */}
            {activeTab === 'odometer' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Odometer Tracking</h3>
                  {activeTour && (
                    <Button
                      variant="primary"
                      onClick={() => setShowOdometerModal(true)}
                    >
                      Submit Reading
                    </Button>
                  )}
                </div>

                {activeTour && (
                  <Card title="Active Tour - Submit Odometer Reading">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">{activeTour.activityName}</h4>
                      <p className="text-sm text-blue-700">Tourist: {activeTour.touristName}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Started: {new Date(activeTour.startTime).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                )}

                <Card title="Recent Odometer Readings">
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
                              <StatusBadge 
                                status={reading.type.toUpperCase()}
                                variant={reading.type === 'start' ? 'success' : 'primary'}
                              />
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
                    {odometerReadings.length === 0 && (
                      <EmptyState message="No odometer readings submitted yet" />
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Fuel Claims Tab */}
            {activeTab === 'fuelClaims' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Fuel Claims</h3>
                  <Button
                    variant="primary"
                    onClick={() => setShowFuelClaimModal(true)}
                  >
                    Submit Fuel Claim
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card title="Submit Fuel Claim">
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2">Quick Submit</h4>
                        <p className="text-sm text-orange-700">
                          Select tours and submit fuel claims for reimbursement.
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => setShowFuelClaimModal(true)}
                          className="mt-3"
                        >
                          Open Claim Form
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card title="Fuel Claim Status">
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
                            <StatusBadge 
                              status={claim.status.toUpperCase()}
                              variant={
                                claim.status === 'pending' ? 'warning' :
                                claim.status === 'approved' ? 'success' : 'danger'
                              }
                            />
                          </div>
                        </div>
                      ))}
                      {fuelClaims.length === 0 && (
                        <EmptyState message="No fuel claims submitted yet" />
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Tour History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Tour History</h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => generateReport('weekly')}
                    >
                      📄 Weekly Report
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => generateReport('monthly')}
                    >
                      📊 Monthly Report
                    </Button>
                  </div>
                </div>

                <Card title="Tour History">
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
                              <StatusBadge 
                                status={tour.fuelClaimed ? 'CLAIMED' : 'PENDING'}
                                variant={tour.fuelClaimed ? 'success' : 'warning'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tourHistory.length === 0 && (
                      <EmptyState message="No tour history available" />
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card title="Driver Profile">
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
                          <Field label="License Number">
                            <Input value={profile.licenseNumber} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Vehicle Type">
                            <Input value={profile.vehicleType} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Experience">
                            <Input value={`${profile.experience} years`} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Rating">
                            <Input value={`${profile.rating?.toFixed(1) || '0.0'} ⭐`} readOnly />
                          </Field>
                        </div>
                        <div>
                          <Field label="Status">
                            <StatusBadge 
                              status={profile.isAvailable ? 'Available' : 'On Tour'}
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
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

        {/* Odometer Reading Modal */}
        <Modal
          isOpen={showOdometerModal}
          onClose={() => setShowOdometerModal(false)}
          title="Submit Odometer Reading"
        >
          <form onSubmit={submitOdometerReading} className="space-y-4">
            <Field label="Reading Type">
              <select
                value={odometerForm.type}
                onChange={(e) => setOdometerForm({...odometerForm, type: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="start">Start Reading</option>
                <option value="end">End Reading</option>
              </select>
            </Field>
            <Field label="Odometer Reading (km)">
              <Input
                type="number"
                value={odometerForm.reading}
                onChange={(e) => setOdometerForm({...odometerForm, reading: e.target.value})}
                placeholder="Enter reading"
                required
              />
            </Field>
            <Field label="Upload Photo">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setOdometerForm({...odometerForm, image: e.target.files[0]})}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </Field>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowOdometerModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Submit Reading
              </Button>
            </div>
          </form>
        </Modal>

        {/* Fuel Claim Modal */}
        <Modal
          isOpen={showFuelClaimModal}
          onClose={() => setShowFuelClaimModal(false)}
          title="Submit Fuel Claim"
        >
          <form onSubmit={submitFuelClaim} className="space-y-4">
            <Field label="Claim Type">
              <select
                value={fuelClaimForm.claimType}
                onChange={(e) => setFuelClaimForm({...fuelClaimForm, claimType: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="per-tour">Per Tour</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            {fuelClaimForm.claimType === 'per-tour' && (
              <Field label="Select Tours">
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
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
              </Field>
            )}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFuelClaimModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Submit Claim
              </Button>
            </div>
          </form>
        </Modal>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default SafariDriverDashboard;