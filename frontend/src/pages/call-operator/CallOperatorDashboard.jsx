import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { protectedApi } from '../../services/authService';
import api from '../../services/authService';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImage from '../../assets/logo.png';



const CallOperatorDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [emergencies, setEmergencies] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [reports, setReports] = useState([]);

    const [availableStaff, setAvailableStaff] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const [selectedEmergency, setSelectedEmergency] = React.useState(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = useState(""); // default = show all
    const [formErrors, setFormErrors] = useState({});
    const [pendingAssignments, setPendingAssignments] = useState({}); // Track pending assignments

    const [newCase, setNewCase] = useState({
        emergency_type: '',
        description: '',
        location: '',
        priority: 'Medium',
        name: '',
        email: '',
        phone: '',
        property_name: '',
        createdById: '',
        assignedOfficer: null,
        forwardedTo: null,
        isDirectCall: false
    });

    useEffect(() => {
        fetchDashboardData();
        fetchAvailableStaff();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                setError('Please log in to access your dashboard');
                return;
            }

            const [emergenciesRes, feedbackRes, complaintsRes] = await Promise.allSettled([
                protectedApi.getEmergencies().catch(err => {
                    console.error('Failed to fetch emergencies:', err);
                    return { data: [] };
                }),
                protectedApi.getAllFeedback().catch(err => {
                    console.error('Failed to fetch feedback:', err);
                    return { data: [] };
                }),
                protectedApi.getComplaints().catch(err => {
                    console.error('Failed to fetch complaints:', err);
                    return { data: [] };
                })
            ]);

            const emergenciesData = emergenciesRes.status === 'fulfilled' ? (emergenciesRes.value?.data?.data || emergenciesRes.value?.data || []) : [];
            const feedbackData = feedbackRes.status === 'fulfilled' ? (feedbackRes.value?.data?.data || feedbackRes.value?.data || []) : [];
            const complaintsData = complaintsRes.status === 'fulfilled' ? (complaintsRes.value?.data?.data || complaintsRes.value?.data || []) : [];

            console.log('🚨 Fetched emergencies:', emergenciesData.length);
            if (emergenciesData.length > 0) {
              console.log('🚨 Sample emergency data:', emergenciesData[0]);
              console.log('🚨 Available fields in sample:', Object.keys(emergenciesData[0]));
              console.log('🚨 Reporter data:', emergenciesData[0].reporter);
              console.log('🚨 Incident data:', emergenciesData[0].incident);
            }
            
            setEmergencies(emergenciesData);
            setFeedback(feedbackData);
            setComplaints(complaintsData);

            setReports([
                { _id: '1', title: 'Daily Emergency Report', date: '2024-01-15', type: 'emergency', status: 'completed' },
                { _id: '2', title: 'Weekly Feedback Summary', date: '2024-01-14', type: 'feedback', status: 'pending' }
            ]);

        } catch (error) {
            console.error('Dashboard data fetch error:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const fetchAvailableStaff = async () => {
      try {
        // Fetch all vets and emergency officers (including inactive ones) for emergency assignment
        let res = await protectedApi.getAvailableStaff({ includeInactive: 'true' });
        console.log('All staff fetched (including inactive):', res.data.data);
        
        // Filter to only show vets and emergency officers
        const filteredStaff = (res.data.data || []).filter(staff => 
          staff.role === 'vet' || 
          staff.role === 'emergencyOfficer'
        );
        
        console.log('Filtered staff (vets and emergency officers):', filteredStaff);
        console.log('All staff roles found:', (res.data.data || []).map(s => s.role));
        console.log('Vets found:', filteredStaff.filter(s => s.role === 'vet').length);
        console.log('Emergency officers found:', filteredStaff.filter(s => s.role === 'emergencyOfficer').length);
        setAvailableStaff(filteredStaff);
      } catch (err) {
        console.error('Failed to fetch available staff:', err);
      }
    };


    const handleInputChange = (e) => {
        let { name, value } = e.target;

        // Map form field names to state property names
        if (name === 'name') name = 'reporterName';
        if (name === 'phone') name = 'reporterPhone';
        if (name === 'email') name = 'reporterEmail';
        if (name === 'emergency_type') name = 'type';

         console.log('Updating field', name, 'to', value);

        setNewCase(prev => ({ ...prev, [name]: value }));
        setSubmitMessage({ type: '', text: '' });
    };

    const resetForm = () => {
        setNewCase({
            emergency_type: '',
            description: '',
            location: '',
            priority: 'Medium',
            name: '',
            email: '',
            phone: '',
            property_name: '',
            createdById: '',
            assignedOfficer: null,
            forwardedTo: null,
            isDirectCall: false
        });
        setIsFormOpen(false);
        setSubmitMessage({ type: '', text: '' });
    };

  const handleFormSubmit = async (caseData) => {
  if (isSubmitting) return;

  setIsSubmitting(true);
  setSubmitMessage({ type: '', text: '' });

  try {
    const emergencyData = {
      type: caseData.emergency_type || '',
      description: caseData.description || '',
      location: caseData.location || '',
      priority: (caseData.priority || 'Medium'),
      reporterName: caseData.name || '',
      reporterEmail: caseData.email || '',
      reporterPhone: caseData.phone || '',
      propertyName: caseData.property_name || '',
      createdBy: user?.name || 'Call Operator',
      createdById: user?._id || user?.id,
      isDirectCall: false
    };

    console.log('Submitting emergency data:', emergencyData);

    await protectedApi.createEmergencyByCallOperator(emergencyData);
    resetForm();
    fetchDashboardData();
    setSubmitMessage({ type: 'success', text: 'Emergency case created!' });

  } catch (error) {
    console.error('Emergency creation failed:', error);
    setSubmitMessage({
      type: 'error',
      text: error.response?.data?.message || 'Failed to create emergency.'
    });
  } finally {
    setIsSubmitting(false);
  }
};


    const handleView = (emergency) => {
      // Open a modal or popup to display all details
      console.log('Emergency data for view:', emergency);
      console.log('Reporter data:', emergency.reporter);
      console.log('Guest info:', emergency.reporter?.guestInfo);
      console.log('Assignment data:', emergency.assignment);
      console.log('AssignedTo data:', emergency.assignment?.assignedTo);
      console.log('AssignedTo firstName:', emergency.assignment?.assignedTo?.firstName);
      console.log('AssignedTo lastName:', emergency.assignment?.assignedTo?.lastName);
      console.log('AssignedTo role:', emergency.assignment?.assignedTo?.role);
      setSelectedEmergency(emergency);
      setIsViewOpen(true);  // You'll create a state to control view modal
    };

   const handleUpdateAssignment = async (emergency) => {
  // Check if there's a pending assignment for this emergency
  const pendingAssignment = pendingAssignments[emergency._id];
  
  if (!pendingAssignment?.userId || !pendingAssignment?.userModel) {
    setSubmitMessage({ type: 'error', text: 'Please select a staff member to assign.' });
    return;
  }

  try {
    setIsSubmitting(true);
    
    // Call the assign emergency API
    const response = await protectedApi.assignEmergency(emergency._id, {
      userId: pendingAssignment.userId,
      userModel: pendingAssignment.userModel
    });
    
    console.log('Assignment response:', response.data);
    
    setSubmitMessage({ type: 'success', text: 'Emergency assigned successfully!' });
    
    // Remove from pending assignments since it's now saved
    setPendingAssignments(prev => {
      const updated = { ...prev };
      delete updated[emergency._id];
      return updated;
    });
    
    // Refresh the dashboard data to show updated assignments
    fetchDashboardData();
    
    // Clear any pending assignments to avoid stale data
    setPendingAssignments({});
  } catch (err) {
    console.error('Assignment failed:', err);
    setSubmitMessage({ type: 'error', text: 'Failed to assign emergency. Please try again.' });
  } finally {
    setIsSubmitting(false);
  }
};

const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
        await protectedApi.deleteFeedback(id); // call your API to delete feedback
        // Remove feedback from state
        setFeedback(prev => prev.filter(f => f._id !== id));
        alert('Feedback deleted successfully!');
    } catch (error) {
        console.error('Failed to delete feedback:', error);
        alert('Failed to delete feedback');
    }
};



    const mapRoleToBackend = (role) => {
      switch (role) {
        case 'vet':
          return 'Vet';
        case 'emergencyOfficer':
          return 'EmergencyOfficer';
        default:
          return null;
      }
    };

    // Map old status values to new standardized ones
    const mapStatusForDisplay = (status) => {
      switch (status) {
        case 'Reported':
        case 'Acknowledged':
        case 'Pending':
        case 'pending':
          return 'pending';
        case 'Assigned':
        case 'In Progress':
        case 'in-progress':
          return 'in-progress';
        case 'Resolved':
        case 'Closed':
        case 'resolved':
          return 'resolved';
        default:
          return status || 'pending';
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
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 85);
    
    // Subtitle if provided - positioned below title
    if (subtitle) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 100);
    }
    
    // Date and user info - positioned on the right side with proper spacing
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 85, { align: 'right' });
    
    // User info - positioned below date
    doc.setFontSize(10);
    doc.text(`Call Operator: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Call Operator'}`, pageWidth - margin, 100, { align: 'right' });
    
    // Line separator - positioned below all content
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 115, pageWidth - margin, 115);
    
    return 125; // Return Y position for content with proper spacing
  };

  const generateEmergencyPDF = () => {
    if (!emergencies || emergencies.length === 0) {
      alert('No emergency cases found to generate PDF');
      return;
    }

    // Debug: Log emergency data structure
    console.log('🔍 Emergency data for PDF:', emergencies);
    console.log('🔍 Sample emergency:', emergencies[0]);
    console.log('🔍 Available fields in sample:', Object.keys(emergencies[0]));

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let yPosition = createFormalHeader(doc, 'Emergency Cases Report', 'Complete overview of emergency cases and management');

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.text('Summary', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    const totalCases = emergencies.length;
    const pendingCases = emergencies.filter(e => e.status === 'Reported' || e.status === 'pending').length;
    const inProgressCases = emergencies.filter(e => e.status === 'In Progress' || e.status === 'in-progress').length;
    const resolvedCases = emergencies.filter(e => e.status === 'Resolved' || e.status === 'resolved').length;
    
    const summaryText = [
      `Total Cases: ${totalCases}`,
      `Pending: ${pendingCases}`,
      `In Progress: ${inProgressCases}`,
      `Resolved: ${resolvedCases}`
    ];
    
    summaryText.forEach((text, index) => {
      doc.text(text, margin + (index * 120), yPosition);
    });
    yPosition += 25;

    // Emergency Cases Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.text('Emergency Cases', margin, yPosition);
    yPosition += 25;

    const tableColumn = ["Name", "Phone", "Type", "Location", "Priority", "Status"];
    const tableRows = [];

    emergencies
        .filter(e => !statusFilter || mapStatusForDisplay(e.status) === statusFilter)
        .forEach(e => {
            // Get name from multiple possible sources
            const name = e.reporter?.guestInfo?.name || 
                        e.reporterName || 
                        e.name || 
                        "Unknown";
            
            // Get phone from multiple possible sources
            const phone = e.reporter?.guestInfo?.phone || 
                         e.reporterPhone || 
                         e.phone || 
                         "Unknown";
            
            // Get location from multiple possible sources
            const location = e.incident?.location?.name || 
                           e.location || 
                           "Not specified";
            
            // Get type from multiple possible sources
            const type = e.type || e.emergency_type || "Unknown";
            
            // Get priority and status
            const priority = e.priority || "Medium";
            const status = e.status || "Unknown";
            
            // Truncate long names and locations to fit in columns (matching the image format)
            const truncatedName = name.length > 25 ? name.substring(0, 22) + "..." : name;
            const truncatedLocation = location.length > 20 ? location.substring(0, 17) + "..." : location;
            
            const emergencyData = [
                truncatedName,
                phone,
                type,
                truncatedLocation,
                priority,
                status,
            ];
            tableRows.push(emergencyData);
        });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPosition,
        theme: "grid",
        headStyles: {
            fillColor: [30, 64, 175], // Blue-800
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
            fontSize: 11,
            cellPadding: 8
        },
        bodyStyles: {
            fontSize: 9,
            textColor: 55,
            halign: "left",
            cellPadding: 6
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Gray-50
        },
        styles: {
            overflow: 'linebreak',
            cellPadding: 6
        },
        columnStyles: {
            0: { cellWidth: 140, halign: 'left' }, // Name
            1: { cellWidth: 130, halign: 'left' }, // Phone
            2: { cellWidth: 100, halign: 'center' }, // Type
            3: { cellWidth: 160, halign: 'left' }, // Location
            4: { cellWidth: 90, halign: 'center' }, // Priority
            5: { cellWidth: 100, halign: 'center' } // Status
        },
        margin: { left: margin, right: margin },
        didDrawPage: function (data) {
            // Footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text('Wild Lanka Go - Call Operator Portal', margin, pageHeight - 15);
            doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
        },
    });

    doc.save(`emergency-cases-${new Date().toISOString().split('T')[0]}.pdf`);
};

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <RoleGuard requiredRole="callOperator">
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading your portal...</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </RoleGuard>
        );
    }

   const NewEmergencyForm = React.memo(
  ({ newCase, handleFormSubmit, resetForm, submitMessage, isSubmitting }) => {
    // Local state for inputs
    const [localCase, setLocalCase] = React.useState(newCase);

    // Update local state on input change
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setLocalCase((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = (e) => {
      e.preventDefault();

      // Validate fields
      const errors = {};
      if (!localCase.name.trim()) errors.name = "Name is required";
      if (!localCase.email.trim()) errors.email = "Email is required";
      else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(localCase.email)) errors.email = "Invalid email address";
      if (!localCase.phone.trim()) errors.phone = "Phone is required";
      else if (!/^\+?\d{9,15}$/.test(localCase.phone)) errors.phone = "Invalid phone number";
      if (!localCase.property_name.trim()) errors.property_name = "Property Name is required";
      if (!localCase.location.trim()) errors.location = "Location is required";
      if (!localCase.emergency_type) errors.emergency_type = "Emergency type is required";
      if (!localCase.priority) errors.priority = "Priority is required";
      if (!localCase.description.trim()) errors.description = "Description is required";

      // Set errors
      setFormErrors(errors);

      // Stop submission if there are errors
      if (Object.keys(errors).length > 0) return;

      // Submit if no errors
      handleFormSubmit(localCase);
    };


    // Emergency type options (matching backend validation)
    const emergencyTypes = [
      { value: 'Human', label: 'Human Emergency' },
      { value: 'Animal', label: 'Animal Emergency' },
      { value: 'Physical', label: 'Physical Emergency' },
      { value: 'Unethical', label: 'Unethical Activity' },
      { value: 'Equipment', label: 'Equipment Failure' },
      { value: 'Natural Disaster', label: 'Natural Disaster' }
    ];

      return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-red-700">Manually Log New Emergency Case</h3>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Reporter Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reporter Name *</label>
              <input
                type="text"
                name="name"
                value={localCase.name}
                onChange={handleInputChange}
                placeholder="Full name"
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                value={localCase.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={localCase.phone}
                onChange={handleInputChange}
                placeholder="+94 XX XXX XXXX"
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Name *</label>
              <input
                type="text"
                name="property_name"
                value={localCase.property_name}
                onChange={handleInputChange}
                placeholder="E.g., Yala National Park"
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.property_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.property_name && <p className="text-red-600 text-xs mt-1">{formErrors.property_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Specific Location *</label>
              <input
                type="text"
                name="location"
                value={localCase.location}
                onChange={handleInputChange}
                placeholder="Detailed address or coordinates"
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.location && <p className="text-red-600 text-xs mt-1">{formErrors.location}</p>}
            </div>
          </div>

          {/* Emergency Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Type *</label>
              <select
                name="emergency_type"
                value={localCase.emergency_type}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.emergency_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select emergency type</option>
                {emergencyTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {formErrors.emergency_type && <p className="text-red-600 text-xs mt-1">{formErrors.emergency_type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority Level *</label>
              <select
                name="priority"
                value={localCase.priority}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                  formErrors.priority ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select priority level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {formErrors.priority && <p className="text-red-600 text-xs mt-1">{formErrors.priority}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              value={localCase.description}
              onChange={handleInputChange}
              placeholder="Provide detailed information"
              className={`mt-1 block w-full border rounded-lg shadow-sm p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 ${
                formErrors.description ? "border-red-500" : "border-gray-300"
              }`}
              rows={4}
            />
            {formErrors.description && <p className="text-red-600 text-xs mt-1">{formErrors.description}</p>}
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold disabled:bg-red-400"
            >
              {newCase._id ? (isSubmitting ? 'Updating...' : 'Update Emergency') 
                            : (isSubmitting ? 'Creating...' : 'Create & Dispatch Emergency')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
);
    return (
        <RoleGuard requiredRole="callOperator">
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
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                </div>
                                                <div className="hidden sm:block">
                                                    <div className="text-lg lg:text-xl font-bold text-gray-800">Call Operator Portal</div>
                                                    <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                                                </div>
                                                <div className="block sm:hidden">
                                                    <div className="text-sm font-bold text-gray-800">Call Operator</div>
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
                                            { key: 'emergencies', label: 'Emergencies', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            )},
                                            { key: 'available', label: 'Available', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                                                </svg>
                                            )},
                                            { key: 'feedback', label: 'Feedback', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                                        
                                        <div className="mt-6 pt-4 border-t border-gray-200/50">
                                            <button
                                                onClick={() => setIsFormOpen(true)}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                                            >
                                                New Emergency
                                            </button>
                                        </div>
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
                                                    {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.firstName || user?.name?.split(' ')[0] || 'Call Operator'}`}
                                                </h2>
                                                <p className="text-xs sm:text-sm opacity-90 mt-1">
                                                    You have {emergencies.filter(e => mapStatusForDisplay(e.status) === 'pending' || mapStatusForDisplay(e.status) === 'in-progress').length} active emergencies. Stay alert and ready to respond!
                                                </p>
                                                <button
                                                    onClick={() => setIsFormOpen(true)}
                                                    className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                                                >
                                                    New Emergency
                                                </button>
                                            </div>
                                            <div className="hidden md:block">
                                                {/* simple illustration block */}
                                                <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab buttons (for center area) */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {[
                                            { k: 'overview', t: 'Overview' },
                                            { k: 'emergencies', t: 'Emergency Management' },
                                            { k: 'available', t: 'Available Staff' },
                                            { k: 'feedback', t: 'Feedback Management' }
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

                                  {/* EMERGENCIES TAB */}
                                  {activeTab === 'emergencies' && (
                                    <div className="space-y-6">
                                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                                        <div className="relative z-10">
                                          <div className="px-8 py-6 border-b border-gray-100/50">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-100 rounded-2xl">
                                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                  </svg>
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-800">Emergency Management</h2>
                                              </div>
                                              <button
                                                onClick={generateEmergencyPDF}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                                              >
                                                Export PDF
                                              </button>
                                            </div>
                                          </div>
                                          <div className="p-8">

                                            {/* Status Filter Buttons */}
                                            <div className="flex items-center space-x-3 mb-6">
                                              {['', 'pending', 'in-progress', 'resolved'].map((status) => (
                                                <button
                                                  key={status || 'all'}
                                                  onClick={() => setStatusFilter(status)}
                                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                    statusFilter === status
                                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                                                      : 'bg-white/60 text-gray-700 border border-gray-200 hover:bg-white/80 hover:shadow-md'
                                                  }`}
                                                >
                                                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                                                </button>
                                              ))}
                                            </div>

                                            {emergencies.length > 0 ? (
                                              <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200/50">
                                                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                                    <tr>
                                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="bg-white/60 divide-y divide-gray-200/50">
                                                    {emergencies
                                                      .filter(e => !statusFilter || mapStatusForDisplay(e.status) === statusFilter)
                                                      .map((emergency) => (
                                                        <tr key={emergency._id} className="hover:bg-white/80 transition-all duration-300">
                                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                            {emergency.type || emergency.emergency_type || 'Unknown'}
                                                          </td>
                                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {emergency.location || 'Not specified'}
                                                          </td>
                                                          <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                              emergency.priority === 'Critical'
                                                                ? 'bg-red-200 text-red-900'
                                                                : emergency.priority === 'High'
                                                                  ? 'bg-red-100 text-red-800'
                                                                  : emergency.priority === 'Medium'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                              {emergency.priority || 'Medium'}
                                                            </span>
                                                          </td>
                                                          <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                              mapStatusForDisplay(emergency.status) === 'pending'
                                                                ? 'bg-red-100 text-red-800'
                                                                : mapStatusForDisplay(emergency.status) === 'in-progress'
                                                                  ? 'bg-yellow-100 text-yellow-800'
                                                                  : 'bg-green-100 text-green-800'
                                                            }`}>
                                                              {mapStatusForDisplay(emergency.status)}
                                                            </span>
                                                          </td>
                                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex gap-2">
                                                              <button
                                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                onClick={() => handleView(emergency)}
                                                              >
                                                                View
                                                              </button>
                                                              <button
                                                                onClick={async () => {
                                                                  if (!window.confirm('Are you sure you want to delete this emergency?')) return;
                                                                  try {
                                                                    await protectedApi.deleteEmergency(emergency._id);
                                                                    setEmergencies(prev => prev.filter(e => e._id !== emergency._id));
                                                                    alert('Emergency deleted successfully!');
                                                                  } catch (error) {
                                                                    console.error('Failed to delete emergency:', error);
                                                                    alert('Failed to delete emergency');
                                                                  }
                                                                }}
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
                                            ) : (
                                              <div className="text-center py-12">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No active cases</h3>
                                                <p className="mt-1 text-sm text-gray-500">Click 'New Emergency' to log a new incident.</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}


                                    {/* OVERVIEW TAB */}
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* Stat Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                                <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-blue-100 text-xs lg:text-sm font-medium">Active Emergencies</p>
                                                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{emergencies.filter(e => mapStatusForDisplay(e.status) === 'pending' || mapStatusForDisplay(e.status) === 'in-progress').length}</p>
                                                                <p className="text-blue-200 text-xs mt-1">Requires immediate attention</p>
                                                            </div>
                                                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
                                                                <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Feedback</p>
                                                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{feedback.length}</p>
                                                                <p className="text-blue-200 text-xs mt-1">Customer insights</p>
                                                            </div>
                                                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                                                                <p className="text-cyan-100 text-xs lg:text-sm font-medium">Open Complaints</p>
                                                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{complaints.filter(c => c.status === 'open' || c.status === 'pending').length}</p>
                                                                <p className="text-cyan-200 text-xs mt-1">Needs resolution</p>
                                                            </div>
                                                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                                                                <p className="text-green-100 text-xs lg:text-sm font-medium">Reports Generated</p>
                                                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{reports.length}</p>
                                                                <p className="text-green-200 text-xs mt-1">Documentation ready</p>
                                                            </div>
                                                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Recent Emergencies */}
                                            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                                                <div className="relative z-10">
                                                    <div className="px-8 py-6 border-b border-gray-100/50">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xl font-bold text-gray-800">Recent Emergencies</h4>
                                                            <div className="p-2 bg-blue-100 rounded-xl">
                                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8">
                                                        {emergencies.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {emergencies.slice(0, 3).map((emergency) => (
                                                                    <div key={emergency._id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300">
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold text-gray-900 text-lg">{emergency.type || emergency.emergency_type || 'Emergency'}</h3>
                                                                            <p className="text-sm text-gray-600 mt-1">{emergency.location || 'Location not specified'}</p>
                                                                            <p className="text-sm text-gray-500 mt-1">Priority: {emergency.priority || 'Medium'}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                                                                mapStatusForDisplay(emergency.status) === 'pending' || mapStatusForDisplay(emergency.status) === 'in-progress'
                                                                                    ? 'bg-red-100 text-red-800' 
                                                                                    : 'bg-green-100 text-green-800'
                                                                            }`}>
                                                                                {mapStatusForDisplay(emergency.status)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-12">
                                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                </svg>
                                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No emergencies recorded</h3>
                                                                <p className="mt-1 text-sm text-gray-500">All clear! No recent emergency cases.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                    {/* AVAILABLE TAB */}
                    {activeTab === 'available' && (
                      <div className="space-y-6">
                        <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                          <div className="relative z-10">
                            <div className="px-8 py-6 border-b border-gray-100/50">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Available Staff Assignment</h2>
                              </div>
                            </div>
                            <div className="p-8">

                              {emergencies.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200/50">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                      <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white/60 divide-y divide-gray-200/50">
                                      {emergencies
                                        .map((emergency) => (
                                        <tr key={emergency._id} className="hover:bg-white/80 transition-all duration-300">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{emergency.type || emergency.emergency_type || 'Unknown'}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emergency.location || 'Not specified'}</td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                              emergency.priority === 'Critical'
                                                ? 'bg-red-200 text-red-900'
                                                : emergency.priority === 'High'
                                                  ? 'bg-red-100 text-red-800'
                                                  : emergency.priority === 'Medium'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                              {emergency.priority || 'Medium'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                              mapStatusForDisplay(emergency.status) === 'pending'
                                                ? 'bg-red-100 text-red-800'
                                                : mapStatusForDisplay(emergency.status) === 'in-progress'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-green-100 text-green-800'
                                            }`}>
                                              {mapStatusForDisplay(emergency.status)}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {(emergency.assignedTo || emergency.assignment?.assignedTo) ? 
                                              <span className="text-green-600 font-medium">
                                                {(emergency.assignedTo?.firstName && emergency.assignedTo?.lastName) ? 
                                                  `${emergency.assignedTo.firstName} ${emergency.assignedTo.lastName}` :
                                                  (emergency.assignment?.assignedTo?.firstName && emergency.assignment?.assignedTo?.lastName) ?
                                                  `${emergency.assignment.assignedTo.firstName} ${emergency.assignment.assignedTo.lastName}` :
                                                  emergency.assignedTo?.name || 
                                                  emergency.assignedTo?.userId?.name ||
                                                  (emergency.assignedTo?.userId ? 
                                                    `${emergency.assignedTo.userId.firstName || ''} ${emergency.assignedTo.userId.lastName || ''}`.trim() : 
                                                    'Assigned')
                                                }
                                              </span> : 
                                              pendingAssignments[emergency._id] ? 
                                              <span className="text-yellow-600 font-medium">
                                                {pendingAssignments[emergency._id].firstName} {pendingAssignments[emergency._id].lastName} (Pending)
                                              </span> :
                                              <span className="text-red-600 font-medium">Unassigned</span>
                                            }
                                          </td>

                                          {/* Editable Assigned To field */}
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                              value={pendingAssignments[emergency._id]?.userId || emergency.assignedTo?.userId || emergency.assignedTo?._id || emergency.assignment?.assignedTo?._id || ''}
                                              onChange={(e) => {
                                                if (!e.target.value) {
                                                  // Handle unassignment - remove from pending assignments
                                                  setPendingAssignments(prev => {
                                                    const updated = { ...prev };
                                                    delete updated[emergency._id];
                                                    return updated;
                                                  });
                                                  return;
                                                }

                                                const staff = availableStaff.find(s => s._id === e.target.value);
                                                if (!staff) return;

                                                const backendRole = mapRoleToBackend(staff.role);
                                                if (!backendRole) {
                                                  alert('Invalid staff role for emergency assignment');
                                                  return;
                                                }

                                                // Store as pending assignment (not yet saved to database)
                                                setPendingAssignments(prev => ({
                                                  ...prev,
                                                  [emergency._id]: { 
                                                    userId: staff._id, 
                                                    userModel: backendRole,
                                                    firstName: staff.firstName,
                                                    lastName: staff.lastName,
                                                    name: `${staff.firstName} ${staff.lastName}`,
                                                    role: staff.role,
                                                    status: staff.status
                                                  }
                                                }));
                                              }}
                                              className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full bg-white/80 hover:bg-white transition-colors"
                                            >
                                              <option value="">Select staff</option>
                                              {availableStaff.map(staff => (
                                                <option key={staff._id} value={staff._id}>
                                                  {staff.firstName} {staff.lastName} ({staff.role}) - {staff.status || 'active'}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          {/* Actions: View + Update Assignment */}
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleView(emergency)}
                                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                                              >
                                                View
                                              </button>
                                              <button
                                                onClick={() => handleUpdateAssignment(emergency)}
                                                disabled={!pendingAssignments[emergency._id]}
                                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                  pendingAssignments[emergency._id] 
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                              >
                                                Assign
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned emergencies available</h3>
                                  <p className="mt-1 text-sm text-gray-500">All emergencies have been assigned to staff members.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}



                                   {/* FEEDBACK TAB */}
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
                                                    <div className="p-8">
                                                        {feedback.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {feedback.slice(0, 5).map((item) => (
                                                                    <div key={item._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                <h3 className="text-lg font-semibold text-gray-900">{item.title || 'Feedback'}</h3>
                                                                                <p className="text-sm text-gray-600 mt-2">{item.message || 'No message provided'}</p>
                                                                                <p className="text-xs text-gray-500 mt-3 font-medium">From: {item.username}</p>
                                                                                <button
                                                                                    onClick={() => handleDeleteFeedback(item._id)}
                                                                                    className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                            <div className="flex flex-col items-end gap-2">
                                                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                                                    item.status === 'resolved' 
                                                                                        ? 'bg-green-100 text-green-800' 
                                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                                }`}>
                                                                                    {item.status || 'Pending'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-12">
                                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback</h3>
                                                                <p className="mt-1 text-sm text-gray-500">No feedback has been submitted yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMPLAINTS TAB
                                    {activeTab === 'complaints' && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Complaint Management</h2>
                                                {complaints.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {complaints.slice(0, 5).map((complaint) => (
                                                            <div key={complaint._id} className="border border-gray-200 rounded-lg p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <h3 className="text-sm font-medium text-gray-900">Complaint</h3>
                                                                        <p className="text-sm text-gray-600 mt-1">{complaint.message || 'No description provided'}</p>
                                                                        <p className="text-xs text-gray-500 mt-2">From: {complaint.username || 'Anonymous'}</p>
                                                                    </div>
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        complaint.status === 'resolved' 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : complaint.status === 'in_progress'
                                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {complaint.status || 'Open'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints</h3>
                                                        <p className="mt-1 text-sm text-gray-500">No complaints have been submitted yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                       */}
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
         {isFormOpen && (
  <NewEmergencyForm
    newCase={newCase}
    handleFormSubmit={handleFormSubmit} // parent handler
    resetForm={() => setIsFormOpen(false)}
    submitMessage={submitMessage}
    isSubmitting={isSubmitting}
    formErrors={formErrors}
    setFormErrors={setFormErrors}
  />
)}
{isViewOpen && selectedEmergency && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 md:p-8 relative">
      
      {/* Close button (top-right) */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        onClick={() => setIsViewOpen(false)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="text-2xl font-bold text-red-700 mb-6 text-center">Emergency Details</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Name:</span>
          <span className="text-gray-900">
            {selectedEmergency.reporter?.guestInfo?.name || 
             selectedEmergency.name || 
             'Not provided'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Phone:</span>
          <span className="text-gray-900">
            {selectedEmergency.reporter?.guestInfo?.phone || 
             selectedEmergency.phone || 
             'Not provided'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Email:</span>
          <span className="text-gray-900">
            {selectedEmergency.reporter?.guestInfo?.email || 
             selectedEmergency.email || 
             'Not provided'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Property:</span>
          <span className="text-gray-900">
            {selectedEmergency.property_name || 
             selectedEmergency.reporter?.guestInfo?.property_name || 
             'Not provided'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-white px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 capitalize">
            {selectedEmergency.type || selectedEmergency.emergency_type}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Priority:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            selectedEmergency.priority === 'Critical' ? 'bg-red-600 text-white' :
            selectedEmergency.priority === 'High' ? 'bg-red-400 text-white' :
            selectedEmergency.priority === 'Medium' ? 'bg-yellow-400 text-white' :
            'bg-green-400 text-white'
          } capitalize`}>
            {selectedEmergency.priority}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Location:</span>
          <span className="text-gray-900">{selectedEmergency.location}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-700">Description:</span>
          <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">{selectedEmergency.description}</p>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            mapStatusForDisplay(selectedEmergency.status) === 'pending' ? 'bg-red-100 text-red-800' :
            mapStatusForDisplay(selectedEmergency.status) === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          } capitalize`}>
            {mapStatusForDisplay(selectedEmergency.status)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-700 mb-2">Assigned To:</span>
          {(selectedEmergency.assignedTo || selectedEmergency.assignment?.assignedTo) ? 
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-800 font-medium">
                {(selectedEmergency.assignedTo?.firstName && selectedEmergency.assignedTo?.lastName) ? 
                  `${selectedEmergency.assignedTo.firstName} ${selectedEmergency.assignedTo.lastName}` :
                  (selectedEmergency.assignment?.assignedTo?.firstName && selectedEmergency.assignment?.assignedTo?.lastName) ?
                  `${selectedEmergency.assignment.assignedTo.firstName} ${selectedEmergency.assignment.assignedTo.lastName}` :
                  selectedEmergency.assignedTo?.name || 
                  selectedEmergency.assignedTo?.userId?.name ||
                  (selectedEmergency.assignedTo?.userId ? 
                    `${selectedEmergency.assignedTo.userId.firstName || ''} ${selectedEmergency.assignedTo.userId.lastName || ''}`.trim() : 
                    'Assigned')
                }
              </div>
              {(selectedEmergency.assignedTo?.email || selectedEmergency.assignment?.assignedTo?.email) && 
                <div className="text-green-700 text-sm mt-1">
                  📧 {(selectedEmergency.assignedTo?.email || selectedEmergency.assignment?.assignedTo?.email)}
                </div>
              }
              {(selectedEmergency.assignedTo?.role || selectedEmergency.assignment?.assignedTo?.role || selectedEmergency.assignment?.assignedRole) && 
                <div className="text-green-600 text-sm mt-1">
                  👤 {(selectedEmergency.assignedTo?.role || selectedEmergency.assignment?.assignedTo?.role || selectedEmergency.assignment?.assignedRole)}
                </div>
              }
            </div> : 
            pendingAssignments[selectedEmergency._id] ? 
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-yellow-800 font-medium">
                {pendingAssignments[selectedEmergency._id].firstName} {pendingAssignments[selectedEmergency._id].lastName} (Pending Assignment)
              </div>
              <div className="text-yellow-600 text-sm mt-1">
                👤 {pendingAssignments[selectedEmergency._id].role} - {pendingAssignments[selectedEmergency._id].status}
              </div>
              <div className="text-yellow-600 text-sm mt-1">
                ⚠️ Click "Assign" button to save this assignment
              </div>
            </div> :
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-red-600 font-medium">Unassigned</span>
            </div>
          }
        </div>
      </div>
    </div>
  </div>
)}


        </RoleGuard>
    );
};

const StatCard = ({ title, value, color, icon }) => {
    const colorClasses = {
        red: 'text-red-600 bg-red-100',
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        orange: 'text-orange-600 bg-orange-100',
        purple: 'text-purple-600 bg-purple-100'
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                    </svg>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default CallOperatorDashboard;