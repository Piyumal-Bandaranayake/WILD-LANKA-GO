import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

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
    const { backendUser } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
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
        if (backendUser?.role === 'EmergencyOfficer') {
            fetchEmergencies();
            initializeProfile();
        }
    }, [backendUser]);

    const initializeProfile = () => {
        setProfileData({
            name: backendUser?.name || '',
            email: backendUser?.email || '',
            phone: backendUser?.phone || '',
            badgeNumber: backendUser?.badgeNumber || '',
            specialization: backendUser?.specialization || 'Emergency Response',
            experience: backendUser?.experience || '',
            certifications: backendUser?.certifications || ['First Aid', 'CPR']
        });
    };

    const fetchEmergencies = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getEmergencies();
            const emergenciesData = response.data || [];

            // Filter for human emergencies only
            const humanEmergencies = emergenciesData.filter(e => e.type === 'human');
            setEmergencies(humanEmergencies);

            // Calculate stats
            const today = new Date().toDateString();
            const resolvedToday = humanEmergencies.filter(e =>
                e.status === 'resolved' &&
                new Date(e.createdAt || e.date).toDateString() === today
            ).length;

            const emergenciesToday = humanEmergencies.filter(e =>
                new Date(e.createdAt || e.date).toDateString() === today
            ).length;

            setStats({
                totalEmergencies: humanEmergencies.length,
                pendingEmergencies: humanEmergencies.filter(e => e.status === 'pending').length,
                inProgressEmergencies: humanEmergencies.filter(e => e.status === 'in-progress').length,
                resolvedToday,
                totalEmergenciesToday: emergenciesToday,
                averageResponseTime: '12 min',
                hospitalCoordinations: humanEmergencies.filter(e =>
                    e.hospitalCoordination && e.hospitalCoordination.trim() !== ''
                ).length,
                firstAidCases: humanEmergencies.filter(e =>
                    e.firstAidProvided && e.firstAidProvided.trim() !== ''
                ).length,
                criticalCases: humanEmergencies.filter(e => e.priority === 'critical').length,
                reportsGenerated: 0, // This would come from a reports API
                driverAssignments: humanEmergencies.filter(e => 
                    e.assignedDriver && e.assignedDriver.trim() !== ''
                ).length
            });
        } catch (error) {
            console.error('Failed to fetch emergencies:', error);
            setError('Failed to load emergency data');
        } finally {
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

    const handleDownloadReport = async (reportType) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            let reportData;
            let filename;
            
            switch (reportType) {
                case 'response-time':
                    reportData = generateResponseTimeReport();
                    filename = `emergency-response-time-report-${today}.csv`;
                    break;
                case 'first-aid':
                    reportData = generateFirstAidReport();
                    filename = `first-aid-report-${today}.csv`;
                    break;
                case 'hospital-coordination':
                    reportData = generateHospitalCoordinationReport();
                    filename = `hospital-coordination-report-${today}.csv`;
                    break;
                case 'daily-summary':
                    reportData = generateDailySummaryReport();
                    filename = `daily-emergency-summary-${today}.csv`;
                    break;
                default:
                    reportData = generateAllEmergenciesReport();
                    filename = `all-emergencies-report-${today}.csv`;
            }
            
            downloadCSV(reportData, filename);
            setStats(prev => ({ ...prev, reportsGenerated: prev.reportsGenerated + 1 }));
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        }
    };

    const generateResponseTimeReport = () => {
        const headers = ['Emergency ID', 'Description', 'Location', 'Reported Time', 'Response Time', 'Status', 'Priority'];
        const rows = emergencies.map(emergency => [
            emergency._id || 'N/A',
            emergency.description || 'N/A',
            emergency.location || 'N/A',
            new Date(emergency.createdAt || emergency.date).toLocaleString(),
            emergency.responseTime || 'Pending',
            emergency.status || 'N/A',
            emergency.priority || 'N/A'
        ]);
        return [headers, ...rows];
    };

    const generateFirstAidReport = () => {
        const firstAidCases = emergencies.filter(e => e.firstAidProvided && e.firstAidProvided.trim() !== '');
        const headers = ['Emergency ID', 'Description', 'Location', 'First Aid Provided', 'Patient Condition', 'Date'];
        const rows = firstAidCases.map(emergency => [
            emergency._id || 'N/A',
            emergency.description || 'N/A',
            emergency.location || 'N/A',
            emergency.firstAidProvided || 'N/A',
            emergency.patientCondition || 'N/A',
            new Date(emergency.createdAt || emergency.date).toLocaleString()
        ]);
        return [headers, ...rows];
    };

    const generateHospitalCoordinationReport = () => {
        const hospitalCases = emergencies.filter(e => e.hospitalCoordination && e.hospitalCoordination.trim() !== '');
        const headers = ['Emergency ID', 'Description', 'Hospital Name', 'Coordination Details', 'Ambulance Required', 'Date'];
        const rows = hospitalCases.map(emergency => [
            emergency._id || 'N/A',
            emergency.description || 'N/A',
            emergency.hospitalName || 'N/A',
            emergency.hospitalCoordination || 'N/A',
            emergency.ambulanceRequired ? 'Yes' : 'No',
            new Date(emergency.createdAt || emergency.date).toLocaleString()
        ]);
        return [headers, ...rows];
    };

    const generateDailySummaryReport = () => {
        const today = new Date().toDateString();
        const todayEmergencies = emergencies.filter(e => 
            new Date(e.createdAt || e.date).toDateString() === today
        );
        
        const headers = ['Metric', 'Count', 'Details'];
        const rows = [
            ['Total Emergencies Today', stats.totalEmergenciesToday, ''],
            ['Pending Emergencies', stats.pendingEmergencies, ''],
            ['In Progress Emergencies', stats.inProgressEmergencies, ''],
            ['Resolved Today', stats.resolvedToday, ''],
            ['First Aid Cases', stats.firstAidCases, ''],
            ['Hospital Coordinations', stats.hospitalCoordinations, ''],
            ['Critical Cases', stats.criticalCases, ''],
            ['Driver Assignments', stats.driverAssignments, ''],
            ['Reports Generated', stats.reportsGenerated + 1, 'Including this report']
        ];
        return [headers, ...rows];
    };

    const generateAllEmergenciesReport = () => {
        const headers = ['Emergency ID', 'Description', 'Location', 'Status', 'Priority', 'Reporter', 'Phone', 'Date', 'First Aid', 'Hospital Coordination'];
        const rows = emergencies.map(emergency => [
            emergency._id || 'N/A',
            emergency.description || 'N/A',
            emergency.location || 'N/A',
            emergency.status || 'N/A',
            emergency.priority || 'N/A',
            emergency.reporterName || 'N/A',
            emergency.reporterPhone || 'N/A',
            new Date(emergency.createdAt || emergency.date).toLocaleString(),
            emergency.firstAidProvided || 'N/A',
            emergency.hospitalCoordination || 'N/A'
        ]);
        return [headers, ...rows];
    };

    const downloadCSV = (data, filename) => {
        const csvContent = data.map(row => 
            row.map(field => 
                typeof field === 'string' && field.includes(',') 
                    ? `"${field}"` 
                    : field
            ).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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

    // Only Emergency Officers can access this page
    if (backendUser?.role !== 'EmergencyOfficer') {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                            <p className="text-gray-600 mt-2">Only emergency officers can access this page.</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ProtectedRoute>
        );
    }

    if (loading) {
        return (
            <ProtectedRoute>
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
            </ProtectedRoute>
        );
    }

    const activeEmergencies = emergencies.filter(e => e.status === 'in-progress');
    const pendingEmergencies = emergencies.filter(e => e.status === 'pending');
    const resolvedEmergencies = emergencies.filter(e => e.status === 'resolved');

    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
                <Navbar />
                <div className="flex-1 pt-32 pb-16">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-12 gap-6">
                            {/* LEFT SIDEBAR */}
                            <aside className="col-span-12 md:col-span-3">
                                <div className="bg-white rounded-2xl shadow-sm">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                                                 onClick={() => setShowProfileModal(true)}>
                                                {(backendUser?.name || 'Emergency Officer').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'EO'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold">{backendUser?.name || 'Emergency Officer'}</div>
                                                <div className="text-xs text-blue-100">Emergency Officer</div>
                                                <button
                                                    onClick={() => setShowProfileModal(true)}
                                                    className="text-xs text-blue-200 hover:text-white mt-1 underline"
                                                >
                                                    View/Edit Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-800">{error}</p>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <nav className="p-4">
                                        <div className="space-y-1">
                                            {[
                                                { id: 'active', name: 'Active Emergencies', icon: 'M13 10V3L4 14h7v7l9-11h-7z', count: activeEmergencies.length },
                                                { id: 'pending', name: 'Pending', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z', count: pendingEmergencies.length },
                                                { id: 'resolved', name: 'Resolved', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', count: resolvedEmergencies.length },
                                                { id: 'reports', name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveTab(item.id)}
                                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-xl transition-colors ${
                                                        activeTab === item.id
                                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                                        </svg>
                                                        <span className="text-sm">{item.name}</span>
                                                    </div>
                                                    {item.count !== undefined && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            activeTab === item.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                            {item.count}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </nav>
                                </div>
                            </aside>

                            {/* MAIN CONTENT */}
                            <main className="col-span-12 md:col-span-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <StatCard
                                        title="Today's Emergencies"
                                        value={stats.totalEmergenciesToday}
                                        color="blue"
                                        iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                    <StatCard
                                        title="Pending Emergencies"
                                        value={stats.pendingEmergencies}
                                        color="red"
                                        iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                    <StatCard
                                        title="In Progress"
                                        value={stats.inProgressEmergencies}
                                        color="orange"
                                        iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                    <StatCard
                                        title="Resolved Today"
                                        value={stats.resolvedToday}
                                        color="green"
                                        iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </div>

                {/* Content Container */}
                <div className="space-y-6">
                    {/* Emergency Lists */}
                    {(activeTab === 'active' || activeTab === 'pending' || activeTab === 'resolved') && (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {activeTab === 'active' && 'Active Human Emergencies'}
                                    {activeTab === 'pending' && 'Pending Human Emergencies'}
                                    {activeTab === 'resolved' && 'Resolved Human Emergencies'}
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(activeTab === 'active' ? activeEmergencies :
                                          activeTab === 'pending' ? pendingEmergencies : resolvedEmergencies).map((emergency) => (
                                            <tr key={emergency._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{emergency.description}</div>
                                                    {emergency.reporterName && (
                                                        <div className="text-sm text-gray-500">Reporter: {emergency.reporterName}</div>
                                                    )}
                                                    {emergency.reporterPhone && (
                                                        <div className="text-sm text-gray-500">Phone: {emergency.reporterPhone}</div>
                                                    )}
                                                    {emergency.assignedDriver && (
                                                        <div className="text-sm text-blue-600">Driver: {emergency.assignedDriver}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {emergency.location}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(emergency.priority)}`}>
                                                        {emergency.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(emergency.status)}`}>
                                                        {emergency.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {getTimeAgo(emergency.createdAt || emergency.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => openDetailModal(emergency)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View Details
                                                    </button>
                                                    {emergency.status !== 'resolved' && (
                                                        <button
                                                            onClick={() => openUpdateModal(emergency)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Update Status
                                                        </button>
                                                    )}
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-600 hover:text-purple-900"
                                                    >
                                                        Track Location
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(activeTab === 'active' ? activeEmergencies :
                                  activeTab === 'pending' ? pendingEmergencies : resolvedEmergencies).length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No {activeTab} emergencies found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Response Reports</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-600">{stats.totalEmergencies}</div>
                                        <div className="text-sm text-gray-600">Total Human Emergencies</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">{stats.resolvedToday}</div>
                                        <div className="text-sm text-gray-600">Resolved Today</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">{stats.averageResponseTime}</div>
                                        <div className="text-sm text-gray-600">Average Response Time</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                    onClick={() => handleDownloadReport('response-time')}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Response Time Report</h3>
                                            <p className="text-sm text-gray-500">Detailed analysis of emergency response times</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleDownloadReport('first-aid')}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">First Aid Report</h3>
                                            <p className="text-sm text-gray-500">Summary of first aid interventions provided</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleDownloadReport('hospital-coordination')}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-pink-100 rounded-lg">
                                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Hospital Coordination Report</h3>
                                            <p className="text-sm text-gray-500">Cases requiring hospital coordination</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleDownloadReport('daily-summary')}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Daily Operations Summary</h3>
                                            <p className="text-sm text-gray-500">Complete daily emergency operations overview</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleDownloadReport('all-emergencies')}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left md:col-span-2">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Complete Emergency Database</h3>
                                            <p className="text-sm text-gray-500">Download all human-related emergency records</p>
                                        </div>
                                    </div>
                                </button>
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
                                {(backendUser?.name || 'Emergency Officer').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'EO'}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">{backendUser?.name || 'Emergency Officer'}</div>
                                <div className="text-xs text-gray-500">Emergency Officer</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Widget */}
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Daily Operations Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Today's Emergencies</span>
                                <span className="font-medium text-blue-600">{stats.totalEmergenciesToday}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">First Aid Cases</span>
                                <span className="font-medium text-orange-600">{stats.firstAidCases}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Hospital Coordinations</span>
                                <span className="font-medium text-pink-600">{stats.hospitalCoordinations}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Critical Cases</span>
                                <span className="font-medium text-red-600">{stats.criticalCases}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Driver Assignments</span>
                                <span className="font-medium text-purple-600">{stats.driverAssignments}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Reports Generated</span>
                                <span className="font-medium text-green-600">{stats.reportsGenerated}</span>
                            </div>
                        </div>
                    </div>

                    {/* Urgent Alerts */}
                    {(pendingEmergencies.length > 0 || activeEmergencies.length > 0) && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-5">
                            <h4 className="font-semibold text-red-800 mb-3">Urgent Alerts</h4>
                            <div className="text-sm text-red-700 space-y-2">
                                {pendingEmergencies.length > 0 && (
                                    <div>🚨 {pendingEmergencies.length} pending emergencies</div>
                                )}
                                {activeEmergencies.length > 0 && (
                                    <div>⚡ {activeEmergencies.length} active responses</div>
                                )}
                            </div>
                            <button
                                onClick={() => setActiveTab(pendingEmergencies.length > 0 ? 'pending' : 'active')}
                                className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                            >
                                View Emergencies
                            </button>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
                        <div className="space-y-3 text-sm">
                            {resolvedEmergencies.slice(0, 3).map((emergency) => (
                                <div key={emergency._id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600 truncate">Resolved: {emergency.description}</span>
                                </div>
                            ))}
                            {activeEmergencies.slice(0, 2).map((emergency) => (
                                <div key={emergency._id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600 truncate">Active: {emergency.description}</span>
                                </div>
                            ))}
                            {pendingEmergencies.slice(0, 2).map((emergency) => (
                                <div key={emergency._id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-gray-600 truncate">Pending: {emergency.description}</span>
                                </div>
                            ))}
                            {(resolvedEmergencies.length === 0 && activeEmergencies.length === 0 && pendingEmergencies.length === 0) && (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
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
                                </div>
                                <div>
                                    <span className="font-medium">Description:</span> {selectedEmergency.description}
                                </div>
                                <div>
                                    <span className="font-medium">Location:</span> {selectedEmergency.location}
                                </div>
                                <div>
                                    <span className="font-medium">Priority:</span>
                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedEmergency.priority)}`}>
                                        {selectedEmergency.priority}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Status:</span>
                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmergency.status)}`}>
                                        {selectedEmergency.status}
                                    </span>
                                </div>
                                {selectedEmergency.reporterName && (
                                    <div>
                                        <span className="font-medium">Reporter:</span> {selectedEmergency.reporterName}
                                    </div>
                                )}
                                {selectedEmergency.reporterPhone && (
                                    <div>
                                        <span className="font-medium">Contact:</span> {selectedEmergency.reporterPhone}
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
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
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

                <Footer />
            </div>
        </ProtectedRoute>
    );
};

export default EmergencyOfficerDashboard;