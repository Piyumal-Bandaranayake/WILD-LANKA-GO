import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import { API_BASE_URL } from '../../config/api';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import EventRegistrationQRCode from '../../components/EventRegistrationQRCode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../../assets/logo.png';

const TouristDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [myBookings, setMyBookings] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);

  // QR Code modal states
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states
  const [donationForm, setDonationForm] = useState({
    amount: '',
    cause: '',
    message: ''
  });
  const [submittingDonation, setSubmittingDonation] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data...');
      console.log('User context:', { user });
      
      // Check if user is properly authenticated
      if (!user) {
        console.error('No user authentication found');
        setError('Please log in to access your dashboard');
        return;
      }

      // Fetch real data from API

      try {
        console.log('Fetching user bookings...');
        const bookingsRes = await protectedApi.getMyBookings();
        console.log('🔍 Full bookings response:', bookingsRes);
        console.log('🔍 bookingsRes.data:', bookingsRes.data);
        console.log('🔍 bookingsRes.data type:', typeof bookingsRes.data);
        console.log('🔍 bookingsRes.data isArray:', Array.isArray(bookingsRes.data));
        console.log('🔍 bookingsRes.data.data:', bookingsRes.data?.data);
        console.log('🔍 bookingsRes.data.data isArray:', Array.isArray(bookingsRes.data?.data));
        console.log('🔍 bookingsRes.data.bookings:', bookingsRes.data?.bookings);
        console.log('🔍 bookingsRes.data.count:', bookingsRes.data?.count);
        
        // Handle the response structure properly - try multiple paths
        let bookingsData = [];
        if (bookingsRes.data?.data?.data && Array.isArray(bookingsRes.data.data.data)) {
          bookingsData = bookingsRes.data.data.data;
          console.log('✅ Using bookingsRes.data.data.data');
        } else if (bookingsRes.data?.data?.bookings && Array.isArray(bookingsRes.data.data.bookings)) {
          bookingsData = bookingsRes.data.data.bookings;
          console.log('✅ Using bookingsRes.data.data.bookings');
        } else if (bookingsRes.data?.data && Array.isArray(bookingsRes.data.data)) {
          bookingsData = bookingsRes.data.data;
          console.log('✅ Using bookingsRes.data.data');
        } else if (bookingsRes.data?.bookings && Array.isArray(bookingsRes.data.bookings)) {
          bookingsData = bookingsRes.data.bookings;
          console.log('✅ Using bookingsRes.data.bookings');
        } else if (Array.isArray(bookingsRes.data)) {
          bookingsData = bookingsRes.data;
          console.log('✅ Using bookingsRes.data directly');
        } else {
          console.log('❌ No valid bookings data found');
        }
        
        setMyBookings(bookingsData);
        console.log('Final bookings set:', bookingsData.length);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setMyBookings([]);
      }

      try {
        console.log('Fetching event registrations...');
        const registrationsRes = await protectedApi.getMyEventRegistrations();
        console.log('🔍 Full registrations response:', registrationsRes);
        
        // Handle the response structure properly - try multiple paths like bookings
        let registrationsData = [];
        if (registrationsRes.data?.data?.data && Array.isArray(registrationsRes.data.data.data)) {
          registrationsData = registrationsRes.data.data.data;
          console.log('✅ Using registrationsRes.data.data.data');
        } else if (registrationsRes.data?.data?.registrations && Array.isArray(registrationsRes.data.data.registrations)) {
          registrationsData = registrationsRes.data.data.registrations;
          console.log('✅ Using registrationsRes.data.data.registrations');
        } else if (registrationsRes.data?.data && Array.isArray(registrationsRes.data.data)) {
          registrationsData = registrationsRes.data.data;
          console.log('✅ Using registrationsRes.data.data');
        } else if (Array.isArray(registrationsRes.data)) {
          registrationsData = registrationsRes.data;
          console.log('✅ Using registrationsRes.data directly');
        } else {
          console.log('❌ No valid registrations data found');
        }
        
        setMyRegistrations(registrationsData);
        console.log('Final registrations set:', registrationsData.length);
      } catch (error) {
        console.error('Error fetching event registrations:', error);
        setMyRegistrations([]);
      }

      try {
        console.log('Fetching donations...');
        console.log('🔍 Calling protectedApi.getMyDonations() - should hit /donations/my-donations');
        const donationsRes = await protectedApi.getMyDonations();
        console.log('🔍 Full donations response:', donationsRes);
        console.log('🔍 donationsRes.data:', donationsRes.data);
        console.log('🔍 donationsRes.data type:', typeof donationsRes.data);
        console.log('🔍 donationsRes.data isArray:', Array.isArray(donationsRes.data));
        
        // Handle the response structure properly - try multiple paths like registrations
        let donationsData = [];
        if (donationsRes.data?.data?.data && Array.isArray(donationsRes.data.data.data)) {
          donationsData = donationsRes.data.data.data;
          console.log('✅ Using donationsRes.data.data.data');
        } else if (donationsRes.data?.data?.donations && Array.isArray(donationsRes.data.data.donations)) {
          donationsData = donationsRes.data.data.donations;
          console.log('✅ Using donationsRes.data.data.donations');
        } else if (donationsRes.data?.data && Array.isArray(donationsRes.data.data)) {
          donationsData = donationsRes.data.data;
          console.log('✅ Using donationsRes.data.data');
        } else if (donationsRes.data?.donations && Array.isArray(donationsRes.data.donations)) {
          donationsData = donationsRes.data.donations;
          console.log('✅ Using donationsRes.data.donations');
        } else if (Array.isArray(donationsRes.data)) {
          donationsData = donationsRes.data;
          console.log('✅ Using donationsRes.data directly');
        } else {
          console.log('❌ No valid donations data found');
          console.log('Available keys:', Object.keys(donationsRes.data || {}));
        }
        
        setMyDonations(Array.isArray(donationsData) ? donationsData : []);
        console.log('Final donations set:', donationsData.length);
        console.log('Sample donation:', donationsData[0]);
      } catch (error) {
        console.error('Error fetching donations:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          response: error.response?.data
        });
        setMyDonations([]);
      }

      try {
        console.log('Fetching feedback...');
        const feedbackRes = await protectedApi.getMyFeedback();
        console.log('🔍 Full feedback response:', feedbackRes);
        
        // Handle the response structure properly
        const feedbackData = feedbackRes.data?.data || feedbackRes.data || [];
        setMyFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        console.log('Feedback fetched:', feedbackData?.length || 0);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setMyFeedback([]);
      }

      try {
        console.log('Fetching complaints...');
        const complaintsRes = await protectedApi.getMyComplaints();
        console.log('🔍 Full complaints response:', complaintsRes);
        
        // Handle the response structure properly
        const complaintsData = complaintsRes.data?.data || complaintsRes.data || [];
        setMyComplaints(Array.isArray(complaintsData) ? complaintsData : []);
        console.log('Complaints fetched:', complaintsData?.length || 0);
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setMyComplaints([]);
      }

      console.log('Dashboard data loaded successfully');

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // QR Code function
  const showQRCodeForRegistration = (registration) => {
    // Create event object from registration data
    const event = {
      _id: registration.eventId?._id || registration.eventId,
      title: registration.eventTitle || 'Event',
      date: registration.eventDate,
      time: registration.eventTime,
      location: registration.eventLocation || 'Location',
      description: registration.eventDescription || ''
    };
    
    setSelectedRegistration(registration);
    setSelectedEvent(event);
    setShowQRCodeModal(true);
  };



  // Donation form handler
  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setSubmittingDonation(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/donations/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(donationForm.amount),
          currency: 'lkr',
          donorName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || user?.username || 'Anonymous',
          donorEmail: user?.email,
          isMonthly: false,
          message: donationForm.message,
          cause: donationForm.cause,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to start Stripe checkout');
      }
      const data = await resp.json();
      const url = data?.data?.url || data?.url;
      if (!url) throw new Error('No checkout URL');
      window.location.href = url;
    } catch (error) {
      alert(error.message || 'Could not start Stripe checkout');
    } finally {
      setSubmittingDonation(false);
    }
  };

  // PDF Generation Functions
  const createFormalHeader = (doc, title, subtitle = '') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Header background with gradient effect
    doc.setFillColor(30, 64, 175); // Blue-800
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Add actual logo
    try {
      // Add logo image (resize to fit nicely in header)
      doc.addImage(logoImage, 'PNG', 15, 10, 35, 35);
    } catch (error) {
      console.warn('Could not load logo image, using text fallback:', error);
      // Fallback to text logo if image fails
      doc.setFillColor(255, 255, 255);
      doc.circle(32, 27, 15, 'F');
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('WLG', 27, 32, { align: 'center' });
    }
    
    // Company name - positioned after logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Wild Lanka Go', 60, 25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Wildlife Conservation Portal', 60, 35);
    
    // Contact info on the right - properly spaced
    doc.setFontSize(9);
    doc.text('123 Wildlife Sanctuary Road', pageWidth - margin, 20, { align: 'right' });
    doc.text('Colombo, Sri Lanka', pageWidth - margin, 28, { align: 'right' });
    doc.text('info@wildlankago.com', pageWidth - margin, 36, { align: 'right' });
    doc.text('+94 11 234 5678', pageWidth - margin, 44, { align: 'right' });
    
    // Document title section - positioned below header with proper spacing
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 85);
    
    // Subtitle if provided - positioned below title with more space
    if (subtitle) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 105);
    }
    
    // Date and user info - positioned on the right side with proper spacing
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 85, { align: 'right' });
    
    // User info - positioned below date
    doc.setFontSize(10);
    doc.text(`Tourist: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Anonymous'}`, pageWidth - margin, 105, { align: 'right' });
    
    // Line separator - positioned below all content
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 125, pageWidth - margin, 125);
    
    return 135; // Return Y position for content with proper spacing
  };

  const generateBookingsPDF = () => {
    if (!myBookings || myBookings.length === 0) {
      alert('No bookings found to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Booking History Report', 'Complete record of your wildlife activity bookings');
    
    // Table data
    const tableColumns = ['Activity', 'Location', 'Date', 'Participants', 'Status', 'Amount (Rs.)'];
    const tableRows = myBookings.map(booking => [
      booking.activityId?.name || 'Activity',
      booking.activityId?.location || 'Location',
      new Date(booking.preferredDate || booking.bookingDate).toLocaleDateString(),
      booking.numberOfParticipants || 0,
      booking.status || 'Pending',
      booking.totalAmount?.toLocaleString() || '0'
    ]);

    // Generate table
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
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gray-50
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' }, // Activity
        1: { cellWidth: 35, halign: 'left' }, // Location
        2: { cellWidth: 25, halign: 'center' }, // Date
        3: { cellWidth: 20, halign: 'center' }, // Participants
        4: { cellWidth: 25, halign: 'center' }, // Status
        5: { cellWidth: 25, halign: 'right' } // Amount
      },
      margin: { left: margin, right: margin },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Tourist Portal', margin, pageHeight - 15);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      }
    });

    doc.save(`bookings-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateRegistrationsPDF = () => {
    if (!myRegistrations || myRegistrations.length === 0) {
      alert('No event registrations found to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Event Registration Report', 'Complete record of your wildlife event registrations');
    
    // Table data
    const tableColumns = ['Event', 'Location', 'Date', 'Time', 'Participants', 'Status', 'Amount (Rs.)'];
    const tableRows = myRegistrations.map(registration => [
      registration.eventTitle || 'Event',
      registration.eventLocation || 'Location',
      registration.eventDate ? new Date(registration.eventDate).toLocaleDateString() : 'TBD',
      registration.eventTime || 'TBD',
      registration.numberOfParticipants || registration.participants || 0,
      registration.status === 'registered' ? 'Registered' :
      registration.status === 'attended' ? 'Attended' :
      registration.status === 'cancelled' ? 'Cancelled' :
      registration.status || 'Pending',
      registration.paymentAmount?.toLocaleString() || '0'
    ]);

    // Generate table
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
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gray-50
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'left' }, // Event
        1: { cellWidth: 30, halign: 'left' }, // Location
        2: { cellWidth: 25, halign: 'center' }, // Date
        3: { cellWidth: 20, halign: 'center' }, // Time
        4: { cellWidth: 20, halign: 'center' }, // Participants
        5: { cellWidth: 25, halign: 'center' }, // Status
        6: { cellWidth: 25, halign: 'right' } // Amount
      },
      margin: { left: margin, right: margin },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Tourist Portal', margin, pageHeight - 15);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      }
    });

    doc.save(`event-registrations-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateDonationsPDF = () => {
    if (!myDonations || myDonations.length === 0) {
      alert('No donations found to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Donation History Report', 'Complete record of your wildlife conservation donations');
    
    // Table data
    const tableColumns = ['Amount (Rs.)', 'Cause', 'Date', 'Status', 'Message'];
    const tableRows = myDonations.map(donation => [
      donation.amount?.toLocaleString() || '0',
      donation.cause || 'General Support',
      donation.date ? new Date(donation.date).toLocaleDateString() : 'Date N/A',
      'Completed',
      donation.message ? (donation.message.length > 30 ? donation.message.substring(0, 30) + '...' : donation.message) : 'No message'
    ]);

    // Generate table
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
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gray-50
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'right' }, // Amount
        1: { cellWidth: 40, halign: 'left' }, // Cause
        2: { cellWidth: 25, halign: 'center' }, // Date
        3: { cellWidth: 20, halign: 'center' }, // Status
        4: { cellWidth: 45, halign: 'left' } // Message
      },
      margin: { left: margin, right: margin },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Tourist Portal', margin, pageHeight - 15);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      }
    });

    // Add summary
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Donation Summary', margin, finalY);
    
    const totalAmount = myDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(`Total Donated: Rs. ${totalAmount.toLocaleString()}`, margin, finalY + 10);
    doc.text(`Number of Donations: ${myDonations.length}`, margin, finalY + 20);
    doc.text(`Average Donation: Rs. ${Math.round(totalAmount / myDonations.length).toLocaleString()}`, margin, finalY + 30);

    doc.save(`donations-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateCompleteReportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Complete Tourist Report', 'Comprehensive overview of your Wild Lanka Go activities');
    
    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Activity Summary', margin, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    const summaryData = [
      `Total Bookings: ${myBookings.length}`,
      `Total Event Registrations: ${myRegistrations.length}`,
      `Total Donations: ${myDonations.length}`,
      `Total Donation Amount: Rs. ${myDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0).toLocaleString()}`
    ];
    
    summaryData.forEach(line => {
      doc.text(line, margin, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Bookings section
    if (myBookings.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Recent Bookings', margin, yPosition);
      yPosition += 10;
      
      const tableColumns = ['Activity', 'Date', 'Status', 'Amount'];
      const tableRows = myBookings.slice(0, 5).map(booking => [
        booking.activityId?.name || 'Activity',
        new Date(booking.preferredDate || booking.bookingDate).toLocaleDateString(),
        booking.status || 'Pending',
        `Rs. ${booking.totalAmount?.toLocaleString() || '0'}`
      ]);
      
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: 55
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
    
    // Add footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('Wild Lanka Go - Tourist Portal', margin, pageHeight - 15);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 15, { align: 'right' });

    doc.save(`complete-tourist-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="tourist">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your portal...</p>
            </div>
          </div>
          <Footer />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="tourist">
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Shell */}
        <div className="flex-1 pt-28 pb-10">
          <div className="mx-auto max-w-7xl px-4">
            {/* Grid: Sidebar | Main | Right */}
            <div className="grid grid-cols-12 gap-4">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 lg:col-span-3">
                <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl lg:shadow-2xl p-4 lg:p-6 sticky top-20 lg:top-24 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl shadow-lg">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm lg:text-base">T</div>
                      </div>
                      <div className="font-semibold text-gray-800">Tourist Portal</div>
                    </div>

                  {[
                    { key: 'overview', label: 'Overview', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                    )},
                    { key: 'bookings', label: 'My Bookings', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )},
                    { key: 'registrations', label: 'Event Registrations', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )},
                    { key: 'donations', label: 'Donations', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )},
                    { key: 'feedback', label: 'Feedback', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )},
                    { key: 'complaints', label: 'Complaints', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    )}
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-300 ${
                        activeTab === key
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:bg-white/50 hover:shadow-md'
                      }`}
                    >
                      {icon}
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}

                  {/* Logout Button */}
                  <div className="mt-6 pt-4 border-t border-gray-200/50">
                      <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50/50 transition-all duration-300 hover:shadow-md"
                      >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                    </div>
                  </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 lg:col-span-7">
                <div className="space-y-6">
                  {/* Top greeting banner */}
                  <div className="mb-6">
                    <div className="bg-blue-600 text-white rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1">
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
                          {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.firstName || user?.name?.split(' ')[0] || 'Tourist'}`}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">
                          Explore Sri Lanka's incredible wildlife and natural wonders. You have {myBookings.length} bookings and {myRegistrations.length} event registrations.
                        </p>
                        <button
                          onClick={() => setActiveTab('donations')}
                          className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                        >
                          Make Donation
                        </button>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-right">
                          <div className="text-sm opacity-90">Today</div>
                          <div className="text-lg font-semibold">
                            {new Date().toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                      </div>
                    </div>
                  </div>
                )}

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm font-medium">My Bookings</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{myBookings.length}</p>
                              </div>
                              <div className="p-3 bg-white/20 rounded-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                                <p className="text-blue-100 text-sm font-medium">Events Registered</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{myRegistrations.length}</p>
                              </div>
                              <div className="p-3 bg-white/20 rounded-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                                <p className="text-blue-100 text-sm font-medium">Donations Made</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{myDonations.length}</p>
                              </div>
                              <div className="p-3 bg-white/20 rounded-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
                                <p className="text-green-100 text-sm font-medium">Feedback Given</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{myFeedback.length}</p>
                              </div>
                              <div className="p-3 bg-white/20 rounded-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Bookings */}
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Recent Bookings</h2>
                              </div>
                              <button
                                onClick={generateCompleteReportPDF}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Complete Report
                              </button>
                            </div>
                          </div>
                          <div className="p-8">
                        {myBookings.length > 0 ? (
                          <div className="space-y-3">
                            {myBookings.map((booking) => (
                              <div key={booking._id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30">
                      <div>
                                  <h3 className="font-medium text-gray-900">{booking.activityId?.name || 'Activity'}</h3>
                                  <p className="text-sm text-gray-600">{booking.activityId?.location || 'Location'}</p>
                                  <p className="text-sm text-gray-500">Date: {new Date(booking.preferredDate || booking.bookingDate).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-500">Participants: {booking.numberOfParticipants}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    booking.status === 'Confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.status === 'Pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.status || 'Pending'}
                                    </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    Rs. {booking.totalAmount?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                        </div>
                                      ))}
                                    </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No bookings yet. Start exploring activities!</p>
                                  )}
                                </div>
                          </div>
                        </div>

                      {/* Recent Event Registrations */}
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
                              <h2 className="text-2xl font-bold text-gray-800">Recent Event Registrations</h2>
                            </div>
                          </div>
                          <div className="p-8">
                            {myRegistrations.length > 0 ? (
                              <div className="space-y-3">
                                {myRegistrations.slice(0, 3).map((registration) => (
                                  <div key={registration._id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30">
                                    <div>
                                      <h3 className="font-medium text-gray-900">{registration.eventTitle || 'Event'}</h3>
                                      <p className="text-sm text-gray-600">{registration.eventLocation || 'Location'}</p>
                                      <p className="text-sm text-gray-500">
                                        Date: {registration.eventDate ? new Date(registration.eventDate).toLocaleDateString() : 'TBD'}
                                      </p>
                                      <p className="text-sm text-gray-500">Participants: {registration.numberOfParticipants || registration.participants}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        registration.status === 'registered' 
                                          ? 'bg-green-100 text-green-800' 
                                          : registration.status === 'attended'
                                          ? 'bg-blue-100 text-blue-800'
                                          : registration.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {registration.status === 'registered' ? 'Registered' :
                                         registration.status === 'attended' ? 'Attended' :
                                         registration.status === 'cancelled' ? 'Cancelled' :
                                         registration.status || 'Pending'}
                                      </span>
                                      
                                      {/* QR Code Button - only show for registered events */}
                                      {registration.status === 'registered' && (
                                        <button
                                          onClick={() => showQRCodeForRegistration(registration)}
                                          className="mt-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                          title="View Registration QR Code"
                                        >
                                          📱 QR
                                        </button>
                                      )}
                                      
                                      {registration.paymentAmount > 0 && (
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                          Rs. {registration.paymentAmount.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-8">No event registrations yet. Explore upcoming events!</p>
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                )}



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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
                              </div>
                              {myBookings.length > 0 && (
                                <button
                                  onClick={generateBookingsPDF}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export PDF
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-8">
                        {myBookings.length > 0 ? (
                          <div className="space-y-3">
                            {myBookings.map((booking) => (
                              <div key={booking._id} className="border border-white/30 rounded-lg p-4 bg-white/50">
                                <div className="flex justify-between items-start">
                              <div>
                                    <h3 className="font-semibold text-gray-900">{booking.activityId?.name || 'Activity'}</h3>
                                    <p className="text-sm text-gray-600">{booking.activityId?.location || 'Location'}</p>
                                    <p className="text-sm text-gray-500">Date: {new Date(booking.preferredDate || booking.bookingDate).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500">Participants: {booking.numberOfParticipants}</p>
                              </div>
                              <div className="text-right">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      booking.status === 'Confirmed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : booking.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {booking.status || 'Pending'}
                                </span>
                                    <p className="text-sm font-medium text-gray-900 mt-2">
                                      Rs. {booking.totalAmount?.toLocaleString() || '0'}
                                    </p>
                              </div>
                              </div>
                            </div>
                          ))}
                              </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No bookings yet. Start exploring activities!</p>
                        )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'registrations' && (
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
                                <h2 className="text-2xl font-bold text-gray-800">My Event Registrations</h2>
                              </div>
                              {myRegistrations.length > 0 && (
                                <button
                                  onClick={generateRegistrationsPDF}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export PDF
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-8">
                        {myRegistrations.length > 0 ? (
                          <div className="space-y-3">
                            {myRegistrations.map((registration) => (
                              <div key={registration._id} className="border border-white/30 rounded-lg p-4 bg-white/50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{registration.eventTitle || 'Event'}</h3>
                                    <p className="text-sm text-gray-600">{registration.eventLocation || 'Location'}</p>
                                    <p className="text-sm text-gray-500">
                                      Date: {registration.eventDate ? new Date(registration.eventDate).toLocaleDateString() : 'TBD'}
                                    </p>
                                    {registration.eventTime && (
                                      <p className="text-sm text-gray-500">Time: {registration.eventTime}</p>
                                    )}
                                    <p className="text-sm text-gray-500">Participants: {registration.numberOfParticipants || registration.participants}</p>
                                    <p className="text-sm text-gray-500">
                                      Registered: {new Date(registration.registeredAt || registration.createdAt).toLocaleDateString()}
                                    </p>
                                    {registration.specialRequests && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        <span className="font-medium">Special Requests:</span> {registration.specialRequests}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      registration.status === 'registered' 
                                        ? 'bg-green-100 text-green-800' 
                                        : registration.status === 'attended'
                                        ? 'bg-blue-100 text-blue-800'
                                        : registration.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {registration.status === 'registered' ? 'Registered' :
                                       registration.status === 'attended' ? 'Attended' :
                                       registration.status === 'cancelled' ? 'Cancelled' :
                                       registration.status || 'Pending'}
                                    </span>
                                    
                                    {/* QR Code Button - only show for registered events */}
                                    {registration.status === 'registered' && (
                                      <button
                                        onClick={() => showQRCodeForRegistration(registration)}
                                        className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                        title="View Registration QR Code"
                                      >
                                        📱 QR Code
                                      </button>
                                    )}
                                    
                                    {registration.paymentAmount > 0 && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-900">
                                          Rs. {registration.paymentAmount.toLocaleString()}
                                        </p>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          registration.paymentStatus === 'paid' 
                                            ? 'bg-green-100 text-green-800' 
                                            : registration.paymentStatus === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {registration.paymentStatus || 'pending'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No event registrations yet. Explore upcoming events!</p>
                        )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'donations' && (
                    <div className="space-y-6">
                      {/* Make Donation Form */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Make a Donation</h2>
                            </div>
                          </div>
                          <div className="p-8">
                        <p className="text-sm text-gray-600 mb-6">
                          Support Sri Lanka's wildlife conservation efforts. Your contribution helps protect endangered species and preserve natural habitats.
                        </p>
                        
                        <form onSubmit={handleDonationSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Donation Amount (Rs.) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={donationForm.amount}
                                onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter amount (e.g., 1000)"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">Minimum donation: Rs. 1</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cause/Purpose *
                              </label>
                              <select
                                value={donationForm.cause}
                                onChange={(e) => setDonationForm(prev => ({ ...prev, cause: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                              >
                                <option value="">Select a cause</option>
                                <option value="Wildlife Conservation">Wildlife Conservation</option>
                                <option value="Habitat Protection">Habitat Protection</option>
                                <option value="Anti-Poaching Efforts">Anti-Poaching Efforts</option>
                                <option value="Research & Education">Research & Education</option>
                                <option value="Community Development">Community Development</option>
                                <option value="Emergency Wildlife Rescue">Emergency Wildlife Rescue</option>
                                <option value="Park Maintenance">Park Maintenance</option>
                                <option value="General Support">General Support</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Personal Message (Optional)
                            </label>
                            <textarea
                              value={donationForm.message}
                              onChange={(e) => setDonationForm(prev => ({ ...prev, message: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              rows="3"
                              placeholder="Add a personal message or dedication (optional)..."
                              maxLength="500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {donationForm.message.length}/500 characters
                            </p>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Your Impact</h3>
                                <div className="mt-2 text-sm text-green-700">
                                  <p>100% of your donation goes directly to wildlife conservation efforts. Thank you for making a difference!</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={submittingDonation}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            {submittingDonation ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing Donation...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Make Donation
                              </>
                            )}
                          </button>
                        </form>
                          </div>
                        </div>
                      </div>

                      {/* My Donations History */}
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">My Donation History</h2>
                              </div>
                              {myDonations.length > 0 && (
                                <button
                                  onClick={generateDonationsPDF}
                                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export PDF
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-8">
                            {myDonations.length > 0 ? (
                              <div className="space-y-3">
                                {myDonations.map((donation) => (
                                  <div key={donation._id} className="border border-white/30 rounded-lg p-4 bg-white/50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-900">Rs. {donation.amount?.toLocaleString() || '0'}</p>
                                        <p className="text-sm text-green-600 font-medium">{donation.cause || 'General Support'}</p>
                                        {donation.message && (
                                          <p className="text-sm text-gray-600 mt-1">{donation.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                          Thank you for supporting wildlife conservation!
                                        </p>
                                        </div>
                                      <div className="text-right">
                                        <span className="text-sm text-gray-500">
                                          {donation.date ? new Date(donation.date).toLocaleDateString() : 'Date N/A'}
                                        </span>
                                        <div className="mt-1">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Completed
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <p className="text-gray-500 mt-2">No donations made yet.</p>
                                <p className="text-sm text-gray-400">Your contributions will appear here once you make a donation.</p>
                              </div>
                                )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'feedback' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Feedback Management</h2>
                            </div>
                          </div>
                          <div className="p-8 text-center">
                            <p className="text-gray-600 mb-6">Manage your feedback and reviews in our dedicated feedback system.</p>
                            <button
                              onClick={() => navigate('/feedback')}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                              Go to Feedback Page
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'complaints' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Complaint Management</h2>
                            </div>
                          </div>
                          <div className="p-8 text-center">
                            <p className="text-gray-600 mb-6">Submit and track your complaints in our dedicated complaint system.</p>
                            <button
                              onClick={() => navigate('/complaints')}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-6 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                              Go to Complaints Page
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {/* RIGHT PANEL */}
              <aside className="col-span-12 lg:col-span-2">
                <div className="space-y-4">
                  {/* Quick Actions */}
                  <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl lg:shadow-2xl p-4 lg:p-6 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                    <div className="relative z-10">
                      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button 
                          onClick={() => setActiveTab('donations')}
                          className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-white/50 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Make Donation
                        </button>
                        <button 
                          onClick={() => navigate('/feedback')}
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-white/50 rounded-lg transition-all duration-300 hover:shadow-md"
                        >
                          Submit Feedback
                        </button>
                        <button 
                          onClick={() => navigate('/complaints')}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-white/50 rounded-lg transition-all duration-300 hover:shadow-md"
                        >
                          File Complaint
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-red-50/80 backdrop-blur-xl border border-red-200/50 shadow-xl lg:shadow-2xl p-4 lg:p-6 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-red-100/30"></div>
                    <div className="relative z-10">
                      <h3 className="font-semibold text-red-900 mb-2">Emergency</h3>
                      <p className="text-sm text-red-700 mb-3">
                        In case of wildlife emergency, call immediately:
                      </p>
                      <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        Call Emergency: 1990
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCodeModal && selectedRegistration && selectedEvent && (
          <EventRegistrationQRCode
            registration={selectedRegistration}
            event={selectedEvent}
            onClose={() => {
              setShowQRCodeModal(false);
              setSelectedRegistration(null);
              setSelectedEvent(null);
            }}
          />
        )}

        <Footer />
      </div>
    </RoleGuard>
  );
};


export default TouristDashboard;
