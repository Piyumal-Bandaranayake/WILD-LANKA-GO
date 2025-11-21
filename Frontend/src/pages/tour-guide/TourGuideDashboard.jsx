import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImage from '../../assets/logo.png';
import { 
  DashboardLayout, 
  DashboardHeader, 
  DashboardSidebar, 
  DashboardGrid,
  StatCard, 
  LoadingSpinner, 
  ErrorMessage,
  TabNavigation,
  ActionButton
} from '../../components/common/dashboard';
import { useDashboard } from '../../hooks/useDashboard';
import { getDashboardConfig, getGreetingMessage, formatStatValue } from '../../utils/dashboardUtils.jsx';

const TourGuideDashboard = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab, loading, setLoading, error, setError, handleError } = useDashboard('overview');
  
  // Get dashboard configuration for tour guide role
  const dashboardConfig = getDashboardConfig('tourGuide');

  // Dashboard data states
  const [assignedTours, setAssignedTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [tourHistory, setTourHistory] = useState([]);
  const [ratings, setRatings] = useState({ average: 0, total: 0 });

  // Form states

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null); // Clear any existing errors

    console.log('🔄 Loading tour guide dashboard data...');

    // Set default values first
    const defaultRatings = { average: 4.5, total: 0 };

    setAssignedTours([]);
    setTourHistory([]);
    setRatings(defaultRatings);
    setActiveTour(null);

    // Try to fetch real data, but don't fail if endpoints don't exist
    try {

      // Try tours endpoints
      try {
        console.log('🔍 TourGuideDashboard - User object:', user);
        console.log('🔍 TourGuideDashboard - User ID:', user?._id);
        const toursRes = await protectedApi.getAssignedTours(user?._id);
        if (toursRes?.data && Array.isArray(toursRes.data)) {
          setAssignedTours(toursRes.data);
          console.log('✅ Tours loaded successfully');
          console.log('🔍 Tours data received:', toursRes.data);
          console.log('🔍 First tour structure:', toursRes.data[0]);
          console.log('🔍 First tour bookingId:', toursRes.data[0]?.bookingId);
          
          // Check for active tour (handle different status formats)
          const active = toursRes.data.find(tour => 
            tour.status === 'in-progress' || 
            tour.status === 'Started' || 
            tour.status === 'started' ||
            tour.status === 'Processing' ||
            tour.status === 'processing'
          );
          setActiveTour(active || null);
          console.log('🔍 Active tour found:', active);
        }
      } catch (error) {
        console.log('ℹ️ Tours endpoint not available, using empty array');
        console.log('🔍 Error details:', error);
      }


      // Try ratings endpoint
      try {
        const ratingsRes = await protectedApi.getTourGuideRatings();
        if (ratingsRes?.data) {
          setRatings(ratingsRes.data);
          console.log('✅ Ratings loaded successfully');
        }
      } catch (error) {
        console.log('ℹ️ Ratings endpoint not available, using default ratings');
      }

      console.log('✅ Dashboard data loading completed');
      
    } catch (error) {
      console.warn('Dashboard data loading had some issues:', error);
      // Don't set error state - we're handling this gracefully
    } finally {
      setLoading(false);
    }
  };


  const updateTourStatus = async (tourId, status) => {
    try {
      await protectedApi.updateTourStatus(tourId, status);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      console.warn('Update tour status endpoint not available:', error);
      setError(`Tour status update feature is not yet implemented.`);
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
      console.warn('Generate report endpoint not available:', error);
      setError(`Report generation feature is not yet implemented.`);
    }
  };

  // PDF Generation Functions
  const createFormalHeader = (doc, title, subtitle = '') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Header background with gradient effect
    doc.setFillColor(30, 64, 175); // Blue-800
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Add actual logo
    try {
      // Add logo image (resize to fit nicely in header)
      doc.addImage(logoImage, 'PNG', 15, 8, 30, 30);
    } catch (error) {
      console.warn('Could not load logo image, using text fallback:', error);
      // Fallback to text logo if image fails
      doc.setFillColor(255, 255, 255);
      doc.circle(35, 25, 12, 'F');
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('WLG', 30, 30, { align: 'center' });
    }
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Wild Lanka Go', 55, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Wildlife Conservation Portal', 55, 28);
    
    // Contact info on the right
    doc.setFontSize(8);
    doc.text('123 Wildlife Sanctuary Road', pageWidth - margin, 15, { align: 'right' });
    doc.text('Colombo, Sri Lanka', pageWidth - margin, 22, { align: 'right' });
    doc.text('info@wildlankago.com', pageWidth - margin, 29, { align: 'right' });
    doc.text('+94 11 234 5678', pageWidth - margin, 36, { align: 'right' });
    
    // Document title
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 70);
    
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 80);
    }
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 70, { align: 'right' });
    
    // User info
    doc.setFontSize(10);
    doc.text(`Tour Guide: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Unknown'}`, pageWidth - margin, 80, { align: 'right' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 90, pageWidth - margin, 90);
    
    return 100; // Return Y position for content
  };

  const generateTourHistoryPDF = () => {
    if (!assignedTours || assignedTours.length === 0) {
      alert('No tour assignments found to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Tour Guide History Report', 'Complete record of your tour assignments and history');
    
    // Add summary section
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Summary', margin, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(`Total Tours: ${assignedTours.length}`, margin, yPosition);
    
    const completedTours = assignedTours.filter(tour => 
      tour.status === 'completed' || tour.status === 'Completed'
    ).length;
    doc.text(`Completed Tours: ${completedTours}`, margin + 80, yPosition);
    
    const pendingTours = assignedTours.filter(tour => 
      tour.status === 'pending' || tour.status === 'Pending' || 
      tour.status === 'confirmed' || tour.status === 'Confirmed'
    ).length;
    doc.text(`Pending Tours: ${pendingTours}`, margin + 160, yPosition);
    
    yPosition += 20;
    
    // Add tour details as list
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Tour Details', margin, yPosition);
    yPosition += 15;

    assignedTours.forEach((tour, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      const activityName = tour.bookingId?.activityName || tour.bookingId?.type || "Safari Tour";
      const touristName = tour.bookingId?.customer ? 
        `${tour.bookingId.customer.firstName || ''} ${tour.bookingId.customer.lastName || ''}`.trim() : 
        "Unknown";
      const date = new Date(tour.preferredDate).toLocaleDateString();
      const time = tour.bookingId?.preferredTime || "09:00";
      const participants = tour.bookingId?.participants || 1;
      const location = tour.bookingId?.pickupLocation || "Park Entrance";
      const status = tour.status || "Unknown";
      const fee = `$${tour.bookingId?.pricing?.guidePrice || 0}`;

      // Tour number and title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`Tour #${index + 1}: ${activityName}`, margin, yPosition);
      yPosition += 8;

      // Tour details in a structured format
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      
      const details = [
        `Tourist: ${touristName}`,
        `Date: ${date}`,
        `Time: ${time}`,
        `Participants: ${participants}`,
        `Location: ${location}`,
        `Status: ${status}`,
        `Guide Fee: ${fee}`
      ];

      details.forEach((detail, detailIndex) => {
        if (detailIndex % 2 === 0) {
          // Left column
          doc.text(detail, margin, yPosition);
        } else {
          // Right column
          doc.text(detail, margin + 100, yPosition);
          yPosition += 6;
        }
      });

      // If odd number of details, move to next line
      if (details.length % 2 === 1) {
        yPosition += 6;
      }

      // Add separator line
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    });

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Wild Lanka Go - Tour Guide Portal', margin, pageHeight - 15);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
    }

    doc.save(`tour-guide-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };


  if (loading) {
    return (
      <RoleGuard requiredRole="tourGuide">
        <LoadingSpinner 
          message="Loading your tour guide dashboard..." 
          color="border-purple-600" 
        />
      </RoleGuard>
    );
  }

  // Generate greeting message with stats
  const stats = {
    pendingTours: assignedTours.filter(t => 
      t.status === 'pending' || 
      t.status === 'Pending' ||
      t.status === 'Confirmed' ||
      t.status === 'confirmed' ||
      t.status === 'Started' ||
      t.status === 'started' ||
      t.status === 'Processing' ||
      t.status === 'processing'
    ).length
  };
  const { greeting, subtitle } = getGreetingMessage(user?.name, 'tourGuide', stats);

  return (
    <RoleGuard requiredRole="tourGuide">
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        <div className="flex-1 pt-28 pb-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-12 gap-4">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 lg:col-span-3">
                <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl lg:shadow-2xl p-4 lg:p-6 sticky top-20 lg:top-24 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                  <div className="relative z-10">
                    {/* Mobile Header - Horizontal Layout */}
                    <div className="flex items-center justify-between lg:justify-start gap-3 mb-4 lg:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl shadow-lg">
                          <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-lg lg:text-xl font-bold text-gray-800">Tour Guide Portal</div>
                          <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                        </div>
                        <div className="block sm:hidden">
                          <div className="text-sm font-bold text-gray-800">Tour Guide</div>
                        </div>
                      </div>
                      {/* Mobile Menu Toggle - Hidden on desktop */}
                      <button className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>

                    {[
                      { key: 'overview', label: 'Overview', icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                      )},
                      { key: 'assignments', label: 'Assignments', icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                      )},
                      { key: 'history', label: 'Tour History', icon: (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      )},
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 mb-2 ${
                          activeTab === item.key
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                            : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 hover:shadow-md'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                    
                    <div className="mt-6 pt-4 border-t border-gray-200/50">
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                      >
                        View Assignments
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 lg:col-span-9">
                {/* Top greeting banner */}
                <div className="mb-6">
                  <div className="bg-blue-600 text-white rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex-1">
                      <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
                        {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.firstName || user?.name?.split(' ')[0] || 'Tour Guide'}`}
                      </h2>
                      <p className="text-xs sm:text-sm opacity-90 mt-1">
                        You have {assignedTours.filter(t => 
                          t.status === 'pending' || 
                          t.status === 'Pending' ||
                          t.status === 'Confirmed' ||
                          t.status === 'confirmed' ||
                          t.status === 'Started' ||
                          t.status === 'started' ||
                          t.status === 'Processing' ||
                          t.status === 'processing'
                        ).length} assigned tours and {assignedTours.filter(t => 
                          t.status === 'Ended' || 
                          t.status === 'ended' ||
                          t.status === 'Completed' ||
                          t.status === 'completed'
                        ).length} completed tours. Stay ready for your next adventure!
                      </p>
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                      >
                        View Assignments
                      </button>
                    </div>
                    <div className="hidden md:block">
                      {/* simple illustration block */}
                      <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

            {/* Active Tour Alert */}
            {activeTour && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">Active Tour in Progress</h3>
                    <p className="text-blue-700 text-sm">
                      {activeTour.activityName || 'Tour Activity'}{activeTour.touristName ? ` - ${activeTour.touristName}` : ''}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            )}


                {/* Tab buttons (for center area) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { k: 'overview', t: 'Overview' },
                    { k: 'assignments', t: 'Tour Assignments' },
                    { k: 'history', t: 'Tour History' }
                  ].map(({ k, t }) => (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition
                      ${activeTab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* CENTER PANELS */}
                <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-xs lg:text-sm font-medium">Assigned Tours</p>
                              <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{assignedTours.filter(t => 
                                t.status === 'pending' || 
                                t.status === 'Pending' ||
                                t.status === 'Confirmed' ||
                                t.status === 'confirmed' ||
                                t.status === 'Started' ||
                                t.status === 'started' ||
                                t.status === 'Processing' ||
                                t.status === 'processing'
                              ).length}</p>
                              <p className="text-blue-200 text-xs mt-1">Ready for adventure</p>
                            </div>
                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-xs lg:text-sm font-medium">Completed Tours</p>
                              <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{assignedTours.filter(t => 
                                t.status === 'Ended' || 
                                t.status === 'ended' ||
                                t.status === 'Completed' ||
                                t.status === 'completed'
                              ).length}</p>
                              <p className="text-blue-200 text-xs mt-1">Successful adventures</p>
                            </div>
                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cyan-100 text-xs lg:text-sm font-medium">Average Rating</p>
                              <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{ratings.average.toFixed(1)}</p>
                              <p className="text-cyan-200 text-xs mt-1">Customer satisfaction</p>
                            </div>
                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-xs lg:text-sm font-medium">Total Reviews</p>
                              <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{ratings.total}</p>
                              <p className="text-green-200 text-xs mt-1">Customer feedback</p>
                            </div>
                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Tours */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                      <div className="relative z-10">
                        <div className="px-8 py-6 border-b border-gray-100/50">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold text-gray-800">Recent Tours</h4>
                            <div className="p-2 bg-blue-100 rounded-xl">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-8">
                          {assignedTours.length > 0 ? (
                            <div className="space-y-4">
                              {assignedTours.slice(0, 3).map((tour) => (
                                <div key={tour._id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-lg">{tour.bookingId?.activityName || tour.bookingId?.type || 'Safari Tour'}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{tour.bookingId?.pickupLocation || 'Park Entrance'}</p>
                                    <p className="text-sm text-gray-500 mt-1">Date: {new Date(tour.preferredDate).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                      tour.status === 'Ended' || tour.status === 'ended' || tour.status === 'Completed' || tour.status === 'completed'
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {tour.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No tours recorded</h3>
                              <p className="mt-1 text-sm text-gray-500">All clear! No recent tour activities.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                      <div className="relative z-10">
                        <div className="px-8 py-6 border-b border-gray-100/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour Assignments</h2>
                            </div>
                            <button
                              onClick={generateTourHistoryPDF}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                            >
                              Export PDF
                            </button>
                          </div>
                        </div>
                        <div className="p-8">
                          {assignedTours.filter(t => 
                            t.status === 'pending' || 
                            t.status === 'Pending' ||
                            t.status === 'Confirmed' ||
                            t.status === 'confirmed' ||
                            t.status === 'Started' ||
                            t.status === 'started' ||
                            t.status === 'Processing' ||
                            t.status === 'processing'
                          ).length > 0 ? (
                            <div className="space-y-4">
                              {assignedTours.filter(t => 
                                t.status === 'pending' || 
                                t.status === 'Pending' ||
                                t.status === 'Confirmed' ||
                                t.status === 'confirmed' ||
                                t.status === 'Started' ||
                                t.status === 'started' ||
                                t.status === 'Processing' ||
                                t.status === 'processing'
                              ).map((tour) => (
                                <div key={tour._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-gray-900">{tour.bookingId?.activityName || tour.bookingId?.type || 'Safari Tour'}</h3>
                                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                                        <div>👤 Tourist: {tour.bookingId?.customer?.firstName} {tour.bookingId?.customer?.lastName}</div>
                                        <div>📅 Date: {new Date(tour.preferredDate).toLocaleDateString()}</div>
                                        <div>🕒 Time: {tour.bookingId?.preferredTime || '09:00'}</div>
                                        <div>👥 Participants: {tour.bookingId?.participants || 1}</div>
                                        <div>📍 Location: {tour.bookingId?.pickupLocation || 'Park Entrance'}</div>
                                        <div>💰 Fee: ${tour.bookingId?.pricing?.guidePrice || 0}</div>
                                        <div>📝 Notes: {tour.tourNotes || 'No notes'}</div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                        tour.status === 'Started' || tour.status === 'started' || tour.status === 'Processing' || tour.status === 'processing'
                                          ? 'bg-yellow-100 text-yellow-800' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {tour.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned tours</h3>
                              <p className="mt-1 text-sm text-gray-500">No tour assignments at the moment.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                      <div className="relative z-10">
                        <div className="px-8 py-6 border-b border-gray-100/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour History</h2>
                            </div>
                            <button
                              onClick={generateTourHistoryPDF}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                            >
                              Export PDF
                            </button>
                          </div>
                        </div>
                        <div className="p-8">
                          {assignedTours.filter(t => 
                            t.status === 'Ended' || 
                            t.status === 'ended' ||
                            t.status === 'Completed' ||
                            t.status === 'completed'
                          ).length > 0 ? (
                            <div className="space-y-4">
                              {assignedTours.filter(t => 
                                t.status === 'Ended' || 
                                t.status === 'ended' ||
                                t.status === 'Completed' ||
                                t.status === 'completed'
                              ).map((tour) => (
                                <div key={tour._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-gray-900">{tour.bookingId?.activityName || tour.bookingId?.type || 'Safari Tour'}</h3>
                                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                                        <div>👤 Tourist: {tour.bookingId?.customer?.firstName} {tour.bookingId?.customer?.lastName}</div>
                                        <div>📅 Date: {new Date(tour.preferredDate).toLocaleDateString()}</div>
                                        <div>🕒 Time: {tour.bookingId?.preferredTime || '09:00'}</div>
                                        <div>👥 Participants: {tour.bookingId?.participants || 1}</div>
                                        <div>📍 Location: {tour.bookingId?.pickupLocation || 'Park Entrance'}</div>
                                        <div>💰 Fee: ${tour.bookingId?.pricing?.guidePrice || 0}</div>
                                        <div>📝 Notes: {tour.tourNotes || 'No notes'}</div>
                                        <div>✅ Completed: {new Date(tour.updatedAt).toLocaleDateString()}</div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                        ✅ Completed
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed tours</h3>
                              <p className="mt-1 text-sm text-gray-500">No completed tours yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour Progress Tab */}
                {activeTab === 'progress' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tour Progress Tracker</h3>

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
                                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    ✅ End Tour
                                  </button>
                                </>
                              )}
                              {activeTour.status === 'break' && (
                                <button
                                  onClick={() => updateTourStatus(activeTour._id, 'started')}
                                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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


                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tour Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Generate Reports</h4>
                        <div className="space-y-3">
                          <button
                            onClick={() => generateReport('weekly')}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
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
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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

                </div>
              </main>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
};

export default TourGuideDashboard;
