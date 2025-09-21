import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
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
        driversRes,
        guidesRes
      ] = await Promise.all([
        protectedApi.getBookings(),
        protectedApi.getComplaints(),
        protectedApi.getApplications(),
        protectedApi.getFuelClaims(),
        protectedApi.getAvailableDrivers(),
        protectedApi.getAvailableGuides()
      ]);

      setBookings(bookingsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setApplications(applicationsRes.data || []);
      setFuelClaims(fuelClaimsRes.data || []);
      setAvailableDrivers(driversRes.data || []);
      setAvailableGuides(guidesRes.data || []);

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
      <ProtectedRoute allowedRoles={['WildlifeOfficer']}>
        <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['WildlifeOfficer']}>
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

            {/* Modern 3-Column Layout */}
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 md:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
                    <h1 className="text-lg font-bold">Wildlife Officer</h1>
                    <p className="text-blue-100 text-sm mt-1">Welcome back, {backendUser?.name || user?.name || 'Officer'}!</p>
                  </div>

                  {/* Navigation Menu */}
                  <nav className="space-y-2">
                    {[
                      { id: 'overview', name: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { id: 'bookings', name: 'Bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                      { id: 'complaints', name: 'Complaints', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { id: 'applications', name: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { id: 'fuelClaims', name: 'Fuel Claims', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                      { id: 'reports', name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <StatCard
                    title="Today's Bookings"
                    value={dashboardStats.todayBookings}
                    color="blue"
                    iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                  <StatCard
                    title="Pending Complaints"
                    value={dashboardStats.pendingComplaints}
                    color="yellow"
                    iconPath="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <StatCard
                    title="Job Applications"
                    value={dashboardStats.pendingApplications}
                    color="purple"
                    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                  <StatCard
                    title="Fuel Claims"
                    value={dashboardStats.pendingFuelClaims}
                    color="blue"
                    iconPath="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <StatCard
                    title="Total Tours"
                    value={dashboardStats.totalBookings}
                    color="green"
                    iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </div>

                {/* Content Container */}
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Operations Summary</h3>
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
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Bookings Management</h3>
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
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Complaints Management</h3>
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
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Applications</h3>
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
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Fuel Claims Management</h3>
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
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Income Reports</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-4">Generate Reports</h4>
                          <div className="space-y-3">
                            <button
                              onClick={generateMonthlyReport}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📄 Generate Monthly Income Report
                            </button>
                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                              📊 Generate Bookings Summary
                            </button>
                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
              </main>

              {/* RIGHT WIDGETS */}
              <aside className="col-span-12 md:col-span-3">
                <div className="space-y-6">
                  {/* Profile mini */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {(backendUser?.name || user?.name || 'Wildlife Officer').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'WO'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{backendUser?.name || user?.name || 'Wildlife Officer'}</div>
                        <div className="text-xs text-gray-500">Wildlife Officer</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Widget */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Today's Bookings</span>
                        <span className="font-medium text-blue-600">{dashboardStats.todayBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Complaints</span>
                        <span className="font-medium text-yellow-600">{dashboardStats.pendingComplaints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Job Applications</span>
                        <span className="font-medium text-purple-600">{dashboardStats.pendingApplications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fuel Claims</span>
                        <span className="font-medium text-blue-600">{dashboardStats.pendingFuelClaims}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts Widget */}
                  {(dashboardStats.pendingComplaints > 0 || dashboardStats.pendingApplications > 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm p-5">
                      <h4 className="font-semibold text-yellow-800 mb-3">Action Required</h4>
                      <div className="text-sm text-yellow-700 space-y-2">
                        {dashboardStats.pendingComplaints > 0 && (
                          <div>⚠️ {dashboardStats.pendingComplaints} complaints need review</div>
                        )}
                        {dashboardStats.pendingApplications > 0 && (
                          <div>📋 {dashboardStats.pendingApplications} applications pending approval</div>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveTab(dashboardStats.pendingComplaints > 0 ? 'complaints' : 'applications')}
                        className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        Review Now
                      </button>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
                    <div className="space-y-3 text-sm">
                      {bookings.slice(0, 3).map((booking) => (
                        <div key={booking._id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">New booking from {booking.touristName}</span>
                        </div>
                      ))}
                      {complaints.slice(0, 2).map((complaint) => (
                        <div key={complaint._id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-600">Complaint: {complaint.subject}</span>
                        </div>
                      ))}
                      {(bookings.length === 0 && complaints.length === 0) && (
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

export default WildlifeOfficerDashboard;