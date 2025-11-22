import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import NotificationBell from '../../components/NotificationBell';
import { useNotificationContext } from '../../contexts/NotificationContext';

// StatCard component
const StatCard = ({ title, value, color, iconPath }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-blue-600'
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>
    </div>
  );
};

const SafariDriverDashboard = () => {
  const { backendUser, user } = useAuth();
  const [activeTab, setActiveTab] = useState('tours');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Driver ID for notifications
  const [driverId, setDriverId] = useState(null);
  
  // Notifications context
  const { notifications, unreadCount } = useNotificationContext();

  // Dashboard data states
  const [assignedTours, setAssignedTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [tourHistory, setTourHistory] = useState([]);
  const [fuelClaims, setFuelClaims] = useState([]);
  const [odometerReadings, setOdometerReadings] = useState([]);
  const [submittingOdometer, setSubmittingOdometer] = useState(false);


  // Form states
  const [odometerForm, setOdometerForm] = useState({
    reading: '',
    image: null,
    type: 'start' // start or end
  });
  const [fuelClaimForm, setFuelClaimForm] = useState({
    tourId: '',
    startOdometer: '',
    endOdometer: '',
    totalDistance: 0,
    calculatedFuelCost: 0,
    notes: ''
  });
  const [showFuelClaimModal, setShowFuelClaimModal] = useState(false);
  const [submittingFuelClaim, setSubmittingFuelClaim] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user info
      const currentUser = backendUser || user;
      const userEmail = currentUser?.email;
      const userId = currentUser?._id || currentUser?.id;
      const userRole = currentUser?.role;

      console.log('🔍 SafariDriverDashboard - User info:', {
        currentUser,
        userEmail,
        userId,
        userRole
      });

      // Check if user has safariDriver role
      if (userRole !== 'safariDriver') {
        setError('Access denied. This dashboard is only for Safari Drivers.');
        return;
      }

      let driverId = userId;
      setDriverId(userId);

      // Fetch odometer readings
      try {
        console.log('🔄 Fetching odometer readings for driver:', driverId);
        const odometerResponse = await protectedApi.getOdometerReadings();
        if (odometerResponse?.data?.readings) {
          setOdometerReadings(odometerResponse.data.readings);
          console.log('✅ Fetched odometer readings:', odometerResponse.data.readings.length);
        }
      } catch (odometerError) {
        console.log('⚠️ Could not fetch odometer readings:', odometerError.message);
        setOdometerReadings([]);
      }

      // Fetch assigned tours for this driver
      try {
        console.log('🔄 Fetching assigned tours for driver:', driverId);
        const toursResponse = await protectedApi.getToursByDriver(driverId);
        if (toursResponse?.data?.data && Array.isArray(toursResponse.data.data)) {
          const tours = toursResponse.data.data;
          console.log('✅ Fetched tours:', tours.length);
          
          // Process tours to match expected format
          const processedTours = tours.map(tour => {
            const customerFirst = tour.bookingId?.customer?.firstName || tour.bookingId?.customerId?.firstName || '';
            const customerLast = tour.bookingId?.customer?.lastName || tour.bookingId?.customerId?.lastName || '';
            const fullName = `${customerFirst} ${customerLast}`.trim();

            // Safely derive destination as a string
            let destination = 'Safari Zone';
            if (typeof tour.bookingId?.destination === 'string' && tour.bookingId.destination.trim().length > 0) {
              destination = tour.bookingId.destination;
            } else if (tour.bookingId?.location?.name) {
              destination = tour.bookingId.location.name;
            } else if (tour.bookingId?.route) {
              const route = tour.bookingId.route;
              if (typeof route === 'string') {
                destination = route;
              } else if (route?.name) {
                destination = route.name;
              } else if (Array.isArray(route?.waypoints) && route.waypoints.length > 0) {
                const names = route.waypoints.map(w => (typeof w === 'string' ? w : (w?.name || 'Point'))).filter(Boolean);
                destination = names.length > 0 ? names.join(' → ') : `Route with ${route.waypoints.length} waypoints`;
              } else {
                destination = 'Planned Route';
              }
            }

            return {
              _id: tour._id,
              activityName: tour.bookingId?.activityName || tour.bookingId?.type || 'Safari Tour',
              touristName: fullName || 'Unknown Tourist',
              date: tour.preferredDate,
              time: tour.bookingId?.startTime || tour.bookingId?.preferredTime || '09:00',
              participants: tour.bookingId?.participants || tour.bookingId?.totalParticipants || 1,
              pickupLocation: tour.bookingId?.pickupLocation || tour.bookingId?.location?.name || 'Park Entrance',
              destination,
              driverFee: tour.bookingId?.driverFee || 0,
              status: tour.status?.toLowerCase() || 'pending',
              tourNotes: tour.tourNotes || tour.bookingId?.notes,
              assignedTourGuide: tour.assignedTourGuide,
              bookingId: tour.bookingId?._id
            };
          });
          
          setAssignedTours(processedTours);
          
          // Set active tour (if any)
          const active = processedTours.find(tour => tour.status === 'started' || tour.status === 'processing');
          setActiveTour(active || null);
          
          // Set tour history (completed tours)
          const history = processedTours.filter(tour => tour.status === 'ended' || tour.status === 'completed');
          setTourHistory(history);
          
          console.log('✅ Processed tours - Assigned:', processedTours.length, 'Active:', active ? 1 : 0, 'History:', history.length);
        } else {
          console.log('ℹ️ No tours found for driver');
          setAssignedTours([]);
          setTourHistory([]);
          setActiveTour(null);
        }
      } catch (tourError) {
        console.error('❌ Failed to fetch tours:', tourError);
        // Don't fail the entire dashboard if tours fail to load
        setAssignedTours([]);
        setTourHistory([]);
        setActiveTour(null);
      }

      // Fetch fuel claims for this driver
      try {
        console.log('🔄 Fetching fuel claims for driver:', driverId);
        const fuelClaimsResponse = await protectedApi.getFuelClaimsByDriver(driverId);
        console.log('📊 Fuel claims response:', fuelClaimsResponse);
        if (fuelClaimsResponse?.data && Array.isArray(fuelClaimsResponse.data)) {
          setFuelClaims(fuelClaimsResponse.data);
          console.log('✅ Fetched fuel claims:', fuelClaimsResponse.data.length, fuelClaimsResponse.data);
          // Log the first claim to see its structure
          if (fuelClaimsResponse.data.length > 0) {
            console.log('📋 First claim structure:', JSON.stringify(fuelClaimsResponse.data[0], null, 2));
          }
        } else {
          console.log('ℹ️ No fuel claims data found, setting empty array');
      setFuelClaims([]);
        }
      } catch (fuelClaimsError) {
        console.log('⚠️ Could not fetch fuel claims:', fuelClaimsError.message, fuelClaimsError);
        setFuelClaims([]);
      }

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };


  const acceptTour = async (tourId) => {
    try {
      await protectedApi.driverAcceptTour(tourId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to accept tour. Please try again.');
    }
  };


  const submitOdometerReading = async (e) => {
    e.preventDefault();
    setSubmittingOdometer(true);
    setError(null);
    console.log('🚀 Submitting odometer reading...', { odometerForm, activeTour, assignedTours });
    
    try {
      // Check if we have an active tour, if not, use the first assigned tour or prompt user
      let tourId = activeTour?._id;
      if (!tourId && assignedTours.length > 0) {
        tourId = assignedTours[0]._id;
        console.log('📝 Using first assigned tour:', tourId);
      }
      
      if (!tourId) {
        setError('No active tour found. Please ensure you have an assigned tour.');
        console.error('❌ No tour ID found');
        return;
      }

      // Validate form data
      if (!odometerForm.reading || !odometerForm.type || !odometerForm.image) {
        setError('Please fill in all required fields including the odometer photo.');
        console.error('❌ Missing required fields:', { 
          reading: !!odometerForm.reading, 
          type: !!odometerForm.type, 
          image: !!odometerForm.image 
        });
        return;
      }

      const formData = new FormData();
      formData.append('reading', odometerForm.reading);
      formData.append('type', odometerForm.type);
      formData.append('tourId', tourId);
        formData.append('image', odometerForm.image);

      console.log('📤 Sending form data:', {
        reading: odometerForm.reading,
        type: odometerForm.type,
        tourId: tourId,
        hasImage: !!odometerForm.image
      });

      const response = await protectedApi.submitOdometerReading(formData);
      console.log('✅ Odometer reading submitted successfully:', response);
      
      setOdometerForm({ reading: '', image: null, type: 'start' });
      await fetchDashboardData();
      setError(null);
      
      // Show success message
      alert('Odometer reading submitted successfully!');
      
    } catch (error) {
      console.error('❌ Error submitting odometer reading:', error);
      setError(`Failed to submit odometer reading: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmittingOdometer(false);
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      await protectedApi.driverUpdateTourStatus(tourId, status);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError(`Failed to update tour status to ${status}.`);
    }
  };

  const submitFuelClaim = async (e) => {
    e.preventDefault();
    setSubmittingFuelClaim(true);
    setError(null);
    
    try {
      const totalDistance = fuelClaimForm.endOdometer - fuelClaimForm.startOdometer;
      const fuelCostPerKm = 0.15; // Default fuel cost per km (can be configured)
      const calculatedFuelCost = totalDistance * fuelCostPerKm;

      const claimData = {
        ...fuelClaimForm,
        totalDistance,
        calculatedFuelCost,
        submittedBy: backendUser?.firstName && backendUser?.lastName 
          ? `${backendUser.firstName} ${backendUser.lastName}` 
          : backendUser?.name || 'Driver',
        submissionDate: new Date().toISOString(),
        status: 'pending'
      };

      console.log('🚀 Submitting fuel claim with data:', claimData);
      const response = await protectedApi.submitFuelClaim(claimData);
      console.log('✅ Fuel claim submission response:', response);
      
      setFuelClaimForm({ 
        tourId: '', 
        startOdometer: '', 
        endOdometer: '', 
        totalDistance: 0, 
        calculatedFuelCost: 0, 
        notes: '' 
      });
      setShowFuelClaimModal(false);
      
      // Refresh dashboard data to show the new claim
      console.log('🔄 Refreshing dashboard data...');
      await fetchDashboardData();
      setError(null);
      alert('Fuel claim submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting fuel claim:', error);
      setError(`Failed to submit fuel claim: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmittingFuelClaim(false);
    }
  };

  // Function to auto-populate odometer readings for a tour
  const populateOdometerFromReadings = (tourId) => {
    const tourReadings = odometerReadings.filter(reading => 
      reading.tourId && reading.tourId._id === tourId
    );
    
    if (tourReadings.length >= 2) {
      const startReading = tourReadings.find(r => r.type === 'start');
      const endReading = tourReadings.find(r => r.type === 'end');
      
      if (startReading && endReading) {
        setFuelClaimForm(prev => ({
          ...prev,
          tourId: tourId,
          startOdometer: startReading.reading,
          endOdometer: endReading.reading
        }));
      }
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

  const handleDownloadTourHistory = (tour) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Header bar
      pdf.setFillColor(249, 115, 22); // orange-500
      pdf.rect(0, 0, pageWidth, 28, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Wild Lanka Go - Tour Summary', margin, 18);

      // Reset text
      pdf.setTextColor(55, 65, 81); // gray-700
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      y = 42;
      pdf.text('Tour Details', margin, y);
      y += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const detailLines = [
        `Activity: ${tour.activityName || 'Safari Tour'}`,
        `Tourist: ${tour.touristName || 'Unknown'}`,
        `Date: ${new Date(tour.date).toLocaleDateString()}  Time: ${tour.time || '—'}`,
        `Participants: ${tour.participants ?? '—'}`,
        `Pickup: ${tour.pickupLocation || '—'}`,
        `Destination: ${tour.destination || '—'}`,
        `Driver Fee: $${tour.driverFee ?? 0}`,
        `Status: ${tour.status || 'completed'}`,
      ];

      detailLines.forEach((line) => {
        pdf.text(line, margin, y);
        y += 7;
      });

      if (tour.tourNotes) {
        y += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes', margin, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        const split = pdf.splitTextToSize(String(tour.tourNotes), pageWidth - margin * 2);
        pdf.text(split, margin, y);
        y += split.length * 6 + 4;
      }

      // Odometer section (if available in state for this tour)
      const relatedReadings = odometerReadings.filter(r => r.tourId && r.tourId._id === tour._id);
      if (relatedReadings.length > 0) {
        y += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Odometer Readings', margin, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');

        // Start / End readings if present
        const startReading = relatedReadings.find(r => r.type === 'start');
        const endReading = relatedReadings.find(r => r.type === 'end');
        if (startReading) {
          pdf.text(`Start: ${startReading.reading} km (${new Date(startReading.submittedAt).toLocaleString()})`, margin, y);
          y += 7;
        }
        if (endReading) {
          pdf.text(`End: ${endReading.reading} km (${new Date(endReading.submittedAt).toLocaleString()})`, margin, y);
          y += 7;
        }
        if (startReading && endReading) {
          const distance = Number(endReading.reading) - Number(startReading.reading);
          pdf.text(`Distance: ${isFinite(distance) ? distance : 0} km`, margin, y);
          y += 7;
        }
      }

      const filenameDate = new Date(tour.date).toISOString().split('T')[0];
      const safeName = (tour.activityName || 'safari-tour').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      pdf.save(`tour-${safeName}-${filenameDate}.pdf`);
    } catch (e) {
      console.error('Failed to generate tour PDF:', e);
      setError('Failed to generate tour PDF.');
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="safariDriver">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="safariDriver">
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Shell */}
        <div className="flex-1 pt-28 pb-10">
          <div className="mx-auto max-w-7xl px-4">
            {/* Grid: Sidebar | Main | Right */}
            <div className="grid grid-cols-12 gap-6">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-lg lg:text-xl font-bold text-gray-800">Safari Driver Portal</div>
                          <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                        </div>
                        <div className="block sm:hidden">
                          <div className="text-sm font-bold text-gray-800">Safari Driver</div>
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
                      { key: 'tours', label: 'Tours', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )},
                      { key: 'history', label: 'History', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )},
                      { key: 'fuel', label: 'Fuel Claims', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )},
                      { key: 'odometer', label: 'Odometer', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
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
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 lg:col-span-9">
                <div className="space-y-6">
                  {/* Top greeting banner */}
                  <div className="mb-6">
                    <div className="bg-blue-600 text-white rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1">
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
                          {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${backendUser?.firstName || user?.firstName || 'Safari Driver'}`}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">
                          You have {assignedTours.filter(t => t.status === 'pending').length} pending tours. Stay ready for your next adventure!
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <NotificationBell userId={driverId} />
                          <button
                            onClick={() => setActiveTab('tours')}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                          >
                            View Tours
                          </button>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        {/* simple illustration block */}
                        <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="mt-2 text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-xs lg:text-sm font-medium">Pending Tours</p>
                            <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{assignedTours.filter(t => t.status === 'pending').length}</p>
                            <p className="text-blue-200 text-xs mt-1">Awaiting your action</p>
                          </div>
                          <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                            <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                            <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{tourHistory.length}</p>
                            <p className="text-blue-200 text-xs mt-1">Successfully finished</p>
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
                            <p className="text-cyan-100 text-xs lg:text-sm font-medium">Total Distance</p>
                            <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">0 km</p>
                            <p className="text-cyan-200 text-xs mt-1">Distance covered</p>
                          </div>
                          <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                            <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
                            <p className="text-green-100 text-xs lg:text-sm font-medium">Fuel Claims</p>
                            <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{fuelClaims.length}</p>
                            <p className="text-green-200 text-xs mt-1">Claims submitted</p>
                          </div>
                          <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                            <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab buttons (for center area) */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { k: 'tours', t: 'Tour Management' },
                      { k: 'history', t: 'Tour History' },
                      { k: 'fuel', t: 'Fuel Claims' },
                      { k: 'odometer', t: 'Odometer Tracking' }
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

                  {/* Tab Content */}
                  {activeTab === 'assignments' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour Assignments</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            <p className="text-gray-600 text-lg">Your assigned tours will appear here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'odometer' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Odometer Tracking</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            <p className="text-gray-600 text-lg">Track your vehicle's odometer readings here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'fuelClaims' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Fuel Claims</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            <p className="text-gray-600 text-lg">Manage your fuel claims here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour History</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            <p className="text-gray-600 text-lg">View your completed tours here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            <p className="text-gray-600 text-lg">Your notifications will appear here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Tours Tab */}
                  {activeTab === 'tours' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour Management</h2>
                            </div>
                          </div>
                          <div className="p-8">
                    
                            {/* Pending Tours */}
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">Pending Tours ({assignedTours.filter(t => t.status === 'pending').length})</h4>
                              <div className="space-y-4">
                                {assignedTours.filter(t => t.status === 'pending').map((tour) => (
                                  <div key={tour._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">{tour.activityName}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">👤</span>
                                            <span>Tourist: {tour.touristName}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">📅</span>
                                            <span>Date: {new Date(tour.date).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">🕒</span>
                                            <span>Time: {tour.time}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">👥</span>
                                            <span>Participants: {tour.participants}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">📍</span>
                                            <span>Pickup: {tour.pickupLocation}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">🏁</span>
                                            <span>Destination: {tour.destination}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-500">💰</span>
                                            <span>Fee: ${tour.driverFee}</span>
                                          </div>
                                          {tour.tourNotes && (
                                            <div className="flex items-start gap-2 md:col-span-2">
                                              <span className="text-blue-500">📝</span>
                                              <span>Notes: {tour.tourNotes}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col space-y-2 ml-4">
                                        <button
                                          onClick={() => acceptTour(tour._id)}
                                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                                        >
                                          Accept Tour
                                        </button>
                                      </div>
                                    </div>
                          </div>
                        ))}
                        {assignedTours.filter(t => t.status === 'pending').length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No pending tour assignments</p>
                          </div>
                        )}
                              </div>
                            </div>

                            {/* Confirmed/Active Tours */}
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">Confirmed Tours ({assignedTours.filter(t => t.status === 'confirmed' || t.status === 'processing' || t.status === 'started').length})</h4>
                              <div className="space-y-4">
                                {assignedTours.filter(t => t.status === 'confirmed' || t.status === 'processing' || t.status === 'started').map((tour) => (
                                  <div key={tour._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
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
                                  <div>📊 Status: <span className="capitalize font-medium text-green-700">{tour.status}</span></div>
                                  {tour.tourNotes && <div>📝 Notes: {tour.tourNotes}</div>}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                {tour.status === 'confirmed' && (
                                  <button
                                    onClick={() => updateTourStatus(tour._id, 'processing')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                  >
                                    Start Tour
                                  </button>
                                )}
                                {tour.status === 'processing' && (
                                  <button
                                    onClick={() => updateTourStatus(tour._id, 'started')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                                  >
                                    Mark as Started
                                  </button>
                                )}
                                {tour.status === 'started' && (
                                  <button
                                    onClick={() => updateTourStatus(tour._id, 'ended')}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                                  >
                                    End Tour
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {assignedTours.filter(t => t.status === 'confirmed' || t.status === 'processing' || t.status === 'started').length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No confirmed tours</p>
                          </div>
                        )}
                      </div>
                    </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Odometer Tab */}
                {activeTab === 'odometer' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Odometer Tracking</h3>
                    
                    {/* Current Odometer Readings */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-3">Recent Odometer Readings</h4>
                      {odometerReadings.length > 0 ? (
                        <div className="space-y-3">
                          {odometerReadings.map((reading, index) => (
                            <div key={reading._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                              <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  reading.type === 'start' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {reading.type === 'start' ? 'Start' : 'End'}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {reading.reading} km
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reading.submittedAt).toLocaleDateString()} at {new Date(reading.submittedAt).toLocaleTimeString()}
                                  </span>
                                  {reading.tourId && (
                                    <span className="text-xs text-blue-600">
                                      Tour: {reading.tourId.bookingId?.type || 'Safari Tour'} - {reading.tourId.bookingId?.location?.name || 'Wildlife Park'}
                                    </span>
                                  )}
                  </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {reading.imageUrl && (
                                  <img 
                                    src={`http://localhost:5001${reading.imageUrl}`} 
                                    alt="Odometer reading" 
                                    className="w-16 h-12 object-cover rounded border"
                                    onClick={() => window.open(`http://localhost:5001${reading.imageUrl}`, '_blank')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                )}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  reading.status === 'submitted' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : reading.status === 'verified'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {reading.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm">No odometer readings submitted yet.</p>
                          <p className="text-gray-400 text-xs mt-1">Submit your first reading using the form below.</p>
                        </div>
                      )}
                    </div>

                    {/* Submit New Reading Form */}
                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-800 mb-4">Submit New Odometer Reading</h4>
                      
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                      
                      <form onSubmit={submitOdometerReading} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reading Type
                            </label>
                            <select
                              value={odometerForm.type}
                              onChange={(e) => setOdometerForm({...odometerForm, type: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            >
                              <option value="start">Start of Tour</option>
                              <option value="end">End of Tour</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Odometer Reading (km)
                            </label>
                            <input
                              type="number"
                              value={odometerForm.reading}
                              onChange={(e) => setOdometerForm({...odometerForm, reading: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Enter odometer reading"
                              min="0"
                              step="0.1"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Odometer Photo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setOdometerForm({...odometerForm, image: e.target.files[0]})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload a clear photo of the odometer display showing the reading
                          </p>
                        </div>

                        {/* Tour Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Tour
                          </label>
                          {assignedTours.length > 0 ? (
                            <select
                              value={activeTour?._id || ''}
                              onChange={(e) => {
                                const selectedTour = assignedTours.find(tour => tour._id === e.target.value);
                                setActiveTour(selectedTour);
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            >
                              <option value="">Select a tour</option>
                              {assignedTours.map((tour) => (
                                <option key={tour._id} value={tour._id}>
                                  {tour.activityName} - {new Date(tour.date).toLocaleDateString()} ({tour.status})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                No assigned tours found. Please contact your supervisor.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={submittingOdometer}
                            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                              submittingOdometer 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            {submittingOdometer ? 'Submitting...' : 'Submit Reading'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOdometerForm({ reading: '', image: null, type: 'start' })}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            Clear Form
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Fuel Claims Tab */}
                {activeTab === 'fuel' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Fuel Claims</h3>
                      <button
                        onClick={() => setShowFuelClaimModal(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        Submit New Claim
                      </button>
                    </div>

                    {/* Existing Fuel Claims */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-3">Recent Fuel Claims</h4>
                      {fuelClaims.length > 0 ? (
                        <div className="space-y-3">
                          {fuelClaims.map((claim, index) => (
                            <div key={claim._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                              <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  claim.status === 'pending' || claim.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : claim.status === 'approved' || claim.status === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {claim.status}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    Distance: {claim.distanceKm || claim.totalDistance || 0} km
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Amount: LKR {claim.claimAmount || claim.calculatedFuelCost || 0}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    Submitted: {new Date(claim.submittedAt || claim.submissionDate || claim.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  LKR {claim.claimAmount || claim.calculatedFuelCost || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm">No fuel claims submitted yet.</p>
                          <p className="text-gray-400 text-xs mt-1">Submit your first claim using the button above.</p>
                        </div>
                      )}
                    </div>

                    {/* Available Odometer Readings for Claims */}
                    {odometerReadings.length > 0 && (
                      <div className="border-t pt-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Available Odometer Readings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {odometerReadings.reduce((acc, reading) => {
                            const tourId = reading.tourId?._id;
                            if (!acc.find(item => item.tourId === tourId)) {
                              acc.push({
                                tourId,
                                tourName: reading.tourId?.bookingId?.type || 'Safari Tour',
                                readings: odometerReadings.filter(r => r.tourId?._id === tourId)
                              });
                            }
                            return acc;
                          }, []).map((tour, index) => {
                            const hasStartEnd = tour.readings.some(r => r.type === 'start') && tour.readings.some(r => r.type === 'end');
                            // Check if this tour already has a fuel claim
                            const hasExistingClaim = fuelClaims.some(claim => claim.tourId === tour.tourId);
                            
                            return (
                              <div key={index} className="p-4 border rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-2">{tour.tourName}</h5>
                                <div className="space-y-2">
                                  {tour.readings.map((reading, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        reading.type === 'start' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {reading.type}
                                      </span>
                                      <span>{reading.reading} km</span>
                                    </div>
                                  ))}
                                </div>
                                {hasStartEnd && (
                                  <div className="mt-3">
                                    {hasExistingClaim ? (
                                      <div className="w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm text-center">
                                        ✓ Fuel Claim Already Submitted
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          populateOdometerFromReadings(tour.tourId);
                                          setShowFuelClaimModal(true);
                                        }}
                                        className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 text-sm"
                                      >
                                        Create Fuel Claim
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour History</h3>
                    <div className="space-y-4">
                      {tourHistory.map((tour) => (
                        <div key={tour._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                                <div>📊 Status: <span className="capitalize font-medium text-gray-700">{tour.status}</span></div>
                                {tour.tourNotes && <div>📝 Notes: {tour.tourNotes}</div>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                              <button
                                onClick={() => handleDownloadTourHistory(tour)}
                                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tourHistory.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-500">No completed tours yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Fuel Claim Modal */}
        {showFuelClaimModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Fuel Claim</h3>
                  <button
                    onClick={() => setShowFuelClaimModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
      </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
        </div>
                )}

                <form onSubmit={submitFuelClaim} className="space-y-4">
          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tour
                    </label>
                    <select
                      value={fuelClaimForm.tourId}
                      onChange={(e) => {
                        const selectedTourId = e.target.value;
                        setFuelClaimForm(prev => ({ ...prev, tourId: selectedTourId }));
                        populateOdometerFromReadings(selectedTourId);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select a tour</option>
                      {assignedTours.map((tour) => (
                        <option key={tour._id} value={tour._id}>
                          {tour.activityName || 'Safari Tour'} - {new Date(tour.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Odometer (km)
                      </label>
            <input
                        type="number"
                        value={fuelClaimForm.startOdometer}
                        onChange={(e) => setFuelClaimForm(prev => ({ ...prev, startOdometer: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
          </div>
          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Odometer (km)
                      </label>
            <input
                        type="number"
                        value={fuelClaimForm.endOdometer}
                        onChange={(e) => setFuelClaimForm(prev => ({ ...prev, endOdometer: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
            />
          </div>
                  </div>

                  {fuelClaimForm.startOdometer && fuelClaimForm.endOdometer && fuelClaimForm.endOdometer > fuelClaimForm.startOdometer && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-sm text-blue-800">
                        <p><strong>Distance:</strong> {fuelClaimForm.endOdometer - fuelClaimForm.startOdometer} km</p>
                        <p><strong>Estimated Cost:</strong> LKR {((fuelClaimForm.endOdometer - fuelClaimForm.startOdometer) * 0.15).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={fuelClaimForm.notes}
                      onChange={(e) => setFuelClaimForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      placeholder="Any additional information about the fuel usage..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowFuelClaimModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingFuelClaim}
                      className={`flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        submittingFuelClaim 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {submittingFuelClaim ? 'Submitting...' : 'Submit Claim'}
                    </button>
          </div>
        </form>
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


export default SafariDriverDashboard;
