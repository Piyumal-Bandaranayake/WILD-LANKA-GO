import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const WildlifeOfficerDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    pendingComplaints: 0,
    pendingApplications: 0,
    pendingFuelClaims: 0
  });

  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fuelClaims, setFuelClaims] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all required data in parallel
      const [
        bookingsRes,
        complaintsRes,
        applicationsRes,
        fuelClaimsRes,
        driversRes
      ] = await Promise.all([
        protectedApi.getBookings(),
        protectedApi.getComplaints(),
        protectedApi.getApplications(),
        protectedApi.getFuelClaims(),
        protectedApi.getDrivers()
      ]);

      setBookings(bookingsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setApplications(applicationsRes.data || []);
      setFuelClaims(fuelClaimsRes.data || []);
      setAvailableDrivers(driversRes.data || []);
      setAvailableGuides([]); // TODO: Add getGuides endpoint

      // Calculate dashboard stats
      const today = new Date().toDateString();
      const todayBookingsCount = (bookingsRes.data || []).filter(
        booking => new Date(booking.createdAt).toDateString() === today
      ).length;

      setDashboardStats({
        totalBookings: (bookingsRes.data || []).length,
        todayBookings: todayBookingsCount,
        pendingComplaints: (complaintsRes.data || []).filter(c => c.status === 'pending').length,
        pendingApplications: (applicationsRes.data || []).filter(a => a.status === 'pending').length,
        pendingFuelClaims: (fuelClaimsRes.data || []).filter(f => f.status === 'pending').length
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (bookingId, driverId) => {
    try {
      await protectedApi.assignDriver(bookingId, driverId);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign driver:', error);
      setError('Failed to assign driver');
    }
  };

  const assignGuide = async (bookingId, guideId) => {
    try {
      await protectedApi.assignGuide(bookingId, guideId);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign guide:', error);
      setError('Failed to assign guide');
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      await protectedApi.updateComplaintStatus(complaintId, status);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      setError('Failed to update complaint status');
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await protectedApi.updateApplicationStatus(applicationId, status);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update application status:', error);
      setError('Failed to update application status');
    }
  };

  const updateFuelClaimStatus = async (claimId, status) => {
    try {
      await protectedApi.updateFuelClaimStatus(claimId, status);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update fuel claim status:', error);
      setError('Failed to update fuel claim status');
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const report = await protectedApi.generateMonthlyReport();
      // Handle report download
      const blob = new Blob([report.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-report-${new Date().getMonth() + 1}-${new Date().getFullYear()}.pdf`;
      a.click();
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate monthly report');
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="WildlifeOfficer">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="WildlifeOfficer">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 pt-32 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white mb-8">
              <h1 className="text-3xl font-bold">Wildlife Officer Dashboard</h1>
              <p className="text-green-100 mt-2">Welcome back, {user?.name}!</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardStats.todayBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Complaints</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardStats.pendingComplaints}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Job Applications</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardStats.pendingApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fuel Claims</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardStats.pendingFuelClaims}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tours</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalBookings}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: 'Overview', icon: '📊' },
                    { id: 'bookings', name: 'Bookings Management', icon: '📅' },
                    { id: 'complaints', name: 'Complaints', icon: '📝' },
                    { id: 'applications', name: 'Job Applications', icon: '👥' },
                    { id: 'fuelClaims', name: 'Fuel Claims', icon: '⛽' },
                    { id: 'reports', name: 'Reports', icon: '📄' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
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
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Operations Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Today's Activities</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• {dashboardStats.todayBookings} new bookings received</li>
                          <li>• {dashboardStats.pendingComplaints} complaints awaiting review</li>
                          <li>• {dashboardStats.pendingApplications} job applications pending approval</li>
                          <li>• {dashboardStats.pendingFuelClaims} fuel claims requiring processing</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={generateMonthlyReport}
                            className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                          >
                            📄 Generate Monthly Report
                          </button>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                          >
                            📅 Manage Today's Bookings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bookings Management Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings Management</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tourist</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bookings.map((booking) => (
                            <tr key={booking._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.touristName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.activityName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(booking.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.assignedDriver ? (
                                  <span className="text-green-600">✓ {booking.assignedDriver.name}</span>
                                ) : (
                                  <select
                                    onChange={(e) => assignDriver(booking._id, e.target.value)}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                                  >
                                    <option value="">Assign Driver</option>
                                    {availableDrivers.map((driver) => (
                                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.requestGuide ? (
                                  booking.assignedGuide ? (
                                    <span className="text-green-600">✓ {booking.assignedGuide.name}</span>
                                  ) : (
                                    <select
                                      onChange={(e) => assignGuide(booking._id, e.target.value)}
                                      className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                                    >
                                      <option value="">Assign Guide</option>
                                      {availableGuides.map((guide) => (
                                        <option key={guide._id} value={guide._id}>{guide.name}</option>
                                      ))}
                                    </select>
                                  )
                                ) : (
                                  <span className="text-gray-400">Not requested</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <button className="text-blue-600 hover:text-blue-800 mr-3">View Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Complaints Tab */}
                {activeTab === 'complaints' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Complaints Management</h3>
                    <div className="space-y-4">
                      {complaints.map((complaint) => (
                        <div key={complaint._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{complaint.subject}</h4>
                              <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                From: {complaint.complainantName} | Date: {new Date(complaint.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                complaint.status === 'in-review' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {complaint.status.toUpperCase()}
                              </span>
                              {complaint.status === 'pending' && (
                                <button
                                  onClick={() => updateComplaintStatus(complaint._id, 'in-review')}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  Mark In-Review
                                </button>
                              )}
                              {complaint.status === 'in-review' && (
                                <button
                                  onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  Mark Resolved
                                </button>
                              )}
                              <button className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                                Delete
                              </button>
                              <button className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
                                Generate Report
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Applications Tab */}
                {activeTab === 'applications' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Job Applications</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {applications.map((application) => (
                            <tr key={application._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.fullName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.position}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.experience} years</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(application.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {application.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {application.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updateApplicationStatus(application._id, 'approved')}
                                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                <button className="ml-2 text-blue-600 hover:text-blue-800 text-xs">View Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Fuel Claims Tab */}
                {activeTab === 'fuelClaims' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Fuel Claims Management</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {fuelClaims.map((claim) => (
                            <tr key={claim._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.claimNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.driverName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${claim.amount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.distance} km</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {claim.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {claim.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updateFuelClaimStatus(claim._id, 'approved')}
                                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => updateFuelClaimStatus(claim._id, 'rejected')}
                                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                <button className="ml-2 text-blue-600 hover:text-blue-800 text-xs">View Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Income Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Generate Reports</h4>
                        <div className="space-y-3">
                          <button
                            onClick={generateMonthlyReport}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            📄 Generate Monthly Income Report
                          </button>
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            📊 Generate Bookings Summary
                          </button>
                          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            📈 Generate Financial Performance Report
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Report Statistics</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>This Month's Income:</span>
                            <span className="font-medium text-gray-900">$12,450</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Fuel Expenses:</span>
                            <span className="font-medium text-gray-900">$2,340</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Profit:</span>
                            <span className="font-medium text-green-600">$10,110</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tours Completed:</span>
                            <span className="font-medium text-gray-900">156</span>
                          </div>
                        </div>
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
    </RoleGuard>
  );
};

export default WildlifeOfficerDashboard;