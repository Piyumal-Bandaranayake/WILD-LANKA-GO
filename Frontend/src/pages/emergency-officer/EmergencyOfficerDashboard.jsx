import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { formatLocation } from '../../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../../assets/logo.png';

// StatCard component for displaying stats
const StatCard = ({ title, value, color, iconPath }) => {
    const colorClasses = {
        red: 'bg-red-50 border-red-200 text-red-800',
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };

    const iconColorClasses = {
        red: 'text-red-600',
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        yellow: 'text-yellow-600',
        orange: 'text-orange-600'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} bg-white shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-75">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-white ${iconColorClasses[color]}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const EmergencyOfficerDashboard = () => {
    const { user } = useAuth();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showSimpleStatusModal, setShowSimpleStatusModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        badgeNumber: '',
        specialization: '',
        experience: '',
        certifications: []
    });
    const [statusUpdate, setStatusUpdate] = useState({
        status: '',
        firstAidProvided: '',
        hospitalCoordination: '',
        responseNotes: '',
        estimatedArrival: '',
        teamSize: 1,
        assignedDriver: '',
        patientCondition: '',
        hospitalNotified: false,
        hospitalName: '',
        ambulanceRequired: false
    });
    const [simpleStatusUpdate, setSimpleStatusUpdate] = useState('');

    const [stats, setStats] = useState({
        totalEmergencies: 0,
        pendingEmergencies: 0,
        inProgressEmergencies: 0,
        resolvedToday: 0,
        averageResponseTime: '12 min',
        hospitalCoordinations: 0,
        firstAidCases: 0,
        criticalCases: 0,
        reportsGenerated: 0,
        totalEmergenciesToday: 0,
        driverAssignments: 0
    });



    useEffect(() => {
        console.log('🔄 EmergencyOfficerDashboard useEffect triggered', {
            user: user,
            role: user?.role,
            isEmergencyOfficer: user?.role === 'emergencyOfficer'
        });
        
        if (user?.role === 'emergencyOfficer') {
            console.log('✅ User is emergencyOfficer, calling fetchEmergencies');
            fetchEmergencies();
            initializeProfile();
            
            // Safety timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                console.log('⏰ Safety timeout reached, forcing loading to false');
                setLoading(false);
            }, 10000); // 10 seconds timeout
            
            return () => clearTimeout(timeout);
        } else {
            console.log('❌ User is not emergencyOfficer, role:', user?.role);
        }
    }, [user]);

    const initializeProfile = () => {
        setProfileData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            badgeNumber: user?.badgeNumber || '',
            specialization: user?.specialization || 'Emergency Response',
            experience: user?.experience || '',
            certifications: user?.certifications || ['First Aid', 'CPR']
        });
    };

    const fetchEmergencies = async () => {
        try {
            console.log('🔄 Starting fetchEmergencies...');
            setLoading(true);
            setError(null);
            
            console.log('📡 Calling APIs...');
            const [assignedEmergenciesResponse, formsResponse] = await Promise.all([
                protectedApi.getAssignedEmergencies(),
                protectedApi.getEmergencyForms()
            ]);
            
            console.log('📊 API responses received:', {
                assignedEmergencies: assignedEmergenciesResponse,
                forms: formsResponse
            });
            
            // Extract data from responses
            const assignedEmergencies = assignedEmergenciesResponse?.data?.data || assignedEmergenciesResponse?.data || [];
            const allForms = formsResponse?.data?.data || formsResponse?.data || [];

            console.log('📊 Extracted data:', {
                assignedEmergencies: assignedEmergencies.length,
                allForms: allForms.length
            });

            // Ensure we have arrays
            const safeAssignedEmergencies = Array.isArray(assignedEmergencies) ? assignedEmergencies : [];
            const safeForms = Array.isArray(allForms) ? allForms : [];
            
            // Filter for emergency forms assigned to current user
            const assignedForms = safeForms.filter(f => 
                f && f.assignedTo && f.assignedTo.userId && f.assignedTo.userId.toString() === user._id
            );
            
            console.log('✅ Filtered data:', {
                assignedEmergencies: safeAssignedEmergencies.length,
                assignedForms: assignedForms.length
            });

            // Convert forms to emergency format for unified display
            const convertedForms = assignedForms.map(form => ({
                _id: form._id,
                type: 'Human',
                description: form.description,
                location: form.location,
                status: 'pending', // Forms are always pending until processed
                priority: 'medium', // Default priority for forms
                reporterName: form.name,
                reporterPhone: form.phone,
                reporterEmail: form.email,
                propertyName: form.property_name,
                createdAt: form.date,
                date: form.date,
                time: form.time,
                emergencyType: form.emergency_type,
                isForm: true // Flag to identify form-based emergencies
            }));

            // Combine assigned emergencies and converted forms
            const allAssignedEmergencies = [...safeAssignedEmergencies, ...convertedForms];
            console.log('🔍 Final emergencies data:', allAssignedEmergencies);
            console.log('🔍 Sample emergency:', allAssignedEmergencies[0]);
            setEmergencies(allAssignedEmergencies);

            // Calculate stats for assigned emergencies only
            const today = new Date().toDateString();
            const resolvedToday = allAssignedEmergencies.filter(e =>
                (e.status === 'Resolved' || e.status === 'Closed' || e.status === 'resolved') &&
                new Date(e.createdAt || e.date).toDateString() === today
            ).length;

            const emergenciesToday = allAssignedEmergencies.filter(e =>
                new Date(e.createdAt || e.date).toDateString() === today
            ).length;

            setStats({
                totalEmergencies: allAssignedEmergencies.length,
                pendingEmergencies: allAssignedEmergencies.filter(e => 
                    e.status === 'pending' || e.status === 'Pending' || e.status === 'Reported'
                ).length,
                inProgressEmergencies: allAssignedEmergencies.filter(e => 
                    e.status === 'In Progress' || e.status === 'in-progress'
                ).length,
                resolvedToday,
                totalEmergenciesToday: emergenciesToday,
                averageResponseTime: '12 min',
                hospitalCoordinations: allAssignedEmergencies.filter(e =>
                    e.hospitalCoordination && e.hospitalCoordination.trim() !== ''
                ).length,
                firstAidCases: allAssignedEmergencies.filter(e =>
                    e.firstAidProvided && e.firstAidProvided.trim() !== ''
                ).length,
                criticalCases: allAssignedEmergencies.filter(e => e.priority === 'critical' || e.priority === 'Critical').length,
                reportsGenerated: 0, // This would come from a reports API
                driverAssignments: allAssignedEmergencies.filter(e => 
                    e.assignedDriver && e.assignedDriver.trim() !== ''
                ).length
            });
        } catch (error) {
            console.error('❌ Failed to fetch emergencies:', error);
            setError('Failed to load emergency data');
            
            // Set empty data to prevent infinite loading
            setEmergencies([]);
            setStats({
                totalEmergencies: 0,
                pendingEmergencies: 0,
                inProgressEmergencies: 0,
                resolvedToday: 0,
                averageResponseTime: '12 min',
                hospitalCoordinations: 0,
                firstAidCases: 0,
                criticalCases: 0,
                reportsGenerated: 0,
                totalEmergenciesToday: 0,
                driverAssignments: 0
            });
        } finally {
            console.log('🔄 Setting loading to false');
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.updateEmergencyStatus(selectedEmergency._id, statusUpdate.status);

            // In a real system, you would also update additional fields like first aid, hospital coordination, etc.
            // For now, we'll just update the status and show a success message

            setShowUpdateModal(false);
            setSelectedEmergency(null);
            setStatusUpdate({
                status: '',
                firstAidProvided: '',
                hospitalCoordination: '',
                responseNotes: '',
                estimatedArrival: '',
                teamSize: 1,
                assignedDriver: '',
                patientCondition: '',
                hospitalNotified: false,
                hospitalName: '',
                ambulanceRequired: false
            });
            fetchEmergencies();
            alert('Emergency status updated successfully!');
        } catch (error) {
            console.error('Failed to update emergency:', error);
            setError('Failed to update emergency status');
        }
    };

    const handleSimpleStatusUpdate = async (e) => {
        e.preventDefault();
        try {
            console.log('🔄 Updating status to:', simpleStatusUpdate);
            await protectedApi.updateEmergencyStatusSimple(selectedEmergency._id, { status: simpleStatusUpdate });

            setShowSimpleStatusModal(false);
            setSelectedEmergency(null);
            setSimpleStatusUpdate('');
            fetchEmergencies();
            alert('Emergency status updated successfully!');
        } catch (error) {
            console.error('Failed to update emergency status:', error);
            setError('Failed to update emergency status');
        }
    };

    const openDetailModal = (emergency) => {
        setSelectedEmergency(emergency);
        setShowDetailModal(true);
    };

    const openUpdateModal = (emergency) => {
        setSelectedEmergency(emergency);
        setStatusUpdate({
            status: emergency.status,
            firstAidProvided: emergency.firstAidProvided || '',
            hospitalCoordination: emergency.hospitalCoordination || '',
            responseNotes: emergency.responseNotes || '',
            estimatedArrival: emergency.estimatedArrival || '',
            teamSize: emergency.teamSize || 1,
            assignedDriver: emergency.assignedDriver || '',
            patientCondition: emergency.patientCondition || '',
            hospitalNotified: emergency.hospitalNotified || false,
            hospitalName: emergency.hospitalName || '',
            ambulanceRequired: emergency.ambulanceRequired || false
        });
        setShowUpdateModal(true);
    };

    // Helper to determine next available statuses for the simple update modal
    const getAvailableNextStatuses = (currentStatus) => {
        switch (currentStatus) {
            case 'pending':
            case 'Pending':
            case 'Reported': // Handle legacy status
                return [{ label: 'In Progress', value: 'In Progress' }];
            case 'In Progress':
            case 'in-progress':
                return [{ label: 'Resolved', value: 'Resolved' }];
            case 'Resolved':
            case 'Closed':
            case 'resolved':
                return []; // No further updates
            default:
                return [{ label: 'In Progress', value: 'In Progress' }]; // Default to In Progress
        }
    };

    const openSimpleStatusModal = (emergency) => {
        setSelectedEmergency(emergency);
        const nextStatuses = getAvailableNextStatuses(emergency.status);
        setSimpleStatusUpdate(nextStatuses.length > 0 ? nextStatuses[0].value : ''); // Pre-select the next status
        setShowSimpleStatusModal(true);
    };

    const handleDownloadReport = async (reportType) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const filename = `emergency-operations-summary-${today}.pdf`;
            
            generatePDFReport();
            setStats(prev => ({ ...prev, reportsGenerated: prev.reportsGenerated + 1 }));
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
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
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, margin, 105);
        }
        
        // Date and user info - positioned on the right side with proper spacing
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 85, { align: 'right' });
        
        // User info - positioned below date with more space
        doc.setFontSize(10);
        doc.text(`Emergency Officer: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Emergency Officer'}`, pageWidth - margin, 105, { align: 'right' });
        
        // Line separator - positioned below all content with more space
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, 125, pageWidth - margin, 125);
        
        return 135; // Return Y position for content with proper spacing
    };

    const generatePDFReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        let yPosition = createFormalHeader(doc, 'Emergency Operations Summary Report', 'Complete overview of emergency operations and statistics');
        
        
        // All Emergency Cases Section
        if (emergencies.length > 0) {
            yPosition += 15;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('All Emergency Cases', margin, yPosition);
            yPosition += 20;
            
            // Display emergencies as a list
            emergencies.forEach((emergency, index) => {
                // Debug: Log emergency data structure
                console.log('🚨 Emergency data for PDF:', emergency);
                console.log('🚨 Available fields:', Object.keys(emergency));
                
                // Try multiple possible reporter name fields
                let reporterName = 'N/A';
                if (emergency.reporterName) {
                    reporterName = emergency.reporterName;
                } else if (emergency.reporter?.guestInfo?.name) {
                    reporterName = emergency.reporter.guestInfo.name;
                } else if (emergency.name) {
                    reporterName = emergency.name;
                } else if (emergency.reporter?.name) {
                    reporterName = emergency.reporter.name;
                }
                
                // Check if we need a new page
                if (yPosition > pageHeight - 100) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Emergency case header
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text(`Emergency Case ${index + 1}`, margin, yPosition);
                yPosition += 15;
                
                // Emergency details
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(55, 65, 81);
                
                const details = [
                    `ID: ${emergency._id || 'N/A'}`,
                    `Description: ${emergency.description || emergency.incident?.description || 'N/A'}`,
                    `Location: ${formatLocation(emergency.location) || emergency.incident?.location?.name || 'N/A'}`,
                    `Status: ${emergency.status || 'N/A'}`,
                    `Priority: ${emergency.priority || 'N/A'}`,
                    `Reporter: ${reporterName}`,
                    `Date: ${new Date(emergency.createdAt || emergency.date).toLocaleDateString()}`
                ];
                
                details.forEach(detail => {
                    // Check if we need a new page for this detail
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.text(detail, margin + 10, yPosition);
                    yPosition += 8;
                });
                
                // Add separator line between cases
                if (index < emergencies.length - 1) {
                    yPosition += 5;
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 10;
                }
            });
        } else {
            yPosition += 15;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            doc.text('No emergency cases found.', margin, yPosition);
        }
        
        // Add footer to all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text('Wild Lanka Go - Emergency Operations Portal', margin, pageHeight - 15);
            doc.text(`Page ${i}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
        }
        
        // Save the PDF
        const todayStr = new Date().toISOString().split('T')[0];
        doc.save(`emergency-operations-summary-${todayStr}.pdf`);
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

    const getStatusColor = (status) => {
        const mappedStatus = mapStatusForDisplay(status);
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return colors[mappedStatus] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800',
            critical: 'bg-red-200 text-red-900'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hr ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
        }
    };

    // Role-based access control is handled by RoleGuard wrapper

    if (loading) {
        return (
            <RoleGuard requiredRole="emergencyOfficer">
                <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading emergency officer dashboard...</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </RoleGuard>
        );
    }

    const activeEmergencies = emergencies.filter(e => 
        e.status === 'In Progress' || e.status === 'in-progress'
    );
    const pendingEmergencies = emergencies.filter(e => 
        e.status === 'pending' || e.status === 'Pending' || e.status === 'Reported'
    );
    const resolvedEmergencies = emergencies.filter(e => 
        e.status === 'Resolved' || e.status === 'Closed' || e.status === 'resolved'
    );
    
    console.log('🔍 Filtering results:', {
        totalEmergencies: emergencies.length,
        activeEmergencies: activeEmergencies.length,
        pendingEmergencies: pendingEmergencies.length,
        resolvedEmergencies: resolvedEmergencies.length,
        allStatuses: emergencies.map(e => e.status)
    });

    return (
        <RoleGuard requiredRole="emergencyOfficer">
            <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
                <Navbar />
                <div className="flex-1 pt-28 pb-10">
                    <div className="mx-auto max-w-7xl px-4">
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
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                </div>
                                                <div className="hidden sm:block">
                                                    <div className="text-lg lg:text-xl font-bold text-gray-800">Emergency Officer Portal</div>
                                                    <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                                                </div>
                                                <div className="block sm:hidden">
                                                    <div className="text-sm font-bold text-gray-800">Emergency Officer</div>
                                                </div>
                                            </div>
                                            {/* Mobile Menu Toggle - Hidden on desktop */}
                                            <button className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                                <p className="text-sm text-red-800">{error}</p>
                                            </div>
                                        )}

                                        {[
                                            { key: 'active', label: 'Active Emergencies', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            )},
                                            { key: 'pending', label: 'Pending Emergencies', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            )},
                                            { key: 'resolved', label: 'Resolved Emergencies', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )},
                                            { key: 'reports', label: 'Reports', icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                                                onClick={() => setShowProfileModal(true)}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                                            >
                                                Profile Settings
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
                                                    {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.firstName || user?.name?.split(' ')[0] || 'Emergency Officer'}`}
                                                </h2>
                                                <p className="text-xs sm:text-sm opacity-90 mt-1">
                                                    You have {stats.pendingEmergencies + stats.inProgressEmergencies} active emergencies. Stay alert and ready to respond!
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('active')}
                                                    className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                                                >
                                                    View Active Emergencies
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
                                            { k: 'active', t: 'Active Emergencies' },
                                            { k: 'pending', t: 'Pending Emergencies' },
                                            { k: 'resolved', t: 'Resolved Emergencies' },
                                            { k: 'reports', t: 'Reports' }
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

                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                        <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-blue-100 text-xs lg:text-sm font-medium">Active Emergencies</p>
                                                        <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats.pendingEmergencies + stats.inProgressEmergencies}</p>
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
                                                        <p className="text-blue-100 text-xs lg:text-sm font-medium">Today's Emergencies</p>
                                                        <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats.totalEmergenciesToday}</p>
                                                        <p className="text-blue-200 text-xs mt-1">Total reported today</p>
                                                    </div>
                                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-orange-100 text-xs lg:text-sm font-medium">In Progress</p>
                                                        <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats.inProgressEmergencies}</p>
                                                        <p className="text-orange-200 text-xs mt-1">Currently responding</p>
                                                    </div>
                                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
                                                        <p className="text-green-100 text-xs lg:text-sm font-medium">Resolved Today</p>
                                                        <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats.resolvedToday}</p>
                                                        <p className="text-green-200 text-xs mt-1">Successfully completed</p>
                                                    </div>
                                                    <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                                        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Lists */}
                                    {(activeTab === 'active' || activeTab === 'pending' || activeTab === 'resolved') && (
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
                                                                <h2 className="text-2xl font-bold text-gray-800">
                                                                    {activeTab === 'active' && 'Active Human Emergencies'}
                                                                    {activeTab === 'pending' && 'Pending Human Emergencies'}
                                                                    {activeTab === 'resolved' && 'Resolved Human Emergencies'}
                                                                </h2>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8">
                                                        {(activeTab === 'active' ? activeEmergencies :
                                                          activeTab === 'pending' ? pendingEmergencies : resolvedEmergencies).length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200/50">
                                                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                                                        <tr>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Human Emergency Details</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white/60 divide-y divide-gray-200/50">
                                                                        {(activeTab === 'active' ? activeEmergencies :
                                                                          activeTab === 'pending' ? pendingEmergencies : resolvedEmergencies).map((emergency) => (
                                                                            <tr key={emergency._id} className="hover:bg-white/80 transition-all duration-300">
                                                                                <td className="px-6 py-4">
                                                                                    <div className="text-sm font-semibold text-gray-900">{emergency.description}</div>
                                                                                    {emergency.reporterName && (
                                                                                        <div className="text-sm text-gray-500">Reporter: {emergency.reporterName}</div>
                                                                                    )}
                                                                                    {emergency.reporterPhone && (
                                                                                        <div className="text-sm text-gray-500">Phone: {emergency.reporterPhone}</div>
                                                                                    )}
                                                                                    {emergency.propertyName && (
                                                                                        <div className="text-sm text-blue-600">Property: {emergency.propertyName}</div>
                                                                                    )}
                                                                                    {emergency.assignedDriver && (
                                                                                        <div className="text-sm text-green-600">Driver: {emergency.assignedDriver}</div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                                    {formatLocation(emergency.location)}
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
                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                                                                        emergency.isForm ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                                    }`}>
                                                                                        {emergency.isForm ? 'Form' : 'Call'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                                    {getTimeAgo(emergency.createdAt || emergency.date)}
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => openDetailModal(emergency)}
                                                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                                        >
                                                                                            View
                                                                                        </button>
                                                                                        {getAvailableNextStatuses(emergency.status).length > 0 && (
                                                                                            <button
                                                                                                onClick={() => openSimpleStatusModal(emergency)}
                                                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                                            >
                                                                                                Update
                                                                                            </button>
                                                                                        )}
                                                                                        <a
                                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                                        >
                                                                                            Track
                                                                                        </a>
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
                                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} human emergencies found</h3>
                                                                <p className="mt-1 text-sm text-gray-500">All clear! No {activeTab} emergency cases.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reports Tab */}
                                    {activeTab === 'reports' && (
                                        <div className="space-y-6">
                                            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                                                <div className="relative z-10">
                                                    <div className="px-8 py-6 border-b border-gray-100/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-100 rounded-2xl">
                                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <h2 className="text-2xl font-bold text-gray-800">Human Emergency Response Reports</h2>
                                                        </div>
                                                    </div>
                                                    <div className="p-8">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                                            <div className="text-center p-6 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                                                                <div className="text-3xl font-bold text-blue-600">{stats.totalEmergencies}</div>
                                                                <div className="text-sm text-gray-600">Total Human Emergencies</div>
                                                            </div>
                                                            <div className="text-center p-6 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                                                                <div className="text-3xl font-bold text-green-600">{stats.resolvedToday}</div>
                                                                <div className="text-sm text-gray-600">Resolved Today</div>
                                                            </div>
                                                            <div className="text-center p-6 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                                                                <div className="text-3xl font-bold text-blue-600">{stats.averageResponseTime}</div>
                                                                <div className="text-sm text-gray-600">Average Response Time</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-center">
                                                            <button 
                                                                onClick={() => handleDownloadReport('daily-summary')}
                                                                className="bg-white/60 hover:bg-white/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left max-w-md border border-white/50 backdrop-blur-sm">
                                                                <div className="flex items-center">
                                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <h3 className="text-lg font-medium text-gray-900">Operation Summary</h3>
                                                                        <p className="text-sm text-gray-500">Complete emergency operations overview with all cases</p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </main>

                            {/* RIGHT WIDGETS */}
                            <aside className="col-span-12 lg:col-span-3">
                                <div className="space-y-6">

                                    {/* Urgent Alerts - PRESERVED AS REQUESTED */}

                                </div>
            </aside>
        </div>
    </div>
</div>

                {/* Detail Modal */}
                {showDetailModal && selectedEmergency && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-4">Emergency Details</h2>
                            <div className="space-y-3">
                                <div>
                                    <span className="font-medium">Type:</span> Human Emergency
                                    {selectedEmergency.isForm && (
                                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            From Form
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="font-medium">Description:</span> {selectedEmergency.description}
                                </div>
                                <div>
                                    <span className="font-medium">Location:</span> {formatLocation(selectedEmergency.location)}
                                </div>
                                {selectedEmergency.propertyName && (
                                    <div>
                                        <span className="font-medium">Property:</span> {selectedEmergency.propertyName}
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Priority:</span>
                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedEmergency.priority)}`}>
                                        {selectedEmergency.priority}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Status:</span>
                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmergency.status)}`}>
                                        {mapStatusForDisplay(selectedEmergency.status)}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Assigned To:</span>
                                    <div className="mt-2">
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
                                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <span className="text-red-600 font-medium">Unassigned</span>
                                          </div>
                                        }
                                    </div>
                                </div>
                                {selectedEmergency.reporterName && (
                                    <div>
                                        <span className="font-medium">Reporter:</span> {selectedEmergency.reporterName}
                                    </div>
                                )}
                                {selectedEmergency.reporterPhone && (
                                    <div>
                                        <span className="font-medium">Contact:</span> 
                                        <a href={`tel:${selectedEmergency.reporterPhone}`} className="ml-2 text-blue-600 hover:text-blue-800">
                                            {selectedEmergency.reporterPhone}
                                        </a>
                                    </div>
                                )}
                                {selectedEmergency.reporterEmail && (
                                    <div>
                                        <span className="font-medium">Email:</span> 
                                        <a href={`mailto:${selectedEmergency.reporterEmail}`} className="ml-2 text-blue-600 hover:text-blue-800">
                                            {selectedEmergency.reporterEmail}
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Reported:</span> {getTimeAgo(selectedEmergency.createdAt || selectedEmergency.date)}
                                </div>
                                {selectedEmergency.firstAidProvided && (
                                    <div>
                                        <span className="font-medium">First Aid:</span> {selectedEmergency.firstAidProvided}
                                    </div>
                                )}
                                {selectedEmergency.responseNotes && (
                                    <div>
                                        <span className="font-medium">Response Notes:</span> {selectedEmergency.responseNotes}
                                    </div>
                                )}
                                {selectedEmergency.assignedDriver && (
                                    <div>
                                        <span className="font-medium">Assigned Driver:</span> {selectedEmergency.assignedDriver}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                                {selectedEmergency.reporterPhone && (
                                    <a
                                        href={`tel:${selectedEmergency.reporterPhone}`}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                                    >
                                        Call Reporter
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Update Status Modal */}
                {showUpdateModal && selectedEmergency && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Update Emergency Response</h2>
                            <form onSubmit={handleUpdateStatus}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select
                                            value={statusUpdate.status}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Assigned Driver</label>
                                        <input
                                            type="text"
                                            value={statusUpdate.assignedDriver}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, assignedDriver: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="Driver name/ID assigned by call operator"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Patient Condition</label>
                                        <select
                                            value={statusUpdate.patientCondition}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, patientCondition: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Select condition</option>
                                            <option value="stable">Stable</option>
                                            <option value="minor">Minor Injury</option>
                                            <option value="serious">Serious</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">First Aid Provided</label>
                                        <textarea
                                            value={statusUpdate.firstAidProvided}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, firstAidProvided: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Describe first aid measures taken on-site..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={statusUpdate.hospitalNotified}
                                                onChange={(e) => setStatusUpdate({...statusUpdate, hospitalNotified: e.target.checked})}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium">Hospital Notified</span>
                                        </label>
                                    </div>
                                    
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={statusUpdate.ambulanceRequired}
                                                onChange={(e) => setStatusUpdate({...statusUpdate, ambulanceRequired: e.target.checked})}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium">Ambulance Required</span>
                                        </label>
                                    </div>
                                    
                                    {statusUpdate.hospitalNotified && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Hospital Name</label>
                                            <input
                                                type="text"
                                                value={statusUpdate.hospitalName}
                                                onChange={(e) => setStatusUpdate({...statusUpdate, hospitalName: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                placeholder="Name of hospital contacted"
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Hospital Coordination Details</label>
                                        <textarea
                                            value={statusUpdate.hospitalCoordination}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, hospitalCoordination: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Hospital coordination and communication details..."
                                        />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Response Notes</label>
                                        <textarea
                                            value={statusUpdate.responseNotes}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, responseNotes: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={3}
                                            placeholder="Additional response notes and on-site observations..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Update Emergency Response
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Profile Modal */}
                {showProfileModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-4">Emergency Officer Profile</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Enter your email"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Badge Number</label>
                                    <input
                                        type="text"
                                        value={profileData.badgeNumber}
                                        onChange={(e) => setProfileData({...profileData, badgeNumber: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Enter your badge number"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Specialization</label>
                                    <select
                                        value={profileData.specialization}
                                        onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Emergency Response">Emergency Response</option>
                                        <option value="First Aid Specialist">First Aid Specialist</option>
                                        <option value="Trauma Care">Trauma Care</option>
                                        <option value="Rescue Operations">Rescue Operations</option>
                                        <option value="Medical Emergency">Medical Emergency</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Years of Experience</label>
                                    <input
                                        type="number"
                                        value={profileData.experience}
                                        onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Years of experience"
                                        min="0"
                                        max="50"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Certifications</label>
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg">
                                        {['First Aid', 'CPR', 'EMT', 'Paramedic', 'Trauma Care', 'Rescue Operations'].map(cert => (
                                            <label key={cert} className="flex items-center space-x-1">
                                                <input
                                                    type="checkbox"
                                                    checked={profileData.certifications.includes(cert)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setProfileData({
                                                                ...profileData,
                                                                certifications: [...profileData.certifications, cert]
                                                            });
                                                        } else {
                                                            setProfileData({
                                                                ...profileData,
                                                                certifications: profileData.certifications.filter(c => c !== cert)
                                                            });
                                                        }
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="text-sm">{cert}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // In a real app, you would save to backend here
                                        console.log('Profile updated:', profileData);
                                        setShowProfileModal(false);
                                        alert('Profile updated successfully!');
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simple Status Update Modal */}
                {showSimpleStatusModal && selectedEmergency && (() => {
                    const availableStatuses = getAvailableNextStatuses(selectedEmergency.status);
                    const canUpdate = availableStatuses.length > 0;
                    
                    return (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4">Update Emergency Status</h2>
                                <p className="text-gray-600 mb-4">
                                    Emergency: {selectedEmergency.description}
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Current Status: <span className="font-medium">{selectedEmergency.status}</span>
                                </p>
                                
                                {canUpdate ? (
                                    <form onSubmit={handleSimpleStatusUpdate}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-2">Update Status To</label>
                                            <select
                                                value={simpleStatusUpdate}
                                                onChange={(e) => setSimpleStatusUpdate(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                required
                                            >
                                                {availableStatuses.map((status) => (
                                                    <option key={status.value} value={status.value}>
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowSimpleStatusModal(false);
                                                    setSelectedEmergency(null);
                                                    setSimpleStatusUpdate('');
                                                }}
                                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-600 mb-4">
                                            This emergency is already resolved and cannot be updated further.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowSimpleStatusModal(false);
                                                setSelectedEmergency(null);
                                                setSimpleStatusUpdate('');
                                            }}
                                            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                <Footer />
            </div>
        </RoleGuard>
    );
};

export default EmergencyOfficerDashboard;
