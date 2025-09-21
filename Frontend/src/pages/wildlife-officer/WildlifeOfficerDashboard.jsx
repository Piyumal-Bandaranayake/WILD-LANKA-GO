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
        protectedApi.getDrivers(),
        protectedApi.getTourGuides()
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
      await protectedApi.updateBooking(bookingId, { driverId });
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign driver:', error);
      setError('Failed to assign driver');
    }
  };

  const assignGuide = async (bookingId, guideId) => {
    try {
      await protectedApi.updateBooking(bookingId, { guideId });
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to assign guide:', error);
      setError('Failed to assign guide');
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      await protectedApi.updateComplaint(complaintId, { status });
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
      const report = await protectedApi.generateEmergencyReport({ type: 'monthly' });
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
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  // Define sidebar navigation items
  const sidebarItems = [
    { 
      key: 'overview', 
      label: 'Overview', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
        </svg>
      )
    },
    { 
      key: 'bookings', 
      label: 'Bookings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      key: 'complaints', 
      label: 'Complaints', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      key: 'applications', 
      label: 'Applications', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      key: 'fuelClaims', 
      label: 'Fuel Claims', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      key: 'reports', 
      label: 'Reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Define stats cards
  const statsCards = [
    {
      title: "Today's Bookings",
      value: dashboardStats.todayBookings,
      color: "blue",
      iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    },
    {
      title: "Pending Complaints",
      value: dashboardStats.pendingComplaints,
      color: "yellow",
      iconPath: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Job Applications",
      value: dashboardStats.pendingApplications,
      color: "purple",
      iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    {
      title: "Fuel Claims",
      value: dashboardStats.pendingFuelClaims,
      color: "red",
      iconPath: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    }
  ];

  // Define tabs for main content
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'bookings', name: 'Bookings Management', icon: '📅' },
    { id: 'complaints', name: 'Complaints', icon: '📝' },
    { id: 'applications', name: 'Job Applications', icon: '👥' },
    { id: 'fuelClaims', name: 'Fuel Claims', icon: '⛽' },
    { id: 'reports', name: 'Reports', icon: '📄' }
  ];

  // Right widgets
  const rightWidgets = [
    <MiniCalendar />,
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Quick Actions</h4>
      </div>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={generateMonthlyReport}
        >
          📄 Generate Report
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={() => setActiveTab('bookings')}
        >
          📅 Manage Bookings
        </Button>
      </div>
    </div>
  ];

  return (
    <ProtectedRoute allowedRoles={['WildlifeOfficer']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mx-4 mt-28">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <DashboardLayout
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchPlaceholder="Search bookings, complaints..."
          greetingMessage={`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Officer!`}
          statsCards={statsCards}
          rightWidgets={rightWidgets}
          headerColor="green"
        >

          <TabbedContent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headerColor="green"
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Operations Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Today's Activities">
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• {dashboardStats.todayBookings} new bookings received</li>
                      <li>• {dashboardStats.pendingComplaints} complaints awaiting review</li>
                      <li>• {dashboardStats.pendingApplications} job applications pending approval</li>
                      <li>• {dashboardStats.pendingFuelClaims} fuel claims requiring processing</li>
                    </ul>
                  </Card>
                  <Card title="Quick Actions">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={generateMonthlyReport}
                      >
                        📄 Generate Monthly Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('bookings')}
                      >
                        📅 Manage Today's Bookings
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Bookings Management Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings Management</h3>
                {bookings.length === 0 ? (
                  <EmptyState
                    icon="📅"
                    title="No Bookings"
                    description="No bookings have been made yet."
                  />
                ) : (
                  <DataTable
                    headers={['Tourist', 'Activity', 'Date', 'Driver', 'Guide', 'Actions']}
                    data={bookings}
                    renderRow={(booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
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
                          <Button variant="outline" size="sm">View Details</Button>
                        </td>
                      </tr>
                    )}
                  />
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Complaints Management</h3>
                {complaints.length === 0 ? (
                  <EmptyState
                    icon="📝"
                    title="No Complaints"
                    description="No complaints have been submitted yet."
                  />
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <Card key={complaint._id}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{complaint.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              From: {complaint.complainantName} | Date: {new Date(complaint.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <StatusBadge status={complaint.status} />
                            {complaint.status === 'pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => updateComplaintStatus(complaint._id, 'in-review')}
                              >
                                Mark In-Review
                              </Button>
                            )}
                            {complaint.status === 'in-review' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                              >
                                Mark Resolved
                              </Button>
                            )}
                            <Button variant="danger" size="sm">Delete</Button>
                            <Button variant="outline" size="sm">Generate Report</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Job Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Applications</h3>
                {applications.length === 0 ? (
                  <EmptyState
                    icon="👥"
                    title="No Applications"
                    description="No job applications have been submitted yet."
                  />
                ) : (
                  <DataTable
                    headers={['Applicant', 'Position', 'Experience', 'Applied Date', 'Status', 'Actions']}
                    data={applications}
                    renderRow={(application) => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.experience} years</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateApplicationStatus(application._id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => updateApplicationStatus(application._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="ml-2">View Details</Button>
                        </td>
                      </tr>
                    )}
                  />
                )}
              </div>
            )}

            {/* Fuel Claims Tab */}
            {activeTab === 'fuelClaims' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Fuel Claims Management</h3>
                {fuelClaims.length === 0 ? (
                  <EmptyState
                    icon="⛽"
                    title="No Fuel Claims"
                    description="No fuel claims have been submitted yet."
                  />
                ) : (
                  <DataTable
                    headers={['Claim #', 'Driver', 'Amount', 'Distance', 'Status', 'Actions']}
                    data={fuelClaims}
                    renderRow={(claim) => (
                      <tr key={claim._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.claimNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.driverName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${claim.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.distance} km</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {claim.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateFuelClaimStatus(claim._id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => updateFuelClaimStatus(claim._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="ml-2">View Details</Button>
                        </td>
                      </tr>
                    )}
                  />
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Income Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Generate Reports">
                    <div className="space-y-3">
                      <Button
                        variant="success"
                        className="w-full justify-start"
                        onClick={generateMonthlyReport}
                      >
                        📄 Generate Monthly Income Report
                      </Button>
                      <Button variant="primary" className="w-full justify-start">
                        📊 Generate Bookings Summary
                      </Button>
                      <Button variant="warning" className="w-full justify-start">
                        📈 Generate Financial Performance Report
                      </Button>
                    </div>
                  </Card>
                  <Card title="Report Statistics">
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
                  </Card>
                </div>
              </div>
            )}
          </TabbedContent>
        </DashboardLayout>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default WildlifeOfficerDashboard;