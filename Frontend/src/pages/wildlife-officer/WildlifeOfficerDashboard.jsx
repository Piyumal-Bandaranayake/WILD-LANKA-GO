import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import logoImage from '../../assets/logo.png';


// StatCard component
const StatCard = ({ title, value, color, iconPath }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
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

const WildlifeOfficerDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState(''); // YYYY-MM-DD
  const [bookingStatusFilter, setBookingStatusFilter] = useState(''); // pending, confirmed, completed, cancelled
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [hideAssignedBookings, setHideAssignedBookings] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);

  // Dashboard data states
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    pendingComplaints: 0,
    pendingApplications: 0,
    pendingFuelClaims: 0
  });

  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fuelClaims, setFuelClaims] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [donations, setDonations] = useState([]);
  
  // Fuel claim details modal state
  const [selectedFuelClaim, setSelectedFuelClaim] = useState(null);
  const [showFuelClaimModal, setShowFuelClaimModal] = useState(false);
  
  // Search states
  const [complaintSearchTerm, setComplaintSearchTerm] = useState('');
  const [filteredComplaints, setFilteredComplaints] = useState([]);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Reply modal states
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter complaints based on search term
  useEffect(() => {
    if (complaintSearchTerm.trim() === '') {
      setFilteredComplaints(complaints);
    } else {
      const filtered = complaints.filter(complaint =>
        complaint.username.toLowerCase().includes(complaintSearchTerm.toLowerCase())
      );
      setFilteredComplaints(filtered);
    }
  }, [complaints, complaintSearchTerm]);

  // Filter bookings based on search term, date, status, and today filter
  useEffect(() => {
    if (!bookings || bookings.length === 0) {
      setFilteredBookings([]);
      return;
    }

    let filtered = [...bookings];

    // Filter by search term (customer name, email, or booking ID)
    if (bookingSearchTerm) {
      const searchLower = bookingSearchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        const customerName = booking.touristName || '';
        const customerEmail = booking.touristEmail || '';
        const bookingId = booking.bookingId || '';
        const activityName = booking.activityId?.name || '';
        
        return customerName.toLowerCase().includes(searchLower) ||
               customerEmail.toLowerCase().includes(searchLower) ||
               bookingId.toLowerCase().includes(searchLower) ||
               activityName.toLowerCase().includes(searchLower);
      });
    }

    // Filter by date
    if (bookingDateFilter) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        const filterDate = new Date(bookingDateFilter);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filter by status
    if (bookingStatusFilter) {
      filtered = filtered.filter(booking => booking.status === bookingStatusFilter);
    }

    // Filter by today only
    if (showTodayOnly) {
      const today = new Date();
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate.toDateString() === today.toDateString();
      });
    }

    // Filter out assigned bookings (hide them from bookings tab)
    if (hideAssignedBookings) {
      filtered = filtered.filter(booking => {
        // Hide bookings that have both driver and tourGuide assigned
        const hasDriver = booking.driver || booking.assignDriver;
        const hasGuide = booking.tourGuide || booking.assignGuide;
        return !(hasDriver && hasGuide);
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, bookingSearchTerm, bookingDateFilter, bookingStatusFilter, showTodayOnly, hideAssignedBookings]);

  // Enhanced booking retrieval function
  const retrieveBookings = async () => {
    try {
      console.log('🔄 Retrieving bookings...');
      console.log('🔑 Current user:', user);
      console.log('🔑 Current token exists:', !!token);
      
      const response = await protectedApi.getBookings();
      console.log('🔍 API Response received:', response);
      
      // Handle different response structures
      let bookingsData = [];
      console.log('🔍 Full API response:', response);
      console.log('🔍 response.data:', response.data);
      
      if (response.data?.data?.bookings && Array.isArray(response.data.data.bookings)) {
        bookingsData = response.data.data.bookings;
        console.log('✅ Using response.data.data.bookings');
      } else if (response.data?.bookings && Array.isArray(response.data.bookings)) {
        bookingsData = response.data.bookings;
        console.log('✅ Using response.data.bookings');
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        bookingsData = response.data.data;
        console.log('✅ Using response.data.data');
      } else if (Array.isArray(response.data)) {
        bookingsData = response.data;
        console.log('✅ Using response.data');
      } else {
        console.warn('⚠️ No bookings data found in response');
        console.log('Available response paths:', {
          'response.data': response.data,
          'response.data.data': response.data?.data,
          'response.data.bookings': response.data?.bookings,
          'response.data.data.bookings': response.data?.data?.bookings
        });
      }

      // Format and enhance booking data
      const formattedBookings = bookingsData.map((booking, index) => {
        // Determine if booking is for today
        const today = new Date();
        const bookingDate = new Date(booking.bookingDate || booking.preferredDate);
        const isToday = bookingDate.toDateString() === today.toDateString();
        
        // Debug date comparison for first few bookings
        if (index < 3) {
          console.log('📅 Date comparison debug:', {
            bookingId: booking._id,
            bookingDate: booking.bookingDate,
            bookingDateString: bookingDate.toDateString(),
            todayString: today.toDateString(),
            isToday: isToday
          });
        }
        
        // Format customer information
        console.log('🔍 Customer data for booking:', booking._id, {
          customer: booking.customer,
          customerType: typeof booking.customer,
          customerKeys: booking.customer ? Object.keys(booking.customer) : 'No customer object'
        });
        
        // Customer information is populated from the User model
        const customerInfo = booking.customer || {};
        
        // Extract customer info from populated data or fallback to notes
        let customerName, customerEmail, customerPhone;
        
        if (customerInfo.firstName && customerInfo.lastName) {
          // Use populated customer data
          customerName = `${customerInfo.firstName} ${customerInfo.lastName}`;
          customerEmail = customerInfo.email || 'No email';
          customerPhone = customerInfo.phone || 'No phone';
        } else if (booking.notes) {
          // Fallback: extract from notes field
          const notesParts = booking.notes.split(' | ');
          const customerPart = notesParts.find(part => part.startsWith('Customer: '));
          const emailPart = notesParts.find(part => part.startsWith('Email: '));
          const phonePart = notesParts.find(part => part.startsWith('Phone: '));
          
          customerName = customerPart ? customerPart.replace('Customer: ', '') : 'Anonymous';
          customerEmail = emailPart ? emailPart.replace('Email: ', '') : 'No email';
          customerPhone = phonePart ? phonePart.replace('Phone: ', '') : 'No phone';
          
          console.log('📝 Extracted from notes:', { customerName, customerEmail, customerPhone });
        } else {
          // Final fallback
          customerName = 'Anonymous';
          customerEmail = 'No email';
          customerPhone = 'No phone';
        }

        // Format activity information - check multiple possible structures
        const activityInfo = booking.activityId || booking.activityDetails || {};
        const activityName = activityInfo.title || activityInfo.name || 
                           (booking.notes ? booking.notes.split(' | ')[0]?.replace('Activity: ', '') : null) ||
                           'Unknown Activity';
        const activityLocation = activityInfo.location || booking.location?.name || 'No location';
        const activityPrice = activityInfo.price || booking.pricing?.adultPrice || booking.pricing?.totalPrice || 0;

        // Format staff assignments
        const assignedDriver = booking.driver || booking.assignDriver;
        const assignedGuide = booking.tourGuide || booking.assignGuide;

        return {
          ...booking,
          // Enhanced customer info
          touristName: customerName,
          touristEmail: customerEmail,
          touristPhone: customerPhone,
          
          // Enhanced activity info
          activityId: {
            name: activityName,
            location: activityLocation,
            price: activityPrice
          },
          
          // Staff assignments
          assignDriver: assignedDriver,
          assignGuide: assignedGuide,
          
          // Participant count - check multiple possible fields
          numberOfParticipants: booking.numberOfParticipants || booking.totalParticipants || 
                               (booking.numberOfAdults || 0) + (booking.numberOfChildren || 0) || 1,
          
          // Total amount - check multiple possible fields
          totalAmount: booking.totalAmount || booking.pricing?.totalPrice || 0,
          
          // Today's booking flag
          isToday: isToday,
          
          // Sequential number for display
          displayNumber: index + 1,
          
          // Formatted dates
          formattedBookingDate: bookingDate.toLocaleDateString(),
          formattedCreatedDate: new Date(booking.createdAt).toLocaleDateString(),
          
          // Status formatting
          displayStatus: booking.status === 'pending' ? 'Pending' :
                        booking.status === 'confirmed' ? 'Confirmed' :
                        booking.status === 'completed' ? 'Completed' :
                        booking.status === 'cancelled' ? 'Cancelled' : 'Pending'
        };
      });

      console.log(`📊 Retrieved ${formattedBookings.length} bookings`);
      if (formattedBookings.length > 0) {
        console.log('📋 Sample booking:', formattedBookings[0]);
      } else {
        console.log('📋 No bookings found in response');
      }
      
      return formattedBookings;
    } catch (error) {
      console.error('❌ Failed to retrieve bookings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Fetching dashboard data...');

      // Fetch all required data in parallel
      const [
        bookingsData,
        toursData,
        complaintsRes,
        applicationsRes,
        fuelClaimsRes,
        availableGuidesRes,
        feedbackRes,
        donationsRes
      ] = await Promise.allSettled([
        retrieveBookings(),
        protectedApi.getAllTours(),
        protectedApi.getComplaints(),
        protectedApi.getJobApplications(),
        protectedApi.getFuelClaims(),
        protectedApi.getAvailableGuides(),
        protectedApi.getFeedbacks(),
        protectedApi.getAllDonations()
      ]);

      // Handle bookings data
      if (bookingsData.status === 'fulfilled') {
        setBookings(bookingsData.value);
      } else {
        console.error('❌ Failed to fetch bookings:', bookingsData.reason);
      }
      
      // Process tours data
      let toursDataArray = [];
      if (toursData.status === 'fulfilled') {
        const toursResponse = toursData.value;
        toursDataArray = Array.isArray(toursResponse.data?.data) ? toursResponse.data.data : Array.isArray(toursResponse.data) ? toursResponse.data : [];
        console.log('🎯 Fetched tours:', toursDataArray.length);
        if (toursDataArray.length > 0) {
          console.log('🎯 Sample tour data:', toursDataArray[0]);
          console.log('🎯 Tour bookingId type:', typeof toursDataArray[0].bookingId);
          console.log('🎯 Tour assignedTourGuide:', toursDataArray[0].assignedTourGuide);
          console.log('🎯 Tour assignedDriver:', toursDataArray[0].assignedDriver);
        }
      } else {
        console.error('❌ Failed to fetch tours:', toursData.reason);
      }
      setTours(toursDataArray);
      
      // Process complaints data
      let complaintsData = [];
      if (complaintsRes.status === 'fulfilled') {
        const complaintsResData = complaintsRes.value;
        complaintsData = Array.isArray(complaintsResData.data?.data) ? complaintsResData.data.data : Array.isArray(complaintsResData.data) ? complaintsResData.data : [];
        console.log('📋 Fetched complaints:', complaintsData.length);
        if (complaintsData.length > 0) {
          console.log('📋 Sample complaint data:', complaintsData[0]);
          console.log('📋 Available complaint fields:', Object.keys(complaintsData[0]));
        }
      } else {
        console.error('❌ Failed to fetch complaints:', complaintsRes.reason);
      }
      setComplaints(complaintsData);
      
      // Process feedback data
      let feedbackData = [];
      if (feedbackRes.status === 'fulfilled') {
        const feedbackResData = feedbackRes.value;
        feedbackData = Array.isArray(feedbackResData.data?.data) ? feedbackResData.data.data : Array.isArray(feedbackResData.data) ? feedbackResData.data : [];
        console.log('📝 Fetched feedback:', feedbackData.length);
        console.log('📝 Sample feedback data:', feedbackData[0]);
        console.log('📝 Full feedback response:', feedbackResData);
      } else {
        console.error('❌ Failed to fetch feedback:', feedbackRes.reason);
      }
      setFeedback(feedbackData);
      
      // Process applications data - check multiple response formats
      let applicationsData = [];
      if (applicationsRes.status === 'fulfilled') {
        const responseData = applicationsRes.value?.data;
        console.log('🔍 Applications API Response:', responseData);
        if (Array.isArray(responseData)) {
          applicationsData = responseData; // Direct array format
          console.log('✅ Using direct array format for applications:', applicationsData.length, 'items');
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          applicationsData = responseData.data; // Nested data format
          console.log('✅ Using nested data format for applications:', applicationsData.length, 'items');
        } else if (responseData?.applications && Array.isArray(responseData.applications)) {
          applicationsData = responseData.applications; // Alternative format
          console.log('✅ Using alternative format for applications:', applicationsData.length, 'items');
        } else {
          console.warn('⚠️ Unexpected applications response format:', responseData);
          console.log('Response keys:', Object.keys(responseData || {}));
          console.log('Data keys:', Object.keys(responseData?.data || {}));
        }
        console.log('📋 Job applications fetched successfully:', applicationsData.length);
        console.log('📋 Full applications response:', applicationsRes.value);
      } else {
        console.error('❌ Failed to fetch job applications:', applicationsRes.reason);
        console.log('🔍 This might be due to insufficient permissions. User role may not be wildlifeOfficer or admin.');
        console.log('🔍 Current user info:', { 
          user: user, 
          userRole: user?.role 
        });
      }
      setApplications(applicationsData);
      
      // Process fuel claims data
      let fuelClaimsData = [];
      if (fuelClaimsRes.status === 'fulfilled') {
        const fuelClaimsResData = fuelClaimsRes.value;
        fuelClaimsData = Array.isArray(fuelClaimsResData.data) ? fuelClaimsResData.data : [];
        console.log('📊 Fuel claims data:', fuelClaimsData);
      } else {
        console.error('❌ Failed to fetch fuel claims:', fuelClaimsRes.reason);
      }
      setFuelClaims(fuelClaimsData);
      
      // Process available guides data
      let guides = [];
      if (availableGuidesRes.status === 'fulfilled') {
        const availableGuidesResData = availableGuidesRes.value;
        guides = Array.isArray(availableGuidesResData.data) ? availableGuidesResData.data : [];
        console.log('🎯 Available guides:', guides.map(g => ({ id: g._id, name: `${g.firstname} ${g.lastname}`, isAvailable: g.isAvailable })));
      } else {
        console.error('❌ Failed to fetch available guides:', availableGuidesRes.reason);
      }
      setAvailableGuides(guides);

      // Process donations data
      let donationsData = [];
      if (donationsRes.status === 'fulfilled') {
        const donationsResData = donationsRes.value;
        console.log('🔍 Full donations response:', donationsResData);
        console.log('🔍 donationsResData.data:', donationsResData.data);
        console.log('🔍 donationsResData.data type:', typeof donationsResData.data);
        console.log('🔍 donationsResData.data isArray:', Array.isArray(donationsResData.data));
        
        // Handle multiple possible response structures
        if (donationsResData.data?.data?.data && Array.isArray(donationsResData.data.data.data)) {
          donationsData = donationsResData.data.data.data;
          console.log('✅ Using donationsResData.data.data.data');
        } else if (donationsResData.data?.data?.donations && Array.isArray(donationsResData.data.data.donations)) {
          donationsData = donationsResData.data.data.donations;
          console.log('✅ Using donationsResData.data.data.donations');
        } else if (donationsResData.data?.data && Array.isArray(donationsResData.data.data)) {
          donationsData = donationsResData.data.data;
          console.log('✅ Using donationsResData.data.data');
        } else if (donationsResData.data?.donations && Array.isArray(donationsResData.data.donations)) {
          donationsData = donationsResData.data.donations;
          console.log('✅ Using donationsResData.data.donations');
        } else if (Array.isArray(donationsResData.data)) {
          donationsData = donationsResData.data;
          console.log('✅ Using donationsResData.data directly');
        } else {
          console.log('❌ No valid donations data found');
          console.log('Available keys:', Object.keys(donationsResData.data || {}));
        }
        
        console.log('💰 Final donations data:', donationsData);
        console.log('💰 Sample donation:', donationsData[0]);
      } else {
        console.error('❌ Failed to fetch donations:', donationsRes.reason);
      }
      setDonations(donationsData);

      // Calculate dashboard stats
      const today = new Date().toDateString();
      const currentBookings = bookingsData.status === 'fulfilled' ? bookingsData.value : [];
      const todayBookingsCount = currentBookings.filter(booking => booking.isToday).length;
      const todayCreatedBookingsCount = currentBookings.filter(
        booking => new Date(booking.createdAt).toDateString() === today
      ).length;
      
      // Debug today's bookings
      console.log('📅 Today calculation debug:', {
        today: today,
        totalBookings: currentBookings.length,
        todayBookingsCount: todayBookingsCount,
        todayCreatedBookingsCount: todayCreatedBookingsCount,
        bookingsWithIsToday: currentBookings.filter(booking => booking.isToday).map(b => ({
          id: b._id,
          bookingDate: b.bookingDate,
          isToday: b.isToday
        }))
      });

      setDashboardStats({
        totalBookings: currentBookings.length,
        todayBookings: todayBookingsCount, // Bookings scheduled for today
        todayScheduledBookings: todayBookingsCount, // Bookings scheduled for today
        pendingComplaints: complaintsData.filter(c => c.status === 'pending').length,
        pendingApplications: applicationsData.filter(a => a.status === 'Submitted').length,
        pendingFuelClaims: fuelClaimsData.filter(f => f.status === 'pending' || f.status === 'Pending').length,
        availableGuides: guides.length
      });

      console.log('✅ Dashboard data loaded successfully');
      console.log('📊 Stats:', {
        totalBookings: currentBookings.length,
        todayBookings: todayBookingsCount,
        todayScheduledBookings: todayBookingsCount,
        todayCreatedBookings: todayCreatedBookingsCount
      });

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Booking management handlers
  const handleViewBooking = (booking) => {
    console.log('🔍 View booking data structure:', {
      driver: booking.driver,
      assignDriver: booking.assignDriver,
      tourGuide: booking.tourGuide,
      assignGuide: booking.assignGuide,
      fullBooking: booking
    });
    setSelectedBooking(booking);
    setViewModalOpen(true);
  };

  const handleUpdateBooking = async (booking) => {
    // Initialize assignment fields with current booking values
    const bookingWithAssignments = {
      ...booking,
      assignDriver: booking.driver || null,
      assignGuide: booking.tourGuide || null
    };
    setSelectedBooking(bookingWithAssignments);
    
    // Fetch staff available for the specific booking date
    const bookingDate = booking.bookingDate || booking.preferredDate;
    console.log('🎯 Fetching staff for booking date:', bookingDate);
    await fetchStaff(bookingDate); 
    setUpdateModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId) => {
  if (!window.confirm("Are you sure you want to delete this booking?")) return;

  try {
    await protectedApi.deleteBooking(bookingId);
    setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    alert("Booking deleted successfully!");
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete booking. Please try again.");
  }
};


  const handleViewSpecialRequests = (booking) => {
    const bookingNumber = bookings.findIndex(b => b._id === booking._id) + 1;
    alert(`Special Requests for Booking #${bookingNumber}:\n\n${booking.specialRequests}`);
  };

  const closeModals = () => {
    setViewModalOpen(false);
    setUpdateModalOpen(false);
    setSelectedBooking(null);
    closeApplicationModals();
  };

   // Fetch all staff (show availability status instead of filtering)
  const fetchStaff = async (bookingDate = null) => {
    try {
      // Build query parameters - REMOVE isAvailable filter to show all staff
      const queryParams = {};
      if (bookingDate) {
        queryParams.date = bookingDate;
      }
      
      // Fetch ALL staff, not just available ones - let UI show availability status
      const res = await protectedApi.getAvailableStaff(queryParams);
      const drivers = res.data.data.filter(u => u.role === 'safariDriver');
      const guides = res.data.data.filter(u => u.role === 'tourGuide');
      setAvailableDrivers(drivers);
      setAvailableGuides(guides);
      console.log('🎯 Fetched all staff:', { 
        bookingDate: bookingDate || 'all dates',
        drivers: drivers.length, 
        guides: guides.length,
        allStaff: res.data.data.length,
        availableDrivers: drivers.filter(d => d.isAvailable).length,
        availableGuides: guides.filter(g => g.isAvailable).length,
        allDrivers: drivers.map(d => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, isAvailable: d.isAvailable })),
        allGuides: guides.map(g => ({ id: g._id, name: `${g.firstName} ${g.lastName}`, isAvailable: g.isAvailable }))
      });
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  // Fetch all staff (for comparison or when needed)
  const fetchAllStaff = async () => {
    try {
      const res = await protectedApi.getAvailableStaff(); // No isAvailable filter
      const allDrivers = res.data.data.filter(u => u.role === 'safariDriver');
      const allGuides = res.data.data.filter(u => u.role === 'tourGuide');
      console.log('🎯 Fetched all staff:', { 
        allDrivers: allDrivers.length, 
        allGuides: allGuides.length,
        availableDrivers: allDrivers.filter(d => d.isAvailable).length,
        availableGuides: allGuides.filter(g => g.isAvailable).length
      });
      return { allDrivers, allGuides };
    } catch (err) {
      console.error('Error fetching all staff:', err);
      return { allDrivers: [], allGuides: [] };
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
    fetchStaff();
  }, []);


  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await protectedApi.updateBooking(bookingId, { status: newStatus });
      if (response.data.success) {
        setSuccessMessage(`Booking status updated to ${newStatus}`);
        // Update the local state immediately
        const updatedBookings = bookings.map(b => 
          b._id === bookingId ? { ...b, status: newStatus } : b
        );
        setBookings(updatedBookings);
        // Also refresh all data to ensure consistency
        fetchDashboardData();
      } else {
        setError('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Failed to update booking status');
    }
  };




  const assignGuide = async (bookingId, guideId) => {
    try {
      // Find the booking
      const booking = bookings.find(b => b._id === bookingId);
      if (!booking) {
        setError('Booking not found');
        return;
      }

      // Check if booking is for today
      const today = new Date();
      const bookingDate = new Date(booking.bookingDate || booking.preferredDate);
      const isToday = bookingDate.toDateString() === today.toDateString();
      
      if (!isToday) {
        setError('Guides can only be assigned to today\'s bookings');
        return;
      }

      // Find the guide details
      const guide = availableGuides.find(g => g._id === guideId);
      if (!guide) {
        setError('Guide not found');
        return;
      }

      // Check if guide is available
      if (!guide.isAvailable) {
        setError('Guide is not available');
        return;
      }

      // Update the booking with assigned guide locally
      const updatedBookings = bookings.map(b => 
        b._id === bookingId 
          ? { ...b, assignedGuide: guide }
          : b
      );
      setBookings(updatedBookings);

      // Make guide unavailable
      const updatedGuides = availableGuides.map(g => 
        g._id === guideId 
          ? { ...g, isAvailable: false }
          : g
      );
      setAvailableGuides(updatedGuides);

      // Get the sequential booking number
      const bookingNumber = bookings.findIndex(b => b._id === bookingId) + 1;
      
      setSuccessMessage(`Guide ${guide.firstname} ${guide.lastname} assigned to booking #${bookingNumber} and marked as unavailable`);
      
      // Here you would typically make an API call to save the assignment and update availability
      // await protectedApi.updateBooking(bookingId, { assignedGuide: guideId });
      // await protectedApi.updateGuideAvailability(guideId, { isAvailable: false });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
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

  // Reply functions
  const openReplyModal = (complaint) => {
    setSelectedComplaint(complaint);
    setReplyMessage('');
    setEditingReply(null);
    setReplyModalOpen(true);
  };

  const openEditReplyModal = (complaint, reply) => {
    setSelectedComplaint(complaint);
    setReplyMessage(reply.message);
    setEditingReply(reply);
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setSelectedComplaint(null);
    setReplyMessage('');
    setEditingReply(null);
  };

  const handleAddReply = async () => {
    if (!replyMessage.trim() || !selectedComplaint) return;
    
    try {
      setReplyLoading(true);
      const officerUsername = user?.name || 'Wildlife Officer';
      
      await protectedApi.addReply(selectedComplaint._id, {
        officerUsername,
        message: replyMessage.trim()
      });
      
      setSuccessMessage('Reply added successfully');
      await fetchDashboardData(); // Refresh data
      closeReplyModal();
    } catch (error) {
      console.error('Failed to add reply:', error);
      setError('Failed to add reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateReply = async () => {
    if (!replyMessage.trim() || !selectedComplaint || !editingReply) return;
    
    try {
      setReplyLoading(true);
      
      await protectedApi.updateReply(selectedComplaint._id, {
        replyId: editingReply._id,
        message: replyMessage.trim()
      });
      
      setSuccessMessage('Reply updated successfully');
      await fetchDashboardData(); // Refresh data
      closeReplyModal();
    } catch (error) {
      console.error('Failed to update reply:', error);
      setError('Failed to update reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteReply = async (complaintId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      await protectedApi.deleteReply(complaintId, replyId);
      setSuccessMessage('Reply deleted successfully');
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete reply:', error);
      setError('Failed to delete reply');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint and all its replies? This action cannot be undone.')) return;
    
    try {
      await protectedApi.deleteComplaintByOfficer(complaintId);
      setSuccessMessage('Complaint and all replies deleted successfully');
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete complaint:', error);
      setError('Failed to delete complaint');
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
    doc.text(`Wildlife Officer: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Anonymous'}`, pageWidth - margin, 80, { align: 'right' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 90, pageWidth - margin, 90);
    
    return 100; // Return Y position for content
  };

  const generateComplaintPDF = async (complaintId) => {
    try {
      setLoading(true);
      
      // Find the specific complaint
      const complaint = complaints.find(c => c._id === complaintId);
      if (!complaint) {
        setError('Complaint not found');
        return;
      }

      // Debug: Log complaint data structure
      console.log('🔍 Complaint data for PDF:', complaint);
      console.log('🔍 Available fields:', Object.keys(complaint));
      console.log('🔍 Message field:', complaint.message);
      console.log('🔍 Replies:', complaint.replies);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      let yPosition = createFormalHeader(doc, 'Complaint Report', 'Detailed complaint information and resolution status');
      
      // Complaint details section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Complaint Details', margin, yPosition);
      yPosition += 15;
      
      // Complaint information
      const complaintInfo = [
        ['Complaint ID:', complaint._id],
        ['Complainant:', complaint.username || 'Anonymous'],
        ['Email:', complaint.email || 'N/A'],
        ['Role:', complaint.role || 'N/A'],
        ['Status:', complaint.status || 'Pending'],
        ['Date Submitted:', complaint.date ? new Date(complaint.date).toLocaleDateString() : (complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A')],
        ['Last Updated:', complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : 'N/A']
      ];
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      
      complaintInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 60, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Description section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Description', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      
      // Split long text into multiple lines
      const description = complaint.message || 'No description provided';
      const splitDescription = doc.splitTextToSize(description, pageWidth - 2 * margin);
      doc.text(splitDescription, margin, yPosition);
      yPosition += splitDescription.length * 5 + 15;
      
      // Location section if available
      if (complaint.location && complaint.location.trim() !== '') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Location', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text(complaint.location, margin, yPosition);
        yPosition += 15;
      }
      
      // Replies section if available
      if (complaint.replies && complaint.replies.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Replies & Resolution', margin, yPosition);
        yPosition += 15;
        
        // Table for replies
        const tableColumns = ['Date', 'Replied By', 'Reply'];
        const tableRows = complaint.replies.map(reply => [
          reply.date ? new Date(reply.date).toLocaleDateString() : 'N/A',
          reply.officerUsername || 'System',
          reply.message ? (reply.message.length > 50 ? reply.message.substring(0, 50) + '...' : reply.message) : 'No reply text'
        ]);
        
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [30, 64, 175], // Blue-800
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 55,
            halign: 'left'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Gray-50
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' }, // Date
            1: { cellWidth: 30, halign: 'left' }, // Replied By
            2: { cellWidth: 85, halign: 'left' } // Reply
          },
          margin: { left: margin, right: margin },
          didDrawPage: function (data) {
            // Footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text('Wild Lanka Go - Wildlife Officer Portal', margin, pageHeight - 15);
            doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
          }
        });
      } else {
        // No replies section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('No replies or resolution updates available.', margin, yPosition);
        yPosition += 20;
      }
      
      // Add footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Wild Lanka Go - Wildlife Officer Portal', margin, pageHeight - 15);
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      
      doc.save(`complaint-${complaintId}-${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccessMessage('PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) return;
    
    try {
      await protectedApi.deleteFeedback(feedbackId);
      setSuccessMessage('Feedback deleted successfully');
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      setError('Failed to delete feedback');
    }
  };

  // Search functions
  const handleComplaintSearch = (e) => {
    setComplaintSearchTerm(e.target.value);
  };

  const clearComplaintSearch = () => {
    setComplaintSearchTerm('');
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

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setApplicationModalOpen(true);
  };

  const handleApproveApplication = async (applicationId, notes = '') => {
    try {
      await protectedApi.approveApplication(applicationId, notes);
      setSuccessMessage('Application approved successfully. Admin will now create the account.');
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to approve application:', error);
      setError('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId, notes = '') => {
    try {
      await protectedApi.rejectApplication(applicationId, notes);
      setSuccessMessage('Application rejected');
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to reject application:', error);
      setError('Failed to reject application');
    }
  };

  // Account creation is now handled by admin only

  const closeApplicationModals = () => {
    setApplicationModalOpen(false);
    setCredentialsModalOpen(false);
    setSelectedApplication(null);
    setGeneratedCredentials(null);
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAllApplications = () => {
    const pendingApplications = applications.filter(app => app.status === 'Submitted');
    if (selectedApplications.length === pendingApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(pendingApplications.map(app => app._id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = selectedApplications.map(id => protectedApi.approveApplication(id, 'Bulk approved by WPO'));
      await Promise.all(promises);
      setSuccessMessage(`Successfully approved ${selectedApplications.length} applications`);
      setSelectedApplications([]);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to bulk approve applications:', error);
      setError('Failed to approve some applications');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedApplications.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = selectedApplications.map(id => protectedApi.rejectApplication(id, 'Bulk rejected by WPO'));
      await Promise.all(promises);
      setSuccessMessage(`Successfully rejected ${selectedApplications.length} applications`);
      setSelectedApplications([]);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to bulk reject applications:', error);
      setError('Failed to reject some applications');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const updateFuelClaimStatus = async (claimId, status) => {
    try {
      console.log('🔄 Updating fuel claim status:', { claimId, status });
      await protectedApi.updateFuelClaimStatus(claimId, status);
      setSuccessMessage(`Fuel claim ${status} successfully`);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update fuel claim status:', error);
      setError(`Failed to ${status} fuel claim`);
    }
  };

  const generateBookingsPDF = () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      alert('No bookings found to generate PDF');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Booking Management Report', 'Complete overview of wildlife activity bookings and assignments');

    const tableColumn = [
      '#', 'Tourist', 'Activity', 'Booking Date', 'Participants', 'Status', 'Total Amount'
    ];

    const tableRows = filteredBookings.map((b, index) => [
      index + 1,
      b.touristName || b.userId?.name || 'Anonymous',
      b.activityId?.name || 'Unknown',
      new Date(b.bookingDate).toLocaleDateString(),
      b.numberOfParticipants,
      b.status,
      `LKR ${b.totalAmount || 0}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175], // Blue-800
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 55,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gray-50
      },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // #
        1: { cellWidth: 35, halign: 'left' }, // Tourist
        2: { cellWidth: 40, halign: 'left' }, // Activity
        3: { cellWidth: 25, halign: 'center' }, // Booking Date
        4: { cellWidth: 25, halign: 'center' }, // Participants
        5: { cellWidth: 25, halign: 'center' }, // Status
        6: { cellWidth: 30, halign: 'right' } // Total Amount
      },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Wildlife Officer Portal', margin, pageHeight - 15);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      }
    });

    doc.save(`bookings-management-${new Date().toISOString().split('T')[0]}.pdf`);
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

  // Process data for monthly income pie chart
  const processMonthlyIncomeData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    console.log('📊 Processing monthly income data...');
    console.log('📊 Current month:', currentMonth, 'Year:', currentYear);
    console.log('📊 Total bookings:', bookings.length);
    console.log('📊 Total donations:', donations.length);
    
    // Calculate booking income for current month
    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDate || booking.createdAt);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    const bookingIncome = monthlyBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    console.log('📊 Monthly bookings:', monthlyBookings.length);
    console.log('📊 Booking income:', bookingIncome);

    // Calculate donation income for current month
    const monthlyDonations = donations.filter(donation => {
      const donationDate = new Date(donation.createdAt);
      return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
    });
    const donationIncome = monthlyDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    
    console.log('📊 Monthly donations:', monthlyDonations.length);
    console.log('📊 Donation income:', donationIncome);

    const result = [
      { name: 'Bookings', value: bookingIncome, color: '#3B82F6' },
      { name: 'Donations', value: donationIncome, color: '#10B981' }
    ];
    
    console.log('📊 Final income data:', result);
    return result;
  };


    // Refresh dashboard and staff data
  const handleRefreshData = async () => {
    try {
      setLoading(true);
      await fetchDashboardData();
      await fetchStaff();
      setSuccessMessage("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <RoleGuard requiredRole="wildlifeOfficer">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="wildlifeOfficer">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-lg lg:text-xl font-bold text-gray-800">Wildlife Officer Portal</div>
                          <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                        </div>
                        <div className="block sm:hidden">
                          <div className="text-sm font-bold text-gray-800">Wildlife Officer</div>
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
                    { key: 'reports', label: 'Overview', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    )},
                    { key: 'bookings', label: 'Bookings', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )},
                    { key: 'tours', label: 'Tours', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )},
                    { key: 'complaints', label: 'Complaints', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )},
                    { key: 'applications', label: 'Applications', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )},
                    { key: 'feedback', label: 'Feedback', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )},
                    { key: 'fuelClaims', label: 'Fuel Claims', icon: (
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
                          {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.firstName || user?.name?.split(' ')[0] || 'Wildlife Officer'}`}
                      </h2>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">
                        Welcome to Wild Lanka Go! You have {dashboardStats.pendingComplaints} pending complaints and {dashboardStats.pendingApplications} job applications to review.
                      </p>
                      <button
                        onClick={() => setActiveTab('complaints')}
                          className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                      >
                        Review Complaints
                      </button>
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

                  {/* Success Display */}
            {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Success</h3>
                          <p className="mt-2 text-sm text-green-700">{successMessage}</p>
                        </div>
                      </div>
              </div>
            )}

                  {/* Tab buttons (for center area) */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { k: 'reports', t: 'Overview' },
                      { k: 'bookings', t: 'Booking Management' },
                      { k: 'tours', t: 'Tour Management' },
                      { k: 'complaints', t: 'Complaint Management' },
                      { k: 'applications', t: 'Application Management' },
                      { k: 'feedback', t: 'Feedback Management' },
                      { k: 'fuelClaims', t: 'Fuel Claims' }
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

                  {/* OVERVIEW TAB */}
                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      {/* Stat Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-xs lg:text-sm font-medium">Today's Bookings</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{dashboardStats.todayBookings}</p>
                                <p className="text-blue-200 text-xs mt-1">Active today</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                  <div>
                                <p className="text-yellow-100 text-xs lg:text-sm font-medium">Pending Complaints</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{dashboardStats.pendingComplaints}</p>
                                <p className="text-yellow-200 text-xs mt-1">Needs attention</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-red-100 text-xs lg:text-sm font-medium">Pending Applications</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{dashboardStats.pendingApplications}</p>
                                <p className="text-red-200 text-xs mt-1">Awaiting review</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-xs lg:text-sm font-medium">Pending Fuel Claims</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{dashboardStats.pendingFuelClaims}</p>
                                <p className="text-purple-200 text-xs mt-1">Requires approval</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOOKINGS TAB */}
                  {activeTab === 'bookings' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
                              </div>
                      <button
                        onClick={generateBookingsPDF}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                      >
                        Export PDF
                      </button>
                    </div>
                      </div>
                          <div className="p-8">

                    {/* Filter Controls */}
                            <div className="bg-gray-50/60 p-4 rounded-2xl mb-6 backdrop-blur-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                          </label>
                          <input
                            type="text"
                            placeholder="Search by name, email, or booking ID..."
                            value={bookingSearchTerm}
                            onChange={(e) => setBookingSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                          />
                        </div>

                        {/* Date Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Date
                          </label>
                          <input
                            type="date"
                            value={bookingDateFilter}
                            onChange={(e) => setBookingDateFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                          />
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                          </label>
                          <select
                            value={bookingStatusFilter}
                            onChange={(e) => setBookingStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                          >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Today's Bookings Filter */}
                        <div className="flex items-end">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={showTodayOnly}
                              onChange={(e) => setShowTodayOnly(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Today's Bookings Only
                            </span>
                          </label>
                        </div>
                        </div>
                      </div>

                            {/* Bookings Table */}
                    {loading ? (
                              <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-2 text-gray-600">Loading bookings...</p>
                      </div>
                    ) : filteredBookings.length === 0 ? (
                              <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {bookings.length === 0 ? 'No bookings have been made yet.' : 'No bookings match the current filters.'}
                                </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200/50">
                                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                    <tr>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tourist</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activity</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                                  <tbody className="bg-white/60 divide-y divide-gray-200/50">
                                    {filteredBookings.map((booking) => (
                                      <tr key={booking._id} className="hover:bg-white/80 transition-all duration-300">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>
                                            <div className="font-semibold">
                                      {booking.touristName || (booking.userId?.name) || 'Anonymous'}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {booking.touristEmail || booking.userId?.email || 'No email'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>
                                    <div className="font-medium">
                                      {booking.activityId?.name || 'Unknown Activity'}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                              {booking.numberOfParticipants} participants
                                    </div>
                                  </div>
                                </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                          {new Date(booking.bookingDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                          <div className="space-y-1">
                                  {booking.driver ? (
                                              <div className="text-blue-600 text-xs">✓ Driver: {booking.driver.firstName}</div>
                                            ) : (
                                              <div className="text-gray-400 text-xs">No driver</div>
                                            )}
                                  {booking.tourGuide ? (
                                              <div className="text-blue-600 text-xs">✓ Guide: {booking.tourGuide.firstName}</div>
                                  ) : booking.requestTourGuide ? (
                                              <div className="text-yellow-600 text-xs">Guide pending</div>
                                            ) : null}
                                          </div>
                                </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    LKR {booking.totalAmount || 0}
                                </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleViewBooking(booking)}
                                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      View
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateBooking(booking)}
                                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      Update
                                    </button>
                                     <button 
                                      onClick={() => handleDeleteBooking(booking._id)}
                                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                          </div>
                        </div>
                      </div>
                  </div>
                )}

                  {/* TOURS TAB */}
                {activeTab === 'tours' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                      </div>
                              <h2 className="text-2xl font-bold text-gray-800">Tour Management</h2>
                    </div>
                          </div>
                          <div className="p-8">

                    {/* Tours Table */}
                      {tours.length === 0 ? (
                              <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No tours found</h3>
                                <p className="mt-1 text-sm text-gray-500">Tours will appear here once staff assignments are made.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200/50">
                                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                    <tr>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking ID</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tour Date</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Guide</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Driver</th>
                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                                  <tbody className="bg-white/60 divide-y divide-gray-200/50">
                              {tours.map((tour) => (
                                      <tr key={tour._id} className="hover:bg-white/80 transition-all duration-300">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {tour.bookingId ? (
                                      typeof tour.bookingId === 'object' && tour.bookingId._id 
                                              ? String(tour.bookingId._id).slice(-8)
                                              : String(tour.bookingId).slice(-8)
                                    ) : 'N/A'}
                                  </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tour.tourDate ? new Date(tour.tourDate).toLocaleDateString() : 
                                     tour.preferredDate ? new Date(tour.preferredDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tour.assignedTourGuide ? (
                                      typeof tour.assignedTourGuide === 'object' && tour.assignedTourGuide.firstName ? (
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {tour.assignedTourGuide.firstName} {tour.assignedTourGuide.lastName}
                                          </div>
                                          <div className="text-xs text-gray-500">{tour.assignedTourGuide.email}</div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="font-medium text-gray-900">Guide ID: {String(tour.assignedTourGuide).slice(-8)}</div>
                                          <div className="text-xs text-gray-500">Details not loaded</div>
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400">Not assigned</span>
                                    )}
                                  </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tour.assignedDriver ? (
                                      typeof tour.assignedDriver === 'object' && tour.assignedDriver.firstName ? (
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {tour.assignedDriver.firstName} {tour.assignedDriver.lastName}
                                          </div>
                                          <div className="text-xs text-gray-500">{tour.assignedDriver.email}</div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="font-medium text-gray-900">Driver ID: {String(tour.assignedDriver).slice(-8)}</div>
                                          <div className="text-xs text-gray-500">Details not loaded</div>
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400">Not assigned</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                      tour.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                      tour.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                                      tour.status === 'Started' ? 'bg-yellow-100 text-yellow-800' :
                                      tour.status === 'Ended' ? 'bg-gray-100 text-gray-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {tour.status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                          </div>
                        </div>
                    </div>
                  </div>
                )}

                  {/* COMPLAINTS TAB */}
                {activeTab === 'complaints' && (
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
                                <h2 className="text-2xl font-bold text-gray-800">Complaint Management</h2>
                              </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by username..."
                            value={complaintSearchTerm}
                            onChange={handleComplaintSearch}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 bg-white/80"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          {complaintSearchTerm && (
                            <button
                              onClick={clearComplaintSearch}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                          </div>
                          <div className="p-8">
                    
                    {complaintSearchTerm && (
                      <div className="mb-4 text-sm text-gray-600">
                        Showing {filteredComplaints.length} complaint(s) for "{complaintSearchTerm}"
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {filteredComplaints.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-lg mb-2">
                            {complaintSearchTerm ? 'No complaints found for the searched username' : 'No complaints available'}
                          </div>
                          {complaintSearchTerm && (
                            <button
                              onClick={clearComplaintSearch}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredComplaints.map((complaint) => (
                        <div key={complaint._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">
                                  Complaint from {complaint.username} ({complaint.role})
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {new Date(complaint.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{complaint.message}</p>
                              {complaint.location && (
                                <p className="text-xs text-gray-500 mb-2">
                                  <span className="font-medium">Location:</span> {complaint.location}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Email:</span> {complaint.email}
                              </p>
                              
                              {/* Display existing replies */}
                              {complaint.replies && complaint.replies.length > 0 && (
                                <div className="mt-4 border-t pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Replies:</h5>
                                  <div className="space-y-2">
                                    {complaint.replies.map((reply, index) => (
                                      <div key={reply._id || index} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <p className="text-sm text-gray-800">{reply.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              By: {reply.officerUsername} | {new Date(reply.date).toLocaleString()}
                                            </p>
                                          </div>
                                          <div className="flex space-x-1 ml-2">
                                            <button
                                              onClick={() => openEditReplyModal(complaint, reply)}
                                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteReply(complaint._id, reply._id)}
                                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <button
                                onClick={() => openReplyModal(complaint)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                {complaint.replies && complaint.replies.length > 0 ? 'Add Reply' : 'Reply'}
                              </button>
                              <button
                                onClick={() => generateComplaintPDF(complaint._id)}
                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                Generate PDF
                              </button>
                              <button
                                onClick={() => handleDeleteComplaint(complaint._id)}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Delete Complaint
                              </button>
                            </div>
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                          </div>
                        </div>
                    </div>
                  </div>
                )}

                  {/* APPLICATIONS TAB */}
                {activeTab === 'applications' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Application Management</h2>
                              </div>
                        <button
                          onClick={handleRefreshData}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                        >
                          🔄 Refresh Data
                        </button>
                        </div>
                      </div>
                          <div className="p-8">

                    {/* Quick Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
                              <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-yellow-100 text-xs lg:text-sm font-medium">Pending Review</p>
                                      <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">
                              {applications.filter(a => a.status === 'Submitted').length}
                            </p>
                                      <p className="text-yellow-200 text-xs mt-1">Awaiting review</p>
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
                                      <p className="text-blue-100 text-xs lg:text-sm font-medium">Approved by WPO</p>
                                      <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">
                                        {applications.filter(a => a.status === 'ApprovedByWPO').length}
                                      </p>
                                      <p className="text-blue-200 text-xs mt-1">Ready for admin</p>
                                    </div>
                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                      <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                        </div>
                      </div>
                            </div>
                          </div>

                              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-teal-100 text-xs lg:text-sm font-medium">Accounts Created</p>
                                      <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">
                                        {applications.filter(a => a.status === 'AccountCreated').length}
                                      </p>
                                      <p className="text-teal-200 text-xs mt-1">Active users</p>
                                    </div>
                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                      <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                        </div>
                      </div>
                            </div>
                          </div>

                              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-red-100 text-xs lg:text-sm font-medium">Rejected</p>
                                      <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">
                              {applications.filter(a => a.status === 'RejectedByWPO').length}
                            </p>
                                      <p className="text-red-200 text-xs mt-1">Not approved</p>
                                    </div>
                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                      <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                          </div>
                        </div>
                      </div>
                    </div>

                            {/* Bulk Actions */}
                            {applications.filter(app => app.status === 'Submitted').length > 0 && (
                              <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/50 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedApplications.length === applications.filter(app => app.status === 'Submitted').length && applications.filter(app => app.status === 'Submitted').length > 0}
                                        onChange={handleSelectAllApplications}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-sm text-gray-700 font-medium">
                                        Select All Pending ({applications.filter(app => app.status === 'Submitted').length})
                                      </span>
                                    </label>
                                    {selectedApplications.length > 0 && (
                                      <span className="text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">
                                        {selectedApplications.length} selected
                                      </span>
                                    )}
                                  </div>
                                  {selectedApplications.length > 0 && (
                                    <div className="flex space-x-3">
                                      <button
                                        onClick={handleBulkApprove}
                                        disabled={bulkActionLoading}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                                      >
                                        {bulkActionLoading ? 'Processing...' : `Approve ${selectedApplications.length}`}
                                      </button>
                                      <button
                                        onClick={handleBulkReject}
                                        disabled={bulkActionLoading}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                                      >
                                        {bulkActionLoading ? 'Processing...' : `Reject ${selectedApplications.length}`}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Applications Table */}
                    <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200/50">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                          <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                      <input
                                        type="checkbox"
                                        checked={selectedApplications.length === applications.filter(app => app.status === 'Submitted').length && applications.filter(app => app.status === 'Submitted').length > 0}
                                        onChange={handleSelectAllApplications}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">👤 Applicant Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">🎯 Position</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📞 Contact Info</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">💼 Qualifications</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📅 Applied Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📋 Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">⚡ Actions</th>
                          </tr>
                        </thead>
                                <tbody className="bg-white/60 divide-y divide-gray-200/50">
                          {applications.map((application) => (
                                    <tr key={application._id} className="hover:bg-gray-50/80 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                        {application.status === 'Submitted' && (
                                          <input
                                            type="checkbox"
                                            checked={selectedApplications.includes(application._id)}
                                            onChange={() => handleSelectApplication(application._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                          />
                                        )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-600">
                                        {application.firstname?.[0]}{application.lastname?.[0]}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {application.firstname} {application.lastname}
                                    </div>
                                    <div className="text-sm text-gray-500">ID: {application._id.slice(-6)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    application.role === 'Driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {application.role}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>
                                  <div className="text-gray-900">{application.email}</div>
                                  <div className="text-gray-500">{application.phone || 'No phone'}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {application.role === 'TourGuide' ? (
                                  <div>
                                    <div className="font-medium">{application.Experience_Year || 0} years experience</div>
                                    <div className="text-xs text-gray-500">Registration: {application.Guide_Registration_No || 'Not provided'}</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">License: {application.LicenceNumber || 'Not provided'}</div>
                                    <div className="text-xs text-gray-500">{application.vehicleType || 'Not specified'} - {application.vehicleNumber || 'No plate'}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(application.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                          application.status === 'Submitted' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                                          application.status === 'ApprovedByWPO' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                                          application.status === 'AccountCreated' ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border border-teal-200' :
                                          application.status === 'RejectedByWPO' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200' :
                                          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                                        }`}>
                                  {application.status ? application.status.replace('ByWPO', '') : 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleViewApplication(application)}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
                                          >
                                            View
                                          </button>
                                          
                                          {application.status === 'Submitted' && (
                                            <>
                                              <button
                                                onClick={() => handleApproveApplication(application._id)}
                                                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                              >
                                                Approve
                                              </button>
                                      <button
                                        onClick={() => handleRejectApplication(application._id)}
                                                className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  
                                          {application.status === 'ApprovedByWPO' && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs rounded-lg border border-blue-200 font-medium">
                                              Approved - Admin will create account
                                            </span>
                                          )}
                                  
                                  {application.status === 'AccountCreated' && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 text-xs rounded-lg border border-teal-200 font-medium">
                                              ✓ Account Created
                                            </span>
                                          )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {applications.length === 0 && (
                        <div className="text-center py-12">
                                  <div className="text-gray-500 text-lg">No applications found</div>
                        </div>
                      )}
                            </div>
                          </div>
                        </div>
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {claim._id ? claim._id.substring(0, 8) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {claim.driverId?.firstName && claim.driverId?.lastName 
                                  ? `${claim.driverId.firstName} ${claim.driverId.lastName}`
                                  : claim.driverId?.name || 'Unknown Driver'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                LKR {claim.claimAmount || claim.calculatedFuelCost || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {claim.distanceKm || claim.totalDistance || 0} km
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  claim.status === 'pending' || claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.status === 'approved' || claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {claim.status ? claim.status.toUpperCase() : 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(claim.status === 'pending' || claim.status === 'Pending') && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updateFuelClaimStatus(claim._id, 'approved')}
                                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-green-600"
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
                                <button 
                                  onClick={() => {
                                    setSelectedFuelClaim(claim);
                                    setShowFuelClaimModal(true);
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Feedback Management Tab */}
                {activeTab === 'feedback' && (
                  <div>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Feedback Management</h2>
                      
                      {feedback.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {console.log('Rendering feedback items:', feedback)}
                          {feedback.map((item, index) => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-sm font-bold text-gray-900 mb-2">Feedback</h3>
                                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                    {item.message || item.feedbackMessage || item.content || 'No message provided'}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-2">From: {item.userName || item.username || item.user?.name || item.user?.username || 'Anonymous'}</p>
                                  <button
                                    onClick={() => {
                                      console.log('Delete button clicked for feedback:', item._id);
                                      handleDeleteFeedback(item._id);
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                    style={{ display: 'block', marginTop: '4px' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 ml-4 flex-shrink-0">
                                  {item.status || 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Test feedback entry to show layout */}
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Feedback</h3>
                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                  This is a test feedback message to show the layout structure.
                                </p>
                                <p className="text-xs text-gray-500 mb-2">From: Test User</p>
                                <button
                                  onClick={() => console.log('Test delete button clicked')}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  style={{ display: 'block', marginTop: '4px' }}
                                >
                                  Delete
                                </button>
                              </div>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 ml-4 flex-shrink-0">
                                Pending
                              </span>
                            </div>
                          </div>
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">No real feedback available - showing test layout</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'reports' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Dashboard Overview</h3>
                    
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Monthly Income Pie Chart */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-medium text-gray-900">Monthly Income</h4>
                          <p className="text-sm text-gray-600 mt-1">Current month revenue breakdown</p>
                        </div>
                        <div className="p-6">
                          {(() => {
                            const incomeData = processMonthlyIncomeData();
                            const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);
                            
                            if (totalIncome === 0) {
                              return (
                                <div className="flex items-center justify-center h-[300px] text-gray-500">
                                  <div className="text-center">
                                    <div className="text-4xl mb-2">📊</div>
                                    <p>No income data available for current month</p>
                                    <p className="text-sm mt-1">Bookings: {bookings.length}, Donations: {donations.length}</p>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie
                                    data={incomeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {incomeData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Amount']}
                                    labelStyle={{ color: '#374151' }}
                                  />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })()}
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

        {/* Modals */}
        <>
        {/* View Booking Details Modal */}
        {viewModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Booking #{bookings.findIndex(b => b._id === selectedBooking._id) + 1} Details
                </h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                {/* Tourist Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Tourist Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm text-gray-900">{selectedBooking.touristName || selectedBooking.userId?.name || 'Anonymous'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedBooking.touristEmail || selectedBooking.userId?.email || 'No email'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{selectedBooking.touristPhone || selectedBooking.userId?.phone || 'No phone'}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Activity Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Activity Name</label>
                      <p className="text-sm text-gray-900">{selectedBooking.activityId?.name || 'Unknown Activity'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-sm text-gray-900">{selectedBooking.activityId?.location || 'No location'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Price per Person</label>
                      <p className="text-sm text-gray-900">LKR {selectedBooking.activityId?.price || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capacity</label>
                      <p className="text-sm text-gray-900">{selectedBooking.activityId?.capacity || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Booking Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Booking Date</label>
                      <p className="text-sm text-gray-900">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Preferred Date</label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.preferredDate ? new Date(selectedBooking.preferredDate).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Participants</label>
                      <p className="text-sm text-gray-900">{selectedBooking.numberOfParticipants}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        selectedBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBooking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned Driver</label>
                      <p className="text-sm text-gray-900">
                        {(() => {
                          const driver = selectedBooking.driver || selectedBooking.assignDriver;
                          if (driver) {
                            const name = driver.firstName || driver.firstname || driver.name;
                            const lastName = driver.lastName || driver.lastname || '';
                            return name ? `${name} ${lastName}`.trim() : 'Driver assigned (name not available)';
                          }
                          return 'Not assigned';
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned Guide</label>
                      <p className="text-sm text-gray-900">
                        {(() => {
                          const guide = selectedBooking.tourGuide || selectedBooking.assignGuide;
                          if (guide) {
                            const name = guide.firstName || guide.firstname || guide.name;
                            const lastName = guide.lastName || guide.lastname || '';
                            return name ? `${name} ${lastName}`.trim() : 'Guide assigned (name not available)';
                          }
                          return 'Not assigned';
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="text-sm text-gray-900 font-medium">LKR {selectedBooking.totalAmount || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tour Guide Requested</label>
                      <p className="text-sm text-gray-900">{selectedBooking.requestTourGuide ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Special Requests</h4>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {/* Booking ID */}
                <div>
                  <h4 className="text-md font-medium text-gray-500 mb-2">Booking ID</h4>
                  <p className="text-xs text-gray-500 font-mono">{selectedBooking._id}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Assign Driver & Guide Modal */}
{updateModalOpen && selectedBooking && (
  <div className="fixed inset-0 bg-white/50 backdrop-blur-sm  flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-500">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Assign Staff for Booking #{bookings.findIndex(b => b._id === selectedBooking._id) + 1}
        </h3>
        <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-6">

        {/* Staff Assignment Header */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900">Staff Assignment</h4>
          <button
            onClick={() => {
              const bookingDate = selectedBooking?.bookingDate || selectedBooking?.preferredDate;
              fetchStaff(bookingDate);
            }}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            🔄 Refresh Staff
          </button>
        </div>

        {/* Safari Driver Assignment */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Safari Driver</label>
  <select
    value={selectedBooking.assignDriver?._id || ''}
    onChange={(e) => {
      const driver = availableDrivers.find(d => d._id === e.target.value);
      setSelectedBooking(prev => ({ ...prev, assignDriver: driver || null }));
    }}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">No driver assigned</option>
    {availableDrivers.map(driver => (
      <option key={driver._id} value={driver._id}>
        {driver.firstName} {driver.lastName} {driver.isAvailable ? '✅ Available' : '❌ Unavailable'}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    {availableDrivers.length} driver{availableDrivers.length !== 1 ? 's' : ''} ({availableDrivers.filter(d => d.isAvailable).length} available)
  </p>
</div>

{/* Tour Guide Assignment */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Tour Guide</label>
  <select
    value={selectedBooking.assignGuide?._id || ''}
    onChange={(e) => {
      const guide = availableGuides.find(g => g._id === e.target.value);
      setSelectedBooking(prev => ({ ...prev, assignGuide: guide || null }));
    }}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">No guide assigned</option>
    {availableGuides.map(guide => (
      <option key={guide._id} value={guide._id}>
        {guide.firstName} {guide.lastName} {guide.isAvailable ? '✅ Available' : '❌ Unavailable'} {guide.experienceYears ? `(${guide.experienceYears} yrs)` : ''}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    {availableGuides.length} guide{availableGuides.length !== 1 ? 's' : ''} ({availableGuides.filter(g => g.isAvailable).length} available)
  </p>
</div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button onClick={closeModals} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
          Cancel
        </button>
        <button
          onClick={async () => {
            try {
              console.log('🔄 Saving staff assignments:', {
                bookingId: selectedBooking._id,
                assignDriver: selectedBooking.assignDriver,
                assignGuide: selectedBooking.assignGuide
              });
              
              // Create tour record first if driver is assigned (mandatory for tour creation)
              let tourCreated = false;
              if (selectedBooking.assignDriver) {
                try {
                  console.log('🔄 Creating tour record with:', {
                    bookingId: selectedBooking._id,
                    preferredDate: selectedBooking.bookingDate,
                    assignedTourGuide: selectedBooking.assignGuide?._id || null,
                    assignedDriver: selectedBooking.assignDriver._id,
                  });
                  
                  const tourResponse = await protectedApi.createTourWithAssignment({
                    bookingId: selectedBooking._id,
                    preferredDate: selectedBooking.bookingDate,
                    assignedTourGuide: selectedBooking.assignGuide?._id || null,
                    assignedDriver: selectedBooking.assignDriver._id,
                    tourNotes: `Tour created from booking assignment by Wildlife Officer`
                  });
                  
                  console.log('✅ Tour record created successfully:', tourResponse);
                  tourCreated = true;
                } catch (tourError) {
                  console.error('❌ Failed to create tour record:', tourError);
                  console.error('❌ Tour error details:', {
                    message: tourError.message,
                    status: tourError.response?.status,
                    data: tourError.response?.data
                  });
                  
                  // Show user-friendly error message
                  const errorMessage = tourError.response?.data?.message || tourError.message || 'Failed to create tour record';
                  setError(`Tour Creation Failed: ${errorMessage}. Staff assignment will still be saved.`);
                  setTimeout(() => setError(null), 8000);
                }
              }

              // Update backend using correct field names from booking model
              const bookingUpdateResponse = await protectedApi.updateBooking(selectedBooking._id, {
                driver: selectedBooking.assignDriver?._id || null,
                tourGuide: selectedBooking.assignGuide?._id || null,
              });
              
              console.log('✅ Booking update response:', bookingUpdateResponse);

              // Refresh data from server to get the latest status and assignments
              console.log('🔄 Refreshing dashboard data after assignment...');
              // Small delay to ensure server has processed all changes
              await new Promise(resolve => setTimeout(resolve, 500));
              await fetchDashboardData();
              
              // Show success message
              const bookingNumber = bookings.findIndex(b => b._id === selectedBooking._id) + 1;
              let message = `✅ Staff assigned successfully for booking #${bookingNumber}`;
              if (selectedBooking.assignDriver) {
                if (tourCreated) {
                  message += '\n🎯 Tour record created successfully. Check the Tours tab to view details.';
                  // Auto-switch to Tours tab after 2 seconds
                  setTimeout(() => {
                    setActiveTab('tours');
                  }, 2000);
                } else {
                  message += '\n⚠️ Staff assignment saved (tour record creation failed).';
                }
              }
              setSuccessMessage(message);
              
              // Clear success message after 8 seconds
              setTimeout(() => setSuccessMessage(null), 8000);
              
              closeModals();
            } catch (error) {
              console.error('Failed to update booking assignments:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
              setError(`Failed to assign staff: ${errorMessage}`);
              setTimeout(() => setError(null), 5000);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>

    </div>
  </div>
)}



        {/* Application Details Modal */}
        {applicationModalOpen && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Application Details - {selectedApplication.firstname} {selectedApplication.lastname}
                </h3>
                <button
                  onClick={closeApplicationModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">👤 Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.firstname} {selectedApplication.lastname}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="text-sm text-gray-900">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-sm text-gray-900">{selectedApplication.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Applied Position</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedApplication.role === 'Driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedApplication.role === 'Driver' ? 'Safari Driver' : 'Tour Guide'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role-specific Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    {selectedApplication.role === 'Driver' ? '🚗 Driver Information' : '🎯 Tour Guide Information'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.role === 'TourGuide' ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Guide Registration Number</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedApplication.Guide_Registration_No || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedApplication.Experience_Year || 0} years</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">Qualifications</label>
                          <p className="text-sm text-gray-900">
                            {selectedApplication.Experience_Year > 0 ? 
                              `Experienced guide with ${selectedApplication.Experience_Year} years of service` : 
                              'New guide - no previous experience'
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Driving License Number</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedApplication.LicenceNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedApplication.vehicleType || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Vehicle Registration Number</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedApplication.vehicleNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Vehicle Details</label>
                          <p className="text-sm text-gray-900">
                            {selectedApplication.vehicleType && selectedApplication.vehicleNumber ? 
                              `${selectedApplication.vehicleType} - ${selectedApplication.vehicleNumber}` : 
                              'Vehicle information not provided'
                            }
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Application Status */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">📋 Application Status & Timeline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedApplication.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                          selectedApplication.status === 'ApprovedByWPO' ? 'bg-green-100 text-green-800' :
                          selectedApplication.status === 'AccountCreated' ? 'bg-blue-100 text-blue-800' :
                          selectedApplication.status === 'RejectedByWPO' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedApplication.status === 'Submitted' ? '⏳ Pending Review' :
                           selectedApplication.status === 'ApprovedByWPO' ? '✅ Approved by WPO' :
                           selectedApplication.status === 'AccountCreated' ? '🎉 Account Created' :
                           selectedApplication.status === 'RejectedByWPO' ? '❌ Rejected' :
                           '❓ Unknown Status'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Application Date</label>
                      <p className="text-sm text-gray-900 font-medium">{new Date(selectedApplication.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Application Timeline</label>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">Application submitted on {new Date(selectedApplication.createdAt).toLocaleDateString()}</span>
                        </div>
                        {selectedApplication.status !== 'Submitted' && (
                          <div className="flex items-center text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span className="text-gray-600">Reviewed by Wildlife Officer</span>
                          </div>
                        )}
                        {selectedApplication.status === 'AccountCreated' && (
                          <div className="flex items-center text-sm">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            <span className="text-gray-600">Account created by Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedApplication.notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">📝 Additional Notes</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-sm text-gray-900">{selectedApplication.notes}</p>
                    </div>
                  </div>
                )}

                {/* Application Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-900 mb-3">📊 Application Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Applicant:</span>
                      <span className="ml-2 text-blue-700">{selectedApplication.firstname} {selectedApplication.lastname}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Position:</span>
                      <span className="ml-2 text-blue-700">{selectedApplication.role === 'Driver' ? 'Safari Driver' : 'Tour Guide'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Contact:</span>
                      <span className="ml-2 text-blue-700">{selectedApplication.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Phone:</span>
                      <span className="ml-2 text-blue-700">{selectedApplication.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Application ID */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">🔍 Application Reference</h4>
                  <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">{selectedApplication._id}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                {selectedApplication.status === 'Submitted' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveApplication(selectedApplication._id);
                        closeApplicationModals();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() => {
                        handleRejectApplication(selectedApplication._id);
                        closeApplicationModals();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  </>
                )}
                
                {selectedApplication.status === 'ApprovedByWPO' && (
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-center">
                    ✓ Approved - Admin will create account
                  </div>
                )}
                
                <button
                  onClick={closeApplicationModals}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Credentials Modal */}
        {credentialsModalOpen && generatedCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Account Created Successfully!</h3>
                <button
                  onClick={closeApplicationModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Account Created</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Login credentials have been generated and sent to the applicant's email.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Credentials</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Username</label>
                      <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
                        {generatedCredentials.username}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Password</label>
                      <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
                        {generatedCredentials.password}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Role</label>
                      <p className="text-sm text-gray-900">
                        {generatedCredentials.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Please save these credentials securely. They have also been sent to the applicant's email address.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeApplicationModals}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {replyModalOpen && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingReply ? 'Edit Reply' : 'Add Reply to Complaint'}
                </h3>
                <button
                  onClick={closeReplyModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4">
                {/* Complaint Details */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Complaint from {selectedComplaint.username} ({selectedComplaint.role})
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedComplaint.message}</p>
                  {selectedComplaint.location && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Location:</span> {selectedComplaint.location}
                    </p>
                  )}
                </div>

                {/* Reply Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="replyMessage" className="block text-sm font-medium text-gray-700 mb-2">
                      Reply Message
                    </label>
                    <textarea
                      id="replyMessage"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your reply message..."
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeReplyModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  disabled={replyLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={editingReply ? handleUpdateReply : handleAddReply}
                  disabled={!replyMessage.trim() || replyLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replyLoading ? 'Saving...' : (editingReply ? 'Update Reply' : 'Add Reply')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fuel Claim Details Modal */}
        {showFuelClaimModal && selectedFuelClaim && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Fuel Claim Details</h3>
                  <button
                    onClick={() => {
                      setShowFuelClaimModal(false);
                      setSelectedFuelClaim(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Claim Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Claim Information</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Claim ID</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedFuelClaim._id}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedFuelClaim.status === 'pending' || selectedFuelClaim.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : selectedFuelClaim.status === 'approved' || selectedFuelClaim.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedFuelClaim.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedFuelClaim.submittedAt || selectedFuelClaim.submissionDate || selectedFuelClaim.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Amount</label>
                        <p className="text-lg font-semibold text-gray-900">
                          LKR {selectedFuelClaim.claimAmount || selectedFuelClaim.calculatedFuelCost || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Driver Information</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Driver Name</label>
                        <p className="text-sm text-gray-900">
                          {selectedFuelClaim.driverId?.firstName && selectedFuelClaim.driverId?.lastName 
                            ? `${selectedFuelClaim.driverId.firstName} ${selectedFuelClaim.driverId.lastName}`
                            : selectedFuelClaim.driverId?.name || 'Unknown Driver'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{selectedFuelClaim.driverId?.email || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedFuelClaim.driverId?.phone || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="text-sm text-gray-900">{selectedFuelClaim.driverId?.role || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Trip Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Odometer</label>
                      <p className="text-sm text-gray-900">{selectedFuelClaim.odometerStart || selectedFuelClaim.startOdometer || 'N/A'} km</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Odometer</label>
                      <p className="text-sm text-gray-900">{selectedFuelClaim.odometerEnd || selectedFuelClaim.endOdometer || 'N/A'} km</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Distance</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedFuelClaim.distanceKm || selectedFuelClaim.totalDistance || 0} km
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tour Information */}
                {selectedFuelClaim.tourId && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Tour Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tour ID</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedFuelClaim.tourId._id}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tour Status</label>
                        <p className="text-sm text-gray-900">{selectedFuelClaim.tourId.status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Information */}
                {(selectedFuelClaim.reviewedBy || selectedFuelClaim.reviewedAt) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Review Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                        <p className="text-sm text-gray-900">{selectedFuelClaim.reviewedBy || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                        <p className="text-sm text-gray-900">
                          {selectedFuelClaim.reviewedAt ? new Date(selectedFuelClaim.reviewedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedFuelClaim.reviewNote && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedFuelClaim.reviewNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowFuelClaimModal(false);
                      setSelectedFuelClaim(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                  
                  {(selectedFuelClaim.status === 'pending' || selectedFuelClaim.status === 'Pending') && (
                    <>
                      <button
                        onClick={() => {
                          updateFuelClaimStatus(selectedFuelClaim._id, 'approved');
                          setShowFuelClaimModal(false);
                          setSelectedFuelClaim(null);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Approve Claim
                      </button>
                      <button
                        onClick={() => {
                          updateFuelClaimStatus(selectedFuelClaim._id, 'rejected');
                          setShowFuelClaimModal(false);
                          setSelectedFuelClaim(null);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Reject Claim
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </>

        <Footer />
      </div>
    </RoleGuard>
  );
};

export default WildlifeOfficerDashboard;

