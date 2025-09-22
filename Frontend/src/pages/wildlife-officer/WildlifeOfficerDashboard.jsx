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
    pendingFuelClaims: 0,
    activeEmergencies: 0,
    lowStockMedications: 0
  });

  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fuelClaims, setFuelClaims] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [medicationInventory, setMedicationInventory] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);

  // Form states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState({ open: false, type: '', bookingId: '' });

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
        emergenciesRes,
        medicationRes,
        driversRes,
        guidesRes,
        statsRes
      ] = await Promise.all([
        protectedApi.getBookings(),
        protectedApi.getComplaints(),
        protectedApi.getApplications(),
        protectedApi.getFuelClaims(),
        protectedApi.getEmergencies(),
        protectedApi.getMedicationInventory(),
        protectedApi.getAvailableDrivers(),
        protectedApi.getAvailableGuides(),
        protectedApi.getWildlifeOfficerStats()
      ]);

      setBookings(bookingsRes.data || []);
      setComplaints(complaintsRes.data || []);
      setApplications(applicationsRes.data || []);
      setFuelClaims(fuelClaimsRes.data || []);
      setEmergencies(emergenciesRes.data || []);
      setMedicationInventory(medicationRes.data || []);
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
        pendingFuelClaims: (fuelClaimsRes.data || []).filter(f => f.status === 'pending').length,
        activeEmergencies: (emergenciesRes.data || []).filter(e => e.status === 'active').length,
        lowStockMedications: (medicationRes.data || []).filter(m => m.stock < m.minimumStock).length
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
      setAssignmentModal({ open: false, type: '', bookingId: '' });
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign driver:', error);
      setError('Failed to assign driver');
    }
  };

  const assignGuide = async (bookingId, guideId) => {
    try {
      await protectedApi.assignGuide(bookingId, guideId);
      setAssignmentModal({ open: false, type: '', bookingId: '' });
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

  const deleteComplaint = async (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await protectedApi.deleteComplaint(complaintId);
        await fetchDashboardData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete complaint:', error);
        setError('Failed to delete complaint');
      }
    }
  };

  const approveApplication = async (applicationId) => {
    try {
      await protectedApi.approveApplication(applicationId, { approvedBy: backendUser?.id || user?.sub });
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to approve application:', error);
      setError('Failed to approve application');
    }
  };

  const rejectApplication = async (applicationId, reason) => {
    try {
      await protectedApi.rejectApplication(applicationId, { reason, rejectedBy: backendUser?.id || user?.sub });
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to reject application:', error);
      setError('Failed to reject application');
    }
  };

  const approveFuelClaim = async (claimId) => {
    try {
      await protectedApi.approveFuelClaim(claimId);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to approve fuel claim:', error);
      setError('Failed to approve fuel claim');
    }
  };

  const rejectFuelClaim = async (claimId, reason) => {
    try {
      await protectedApi.rejectFuelClaim(claimId, reason);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to reject fuel claim:', error);
      setError('Failed to reject fuel claim');
    }
  };

  // Additional handlers for enhanced functionality
  const updateApplicationStatus = async (applicationId, status) => {
    try {
      if (status === 'approved') {
        await protectedApi.approveApplication(applicationId, { approvedBy: backendUser?.name || user?.name });
      } else {
        await protectedApi.rejectApplication(applicationId, { rejectedBy: backendUser?.name || user?.name });
      }
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update application status:', error);
      setError('Failed to update application status');
    }
  };

  const updateFuelClaimStatus = async (claimId, status) => {
    try {
      if (status === 'approved') {
        await protectedApi.approveFuelClaim(claimId);
      } else {
        await protectedApi.rejectFuelClaim(claimId, 'Rejected by Wildlife Officer');
      }
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update fuel claim status:', error);
      setError('Failed to update fuel claim status');
    }
  };

  const handleEmergencyAction = async (emergencyId, action) => {
    try {
      switch (action) {
        case 'assign':
          // Open modal for staff assignment (implement modal later)
          alert('Staff assignment functionality - to be implemented with modal');
          break;
        case 'activate':
          await protectedApi.updateEmergencyStatus(emergencyId, { status: 'active' });
          break;
        case 'resolve':
          await protectedApi.updateEmergencyStatus(emergencyId, { status: 'resolved', resolvedBy: backendUser?.name || user?.name });
          break;
        case 'update':
          alert('Update emergency details - to be implemented with modal');
          break;
        default:
          break;
      }
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to handle emergency action:', error);
      setError('Failed to handle emergency action');
    }
  };

  const assignEmergencyStaff = async (emergencyId, staffId, staffType) => {
    try {
      await protectedApi.assignEmergencyStaff(emergencyId, staffId, staffType);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign emergency staff:', error);
      setError('Failed to assign emergency staff');
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const currentDate = new Date();
      const report = await protectedApi.generateMonthlyReport(currentDate.getMonth() + 1, currentDate.getFullYear());
      // Handle report download
      const blob = new Blob([report.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-report-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate monthly report');
    }
  };

  const generateComplaintReport = async () => {
    try {
      const report = await protectedApi.generateComplaintReport();
      const blob = new Blob([report.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaint-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate complaint report:', error);
      setError('Failed to generate complaint report');
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
                      { id: 'emergencies', name: 'Emergencies', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
                      { id: 'inventory', name: 'Medication', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    color="green"
                    iconPath="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </div>

                {/* Secondary Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <StatCard
                    title="Active Emergencies"
                    value={dashboardStats.activeEmergencies}
                    color="red"
                    iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                  <StatCard
                    title="Low Stock Medications"
                    value={dashboardStats.lowStockMedications}
                    color="orange"
                    iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                  <StatCard
                    title="Total Bookings"
                    value={dashboardStats.totalBookings}
                    color="indigo"
                    iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </div>

                {/* Content Container */}
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">🏛️ Daily Operations Summary</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Today's Activities
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-700">📅 New bookings received</span>
                              <span className="font-bold text-blue-600">{dashboardStats.todayBookings}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-700">📝 Complaints awaiting review</span>
                              <span className="font-bold text-yellow-600">{dashboardStats.pendingComplaints}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-700">👥 Job applications pending</span>
                              <span className="font-bold text-purple-600">{dashboardStats.pendingApplications}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-700">⛽ Fuel claims to process</span>
                              <span className="font-bold text-green-600">{dashboardStats.pendingFuelClaims}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-700">🚨 Active emergencies</span>
                              <span className="font-bold text-red-600">{dashboardStats.activeEmergencies}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quick Actions
                          </h4>
                          <div className="space-y-3">
                            <button
                              onClick={generateMonthlyReport}
                              className="w-full flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-left shadow-sm"
                            >
                              <span className="text-xl">�</span>
                              <span>Generate Monthly Report</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('bookings')}
                              className="w-full flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-left shadow-sm"
                            >
                              <span className="text-xl">📅</span>
                              <span>Manage Today's Bookings</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('emergencies')}
                              className="w-full flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-left shadow-sm"
                            >
                              <span className="text-xl">🚨</span>
                              <span>Handle Active Emergencies</span>
                            </button>
                            <button
                              onClick={generateComplaintReport}
                              className="w-full flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-left shadow-sm"
                            >
                              <span className="text-xl">📋</span>
                              <span>Export Complaint Report</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bookings Management Tab */}
                  {activeTab === 'bookings' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">📅 Bookings Management</h3>
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Total: {bookings.length} bookings
                          </div>
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            Unassigned: {bookings.filter(b => !b.assignedDriver).length} tours
                          </div>
                        </div>
                      </div>

                      {/* Today's Priority Tasks */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Daily Tasks - Ensure All Tours Have Assignments
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span>Tours needing drivers:</span>
                            <span className="font-bold text-orange-600">
                              {bookings.filter(b => !b.assignedDriver).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Guide requests pending:</span>
                            <span className="font-bold text-orange-600">
                              {bookings.filter(b => b.requestGuide && !b.assignedGuide).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Today's tours:</span>
                            <span className="font-bold text-green-600">
                              {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bookings Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tourist Details</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour Information</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Assignment</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide Assignment</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                              <tr key={booking._id} className={`${
                                new Date(booking.date).toDateString() === new Date().toDateString() 
                                  ? 'bg-blue-50' : ''
                              }`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{booking.touristName}</div>
                                    <div className="text-gray-500">{booking.touristEmail}</div>
                                    <div className="text-gray-500">👥 {booking.participants} pax</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{booking.activityName}</div>
                                    <div className="text-gray-500">📍 {booking.pickupLocation}</div>
                                    <div className="text-gray-500">🎯 {booking.destination}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {new Date(booking.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-500">⏰ {booking.time}</div>
                                    {new Date(booking.date).toDateString() === new Date().toDateString() && (
                                      <div className="text-blue-600 font-medium">TODAY</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {booking.assignedDriver ? (
                                    <div className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="font-medium text-green-800">{booking.assignedDriver.name}</span>
                                      </div>
                                      <div className="text-gray-500 text-xs">{booking.assignedDriver.phone}</div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAssignmentModal({ open: true, type: 'driver', bookingId: booking._id })}
                                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
                                    >
                                      🚗 Assign Driver
                                    </button>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {booking.requestGuide ? (
                                    booking.assignedGuide ? (
                                      <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                          <span className="font-medium text-green-800">{booking.assignedGuide.name}</span>
                                        </div>
                                        <div className="text-gray-500 text-xs">{booking.assignedGuide.specialty}</div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setAssignmentModal({ open: true, type: 'guide', bookingId: booking._id })}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs font-medium"
                                      >
                                        👨‍🏫 Assign Guide
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-gray-400 text-sm">No guide requested</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    booking.assignedDriver && (!booking.requestGuide || booking.assignedGuide)
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {booking.assignedDriver && (!booking.requestGuide || booking.assignedGuide)
                                      ? '✅ Ready'
                                      : '⏳ Pending'
                                    }
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {bookings.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-500 mb-2">No Bookings Found</h3>
                          <p className="text-gray-400">New bookings will appear here for assignment.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complaints Tab */}
                  {activeTab === 'complaints' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">📝 Complaints Management</h3>
                        <div className="flex items-center gap-4">
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            Pending: {complaints.filter(c => c.status === 'pending').length}
                          </div>
                          <button
                            onClick={generateComplaintReport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            📋 Generate Report
                          </button>
                        </div>
                      </div>

                      {/* Complaints Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="text-sm font-medium text-yellow-800">Pending Review</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {complaints.filter(c => c.status === 'pending').length}
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="text-sm font-medium text-blue-800">In Review</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {complaints.filter(c => c.status === 'in-review').length}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="text-sm font-medium text-green-800">Resolved</div>
                          <div className="text-2xl font-bold text-green-600">
                            {complaints.filter(c => c.status === 'resolved').length}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-sm font-medium text-gray-800">Total</div>
                          <div className="text-2xl font-bold text-gray-600">{complaints.length}</div>
                        </div>
                      </div>

                      {/* Complaints List */}
                      <div className="space-y-4">
                        {complaints.map((complaint) => (
                          <div key={complaint._id} className={`border-l-4 rounded-lg p-6 shadow-sm ${
                            complaint.status === 'pending' ? 'border-yellow-400 bg-yellow-50' :
                            complaint.status === 'in-review' ? 'border-blue-400 bg-blue-50' :
                            'border-green-400 bg-green-50'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h4 className="font-semibold text-gray-900 text-lg">{complaint.subject}</h4>
                                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                    complaint.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                    complaint.status === 'in-review' ? 'bg-blue-200 text-blue-800' :
                                    'bg-green-200 text-green-800'
                                  }`}>
                                    {complaint.status === 'pending' ? '⏳ PENDING' :
                                     complaint.status === 'in-review' ? '🔍 IN REVIEW' :
                                     '✅ RESOLVED'
                                    }
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Complaint Details</h5>
                                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                      {complaint.description}
                                    </p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Complainant Information</h5>
                                    <div className="bg-white p-3 rounded-lg border space-y-1 text-sm">
                                      <div><strong>Name:</strong> {complaint.complainantName}</div>
                                      <div><strong>Email:</strong> {complaint.complainantEmail}</div>
                                      <div><strong>Phone:</strong> {complaint.complainantPhone || 'Not provided'}</div>
                                      <div><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</div>
                                      <div><strong>Time:</strong> {new Date(complaint.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                  </div>
                                </div>

                                {complaint.priority && (
                                  <div className="mb-3">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      complaint.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      complaint.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {complaint.priority.toUpperCase()} PRIORITY
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col space-y-3 ml-6">
                                {complaint.status === 'pending' && (
                                  <button
                                    onClick={() => updateComplaintStatus(complaint._id, 'in-review')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                  >
                                    🔍 Start Review
                                  </button>
                                )}
                                {complaint.status === 'in-review' && (
                                  <button
                                    onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                  >
                                    ✅ Mark Resolved
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteComplaint(complaint._id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                  🗑️ Delete
                                </button>
                                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
                                  👁️ View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {complaints.length === 0 && (
                          <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-500 mb-2">No Complaints</h3>
                            <p className="text-gray-400">All complaint issues have been resolved or no complaints have been submitted.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job Applications Tab */}
                  {activeTab === 'applications' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Job Applications</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Total: {applications.length}
                          </span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Pending: {applications.filter(app => app.status === 'pending').length}
                          </span>
                        </div>
                      </div>

                      {/* Applications Grid */}
                      <div className="grid gap-6">
                        {applications.length > 0 ? applications.map((application) => (
                          <div key={application._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                  {application.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'A'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{application.fullName}</h4>
                                  <p className="text-sm text-gray-600">{application.email}</p>
                                  <p className="text-sm text-gray-500">Applied for: <span className="font-medium">{application.position}</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(application.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Application Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Phone:</span>
                                  <span className="text-sm font-medium">{application.phone || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Experience:</span>
                                  <span className="text-sm font-medium">{application.experience || 'N/A'} years</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">License:</span>
                                  <span className="text-sm font-medium">{application.licenseNumber || 'Not specified'}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Availability:</span>
                                  <span className="text-sm font-medium">{application.availability || 'Flexible'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Languages:</span>
                                  <span className="text-sm font-medium">{application.languages?.join(', ') || 'English'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Reference:</span>
                                  <span className="text-sm font-medium">{application.reference || 'Available upon request'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Cover Letter/Notes */}
                            {application.coverLetter && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</h5>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  {application.coverLetter.length > 200 
                                    ? `${application.coverLetter.substring(0, 200)}...` 
                                    : application.coverLetter}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {application.status === 'pending' && (
                              <div className="flex gap-3 pt-4 border-t">
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'approved')}
                                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                >
                                  ✓ Approve Application
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                  ✗ Reject Application
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                  📄 View Resume
                                </button>
                              </div>
                            )}

                            {/* Show status change info for processed applications */}
                            {application.status !== 'pending' && application.reviewedBy && (
                              <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                  {application.status === 'approved' ? 'Approved' : 'Rejected'} by {application.reviewedBy} 
                                  on {new Date(application.reviewDate).toLocaleDateString()}
                                  {application.reviewNotes && (
                                    <span className="block mt-1 text-gray-600">Note: {application.reviewNotes}</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-gray-500">No job applications have been submitted yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fuel Claims Tab */}
                  {activeTab === 'fuelClaims' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Fuel Claims Management</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Total: {fuelClaims.length}
                          </span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Pending: {fuelClaims.filter(claim => claim.status === 'pending').length}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Approved: {fuelClaims.filter(claim => claim.status === 'approved').length}
                          </span>
                        </div>
                      </div>

                      {/* Claims Grid */}
                      <div className="grid gap-6">
                        {fuelClaims.length > 0 ? fuelClaims.map((claim) => (
                          <div key={claim._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                                  🚗
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Claim #{claim.claimNumber}</h4>
                                  <p className="text-sm text-gray-600">Driver: {claim.driverName}</p>
                                  <p className="text-sm text-gray-500">Vehicle: {claim.vehicleNumber || 'Not specified'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(claim.submittedDate || claim.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Claim Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                              <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">${claim.amount}</div>
                                <div className="text-sm text-blue-600">Claim Amount</div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{claim.distance} km</div>
                                <div className="text-sm text-purple-600">Distance Traveled</div>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{claim.fuelLiters || 'N/A'} L</div>
                                <div className="text-sm text-orange-600">Fuel Consumed</div>
                              </div>
                            </div>

                            {/* Trip Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Trip Date:</span>
                                  <span className="text-sm font-medium">{new Date(claim.tripDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Start Location:</span>
                                  <span className="text-sm font-medium">{claim.startLocation || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">End Location:</span>
                                  <span className="text-sm font-medium">{claim.endLocation || 'Not specified'}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Fuel Rate:</span>
                                  <span className="text-sm font-medium">${claim.fuelRate || 'N/A'}/L</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Odometer Start:</span>
                                  <span className="text-sm font-medium">{claim.odometerStart || 'N/A'} km</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Odometer End:</span>
                                  <span className="text-sm font-medium">{claim.odometerEnd || 'N/A'} km</span>
                                </div>
                              </div>
                            </div>

                            {/* Purpose/Notes */}
                            {claim.purpose && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Trip Purpose:</h5>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{claim.purpose}</p>
                              </div>
                            )}

                            {/* Receipts */}
                            {claim.receipts && claim.receipts.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Receipts ({claim.receipts.length}):</h5>
                                <div className="flex gap-2">
                                  {claim.receipts.map((receipt, idx) => (
                                    <button key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">
                                      📄 Receipt {idx + 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {claim.status === 'pending' && (
                              <div className="flex gap-3 pt-4 border-t">
                                <button
                                  onClick={() => updateFuelClaimStatus(claim._id, 'approved')}
                                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                >
                                  ✓ Approve Claim
                                </button>
                                <button
                                  onClick={() => updateFuelClaimStatus(claim._id, 'rejected')}
                                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                  ✗ Reject Claim
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                  📊 View Analytics
                                </button>
                              </div>
                            )}

                            {/* Show review info for processed claims */}
                            {claim.status !== 'pending' && claim.reviewedBy && (
                              <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                  {claim.status === 'approved' ? 'Approved' : 'Rejected'} by {claim.reviewedBy} 
                                  on {new Date(claim.reviewDate).toLocaleDateString()}
                                  {claim.reviewNotes && (
                                    <span className="block mt-1 text-gray-600">Note: {claim.reviewNotes}</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fuel Claims Found</h3>
                            <p className="text-gray-500">No fuel claims have been submitted yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emergency Handling Tab */}
                  {activeTab === 'emergencies' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Emergency Management</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Active: {emergencies.filter(e => e.status === 'active').length}
                          </span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Pending: {emergencies.filter(e => e.status === 'pending').length}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Resolved: {emergencies.filter(e => e.status === 'resolved').length}
                          </span>
                        </div>
                      </div>

                      {/* Emergency Grid */}
                      <div className="grid gap-6">
                        {emergencies.length > 0 ? emergencies.map((emergency) => (
                          <div key={emergency._id} className={`border-2 rounded-xl p-6 hover:shadow-md transition-shadow ${
                            emergency.priority === 'critical' ? 'border-red-300 bg-red-50' :
                            emergency.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                            emergency.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                            'border-blue-300 bg-blue-50'
                          }`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                  emergency.priority === 'critical' ? 'bg-red-600' :
                                  emergency.priority === 'high' ? 'bg-orange-600' :
                                  emergency.priority === 'medium' ? 'bg-yellow-600' :
                                  'bg-blue-600'
                                }`}>
                                  🚨
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Emergency #{emergency.emergencyId}</h4>
                                  <p className="text-sm text-gray-600">{emergency.type || 'General Emergency'}</p>
                                  <p className="text-sm text-gray-500">Reporter: {emergency.reporterName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  emergency.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                  emergency.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  emergency.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {emergency.priority?.toUpperCase() || 'LOW'} PRIORITY
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  emergency.status === 'active' ? 'bg-red-100 text-red-800' :
                                  emergency.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {emergency.status?.toUpperCase() || 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {/* Emergency Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Location:</span>
                                  <span className="text-sm font-medium">{emergency.location || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Contact:</span>
                                  <span className="text-sm font-medium">{emergency.contactNumber || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Reported:</span>
                                  <span className="text-sm font-medium">{new Date(emergency.reportedAt).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Assigned Staff:</span>
                                  <span className="text-sm font-medium">{emergency.assignedStaff || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Estimated Time:</span>
                                  <span className="text-sm font-medium">{emergency.estimatedResponseTime || 'TBD'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Equipment Needed:</span>
                                  <span className="text-sm font-medium">{emergency.equipmentNeeded || 'None specified'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {emergency.description && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Emergency Description:</h5>
                                <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                                  {emergency.description}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                              {emergency.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleEmergencyAction(emergency._id, 'assign')}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                  >
                                    👤 Assign Staff
                                  </button>
                                  <button
                                    onClick={() => handleEmergencyAction(emergency._id, 'activate')}
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                  >
                                    🚨 Activate Response
                                  </button>
                                </>
                              )}
                              {emergency.status === 'active' && (
                                <button
                                  onClick={() => handleEmergencyAction(emergency._id, 'resolve')}
                                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                >
                                  ✓ Mark Resolved
                                </button>
                              )}
                              <button 
                                onClick={() => handleEmergencyAction(emergency._id, 'update')}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                              >
                                📝 Update Status
                              </button>
                            </div>

                            {/* Show resolution info for resolved emergencies */}
                            {emergency.status === 'resolved' && emergency.resolvedBy && (
                              <div className="pt-4 border-t mt-4">
                                <p className="text-xs text-gray-500">
                                  Resolved by {emergency.resolvedBy} on {new Date(emergency.resolvedAt).toLocaleString()}
                                  {emergency.resolutionNotes && (
                                    <span className="block mt-1 text-gray-600">Resolution: {emergency.resolutionNotes}</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Emergencies</h3>
                            <p className="text-gray-500">All clear! No emergency situations to handle at the moment.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medication Inventory Tab */}
                  {activeTab === 'inventory' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Medication Inventory</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Total Items: {medicationInventory.length}
                          </span>
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Low Stock: {medicationInventory.filter(med => med.quantity <= med.lowStockThreshold).length}
                          </span>
                        </div>
                      </div>

                      {/* Medication Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicationInventory.length > 0 ? medicationInventory.map((medication) => (
                          <div key={medication._id} className={`border rounded-xl p-5 ${
                            medication.quantity <= medication.lowStockThreshold 
                              ? 'border-red-300 bg-red-50' 
                              : medication.quantity <= medication.lowStockThreshold * 2
                                ? 'border-yellow-300 bg-yellow-50'
                                : 'border-gray-200 bg-white hover:shadow-md'
                          } transition-shadow`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                  💊
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm">{medication.name}</h4>
                                  <p className="text-xs text-gray-600">{medication.category || 'General Medicine'}</p>
                                </div>
                              </div>
                              {medication.quantity <= medication.lowStockThreshold && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  LOW STOCK
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">Quantity:</span>
                                <span className={`text-xs font-medium ${
                                  medication.quantity <= medication.lowStockThreshold ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {medication.quantity} {medication.unit || 'units'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">Expiry Date:</span>
                                <span className={`text-xs font-medium ${
                                  new Date(medication.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                    ? 'text-orange-600' : 'text-gray-900'
                                }`}>
                                  {new Date(medication.expiryDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">Location:</span>
                                <span className="text-xs font-medium">{medication.storageLocation || 'Main Storage'}</span>
                              </div>
                            </div>

                            {medication.description && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                  {medication.description.length > 80
                                    ? `${medication.description.substring(0, 80)}...`
                                    : medication.description}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors">
                                📝 Update Stock
                              </button>
                              {medication.quantity <= medication.lowStockThreshold && (
                                <button className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-medium transition-colors">
                                  🛒 Reorder
                                </button>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-full text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications Found</h3>
                            <p className="text-gray-500">No medication inventory available for review.</p>
                          </div>
                        )}
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