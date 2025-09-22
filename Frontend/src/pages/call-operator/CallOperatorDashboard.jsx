import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const CallOperatorDashboard = () => {
    const { backendUser, user } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [emergencyForms, setEmergencyForms] = useState([]);
    const [availablePersonnel, setAvailablePersonnel] = useState({
        emergencyOfficers: [],
        vets: [],
        wildlifeParkOfficers: [],
        drivers: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [newEmergency, setNewEmergency] = useState({
        type: 'human',
        description: '',
        location: '',
        priority: 'medium',
        reporterName: '',
        reporterPhone: '',
        assignedOfficer: '',
        incidentDetails: '',
        witnessInfo: ''
    });
    const [replyText, setReplyText] = useState('');

    const [stats, setStats] = useState({
        totalCalls: 0,
        activeEmergencies: 0,
        pendingComplaints: 0,
        emergencyForms: 0,
        averageResponseTime: '8 min',
        callsToday: 0,
        emergenciesResolved: 0,
        humanEmergencies: 0,
        animalEmergencies: 0,
        unethicalEmergencies: 0,
        physicalEmergencies: 0,
        reportsGenerated: 0
    });

    useEffect(() => {
        if (backendUser?.role === 'callOperator') {
            fetchAllData();
            fetchAvailablePersonnel();
        }
    }, [backendUser]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [emergenciesRes, complaintsRes, formsRes] = await Promise.all([
                protectedApi.getEmergencies(),
                protectedApi.getComplaints(),
                protectedApi.getEmergencyForms()
            ]);

            const emergenciesData = emergenciesRes.data || [];
            const complaintsData = complaintsRes.data || [];
            const formsData = formsRes.data || [];

            setEmergencies(emergenciesData);
            setComplaints(complaintsData);
            setEmergencyForms(formsData);

            // Calculate enhanced stats
            const today = new Date().toDateString();
            const callsToday = emergenciesData.filter(e =>
                new Date(e.createdAt || e.date).toDateString() === today
            ).length;

            setStats({
                totalCalls: emergenciesData.length + formsData.length,
                activeEmergencies: emergenciesData.filter(e => e.status === 'in-progress').length,
                pendingComplaints: complaintsData.filter(c => !c.reply).length,
                emergencyForms: formsData.length,
                averageResponseTime: '8 min',
                callsToday,
                emergenciesResolved: emergenciesData.filter(e => e.status === 'resolved').length,
                humanEmergencies: emergenciesData.filter(e => e.type === 'human').length,
                animalEmergencies: emergenciesData.filter(e => e.type === 'animal').length,
                unethicalEmergencies: emergenciesData.filter(e => e.type === 'unethical').length,
                physicalEmergencies: formsData.length,
                reportsGenerated: 0 // Will be updated when reports feature is implemented
            });
        } catch (error) {
            console.error('Failed to fetch call operator data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailablePersonnel = async () => {
        try {
            const [usersRes, tourGuidesRes, driversRes] = await Promise.all([
                protectedApi.getAllUsers(),
                protectedApi.getTourGuides(),
                protectedApi.getDrivers()
            ]);

            const users = usersRes.data || [];
            const tourGuides = tourGuidesRes.data || [];
            const drivers = driversRes.data || [];

            setAvailablePersonnel({
                emergencyOfficers: users.filter(u => u.role === 'emergencyOfficer'),
                vets: users.filter(u => u.role === 'veterinarian'),
                wildlifeParkOfficers: users.filter(u => u.role === 'wildlifeParkOfficer'),
                drivers: drivers
            });
        } catch (error) {
            console.error('Failed to fetch available personnel:', error);
        }
    };

    const handleCreateEmergency = async (e) => {
        e.preventDefault();
        try {
            // Determine appropriate forwarding based on type
            let forwardToRole = '';
            switch (newEmergency.type) {
                case 'human':
                    forwardToRole = 'emergencyOfficer';
                    break;
                case 'animal':
                    forwardToRole = 'veterinarian';
                    break;
                case 'unethical':
                    forwardToRole = 'wildlifeParkOfficer';
                    break;
                case 'physical':
                    forwardToRole = 'wildlifeParkOfficer'; // For major damages
                    break;
                default:
                    forwardToRole = 'emergencyOfficer';
            }

            await protectedApi.createEmergency({
                ...newEmergency,
                createdBy: backendUser?.name || 'Call Operator',
                createdById: backendUser?._id,
                status: 'pending',
                forwardedTo: forwardToRole,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                isDirectCall: true // Mark as direct call for tracking
            });
            
            setShowCreateModal(false);
            setNewEmergency({
                type: 'human',
                description: '',
                location: '',
                priority: 'medium',
                reporterName: '',
                reporterPhone: '',
                assignedOfficer: '',
                incidentDetails: '',
                witnessInfo: ''
            });
            fetchAllData();
            alert(`Emergency logged successfully and forwarded to ${forwardToRole.replace(/([A-Z])/g, ' $1').toLowerCase()}!`);
        } catch (error) {
            console.error('Failed to create emergency:', error);
            setError('Failed to log emergency');
        }
    };

    const updateEmergencyStatus = async (emergencyId, newStatus) => {
        try {
            await protectedApi.updateEmergencyStatus(emergencyId, newStatus);
            fetchAllData();
            alert(`Emergency status updated to ${newStatus}!`);
        } catch (error) {
            console.error('Failed to update emergency status:', error);
            setError('Failed to update emergency status');
        }
    };

    const deleteEmergency = async (emergencyId) => {
        if (!window.confirm('Are you sure you want to delete this emergency? This action cannot be undone.')) {
            return;
        }
        try {
            await protectedApi.deleteEmergency(emergencyId);
            fetchAllData();
            alert('Emergency deleted successfully!');
        } catch (error) {
            console.error('Failed to delete emergency:', error);
            setError('Failed to delete emergency');
        }
    };

    const escalateToWildlifeParkOfficer = async (emergencyId) => {
        try {
            await protectedApi.updateEmergency(emergencyId, {
                forwardedTo: 'wildlifeParkOfficer',
                escalated: true,
                escalatedAt: new Date().toISOString(),
                escalatedBy: backendUser?.name || 'Call Operator'
            });
            fetchAllData();
            alert('Emergency escalated to Wildlife Park Officer!');
        } catch (error) {
            console.error('Failed to escalate emergency:', error);
            setError('Failed to escalate emergency');
        }
    };

    const generateEmergencyReport = async () => {
        try {
            const reportData = {
                generatedBy: backendUser?.name || 'Call Operator',
                generatedAt: new Date().toISOString(),
                emergencies: emergencies,
                emergencyForms: emergencyForms,
                stats: stats
            };
            
            // Create and download report
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `emergency-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            setStats(prev => ({ ...prev, reportsGenerated: prev.reportsGenerated + 1 }));
            alert('Emergency report generated and downloaded!');
        } catch (error) {
            console.error('Failed to generate report:', error);
            setError('Failed to generate report');
        }
    };

    const generateComplaintReport = async () => {
        try {
            const reportData = {
                generatedBy: backendUser?.name || 'Call Operator',
                generatedAt: new Date().toISOString(),
                complaints: complaints,
                stats: {
                    totalComplaints: complaints.length,
                    pendingComplaints: complaints.filter(c => !c.reply).length,
                    resolvedComplaints: complaints.filter(c => c.reply).length
                }
            };
            
            // Create and download report
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaint-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            setStats(prev => ({ ...prev, reportsGenerated: prev.reportsGenerated + 1 }));
            alert('Complaint report generated and downloaded!');
        } catch (error) {
            console.error('Failed to generate complaint report:', error);
            setError('Failed to generate complaint report');
        }
    };

    const handleReplyToComplaint = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.replyToComplaint(selectedComplaint._id, {
                reply: replyText,
                repliedBy: backendUser?.name || 'Call Operator',
                repliedAt: new Date().toISOString()
            });
            setShowReplyModal(false);
            setSelectedComplaint(null);
            setReplyText('');
            fetchAllData();
            alert('Reply sent successfully!');
        } catch (error) {
            console.error('Failed to reply to complaint:', error);
            setError('Failed to send reply');
        }
    };

    const forwardEmergency = async (emergencyId, officerType) => {
        try {
            await protectedApi.updateEmergencyStatus(emergencyId, 'in-progress');
            // In a real system, you would also send a notification to the specific officer
            alert(`Emergency forwarded to ${officerType} successfully!`);
            fetchAllData();
        } catch (error) {
            console.error('Failed to forward emergency:', error);
            setError('Failed to forward emergency');
        }
    };

    const getEmergencyTypeColor = (type) => {
        const colors = {
            human: 'bg-red-100 text-red-800',
            animal: 'bg-orange-100 text-orange-800',
            unethical: 'bg-purple-100 text-purple-800',
            physical: 'bg-blue-100 text-blue-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
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

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Only Call Operators can access this page
    if (backendUser?.role !== 'callOperator') {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                            <p className="text-gray-600 mt-2">Only call operators can access this page.</p>
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
                <div className="min-h-screen bg-[#F4F6FF]">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading call operator dashboard...</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F4F6FF]">
                <Navbar />
                <div className="pt-32 pb-16">
                    <div className="container mx-auto px-4">
                        {/* Welcome Banner */}
                        <div className="mb-6">
                            <div className="bg-red-600 text-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                                <div>
                                    <h2 className="text-lg md:text-xl font-semibold">
                                        {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${backendUser?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Call Operator'}`}
                                    </h2>
                                    <p className="text-sm opacity-90 mt-1">
                                        You have {stats.activeEmergencies} active emergencies and {stats.pendingComplaints} pending complaints requiring attention.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('emergency-management')}
                                        className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm"
                                    >
                                        Review Emergencies
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

                        {/* Quick Action Button */}
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Log Emergency
                            </button>
                        </div>

                        {/* 3-COLUMN GRID LAYOUT */}
                        <div className="grid grid-cols-12 gap-6">
                            {/* LEFT SIDEBAR */}
                            <aside className="col-span-12 md:col-span-3">
                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Navigation</h3>
                                    <nav className="space-y-2">
                                        <button
                                            onClick={() => setActiveTab('dashboard')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                activeTab === 'dashboard'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            Emergency Operations
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('emergency-management')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                activeTab === 'emergency-management'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            Emergency Management
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('complaints')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                activeTab === 'complaints'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Complaints & Forms
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('reports')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                activeTab === 'reports'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Reports & Analytics
                                        </button>
                                    </nav>
                                </div>
                            </aside>

                            {/* MAIN CONTENT */}
                            <main className="col-span-12 md:col-span-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Calls Today</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.callsToday}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Active Emergencies</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.activeEmergencies}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Pending Complaints</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.pendingComplaints}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.reportsGenerated}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div className="space-y-6">
                                    {/* Emergency Operations Tab */}
                                    {activeTab === 'dashboard' && (
                                        <div className="space-y-6">
                                            {/* Emergency Categories */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Response Categories</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 border-2 border-red-200 rounded-xl hover:border-red-400 transition-colors cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-semibold text-red-800">Human Emergencies</h3>
                                                                <p className="text-sm text-red-600">Forward to Emergency Officer</p>
                                                            </div>
                                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                                                                {emergencies.filter(e => e.type === 'human').length}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 border-2 border-orange-200 rounded-xl hover:border-orange-400 transition-colors cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-semibold text-orange-800">Animal Emergencies</h3>
                                                                <p className="text-sm text-orange-600">Forward to Wildlife Officer</p>
                                                            </div>
                                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                                                                {emergencies.filter(e => e.type === 'animal').length}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-colors cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-semibold text-purple-800">Unethical Activities</h3>
                                                                <p className="text-sm text-purple-600">Forward to Wildlife Officer</p>
                                                            </div>
                                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                                                                {emergencies.filter(e => e.type === 'unethical').length}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition-colors cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-semibold text-blue-800">Physical Emergencies</h3>
                                                                <p className="text-sm text-blue-600">Forms & Direct Response</p>
                                                            </div>
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                                                {emergencyForms.length}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recent Emergencies */}
                                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-200">
                                                    <h2 className="text-lg font-semibold text-gray-800">Recent Emergency Calls</h2>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {emergencies.slice(0, 10).map((emergency) => (
                                                                <tr key={emergency._id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmergencyTypeColor(emergency.type)}`}>
                                                                            {emergency.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                                        {emergency.description}
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
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                        {emergency.status === 'pending' && (
                                                                            <>
                                                                                {emergency.type === 'human' && (
                                                                                    <button
                                                                                        onClick={() => forwardEmergency(emergency._id, 'Emergency Officer')}
                                                                                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                                                                                    >
                                                                                        Forward to Emergency Officer
                                                                                    </button>
                                                                                )}
                                                                                {(emergency.type === 'animal' || emergency.type === 'unethical') && (
                                                                                    <button
                                                                                        onClick={() => forwardEmergency(emergency._id, 'Wildlife Officer')}
                                                                                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                                                                    >
                                                                                        Forward to Wildlife Officer
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:text-blue-900"
                                                                        >
                                                                            Track Location
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Emergency Management Tab */}
                                    {activeTab === 'emergency-management' && (
                                        <div className="space-y-6">
                                            {/* Filters */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Management & Tracking</h2>
                                                <div className="flex flex-wrap gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                                                        <select
                                                            value={categoryFilter}
                                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="all">All Categories</option>
                                                            <option value="human">Human Emergencies</option>
                                                            <option value="animal">Animal Emergencies</option>
                                                            <option value="unethical">Unethical Activities</option>
                                                            <option value="physical">Physical Emergencies</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                                                        <select
                                                            value={statusFilter}
                                                            onChange={(e) => setStatusFilter(e.target.value)}
                                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="all">All Statuses</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emergency Management Table */}
                                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                                    <h2 className="text-lg font-semibold text-gray-800">All Emergency Cases</h2>
                                                    <div className="text-sm text-gray-600">
                                                        Showing {emergencies.filter(e => 
                                                            (categoryFilter === 'all' || e.type === categoryFilter) &&
                                                            (statusFilter === 'all' || e.status === statusFilter)
                                                        ).length} of {emergencies.length} emergencies
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency ID</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {emergencies
                                                                .filter(e => 
                                                                    (categoryFilter === 'all' || e.type === categoryFilter) &&
                                                                    (statusFilter === 'all' || e.status === statusFilter)
                                                                )
                                                                .map((emergency) => (
                                                                <tr key={emergency._id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                        {emergency._id.slice(-6).toUpperCase()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmergencyTypeColor(emergency.type)}`}>
                                                                            {emergency.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                                        {emergency.description}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        <div>
                                                                            <div className="font-medium">{emergency.reporterName || 'Anonymous'}</div>
                                                                            <div className="text-xs text-gray-400">{emergency.reporterPhone}</div>
                                                                        </div>
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
                                                                        <select
                                                                            value={emergency.status}
                                                                            onChange={(e) => updateEmergencyStatus(emergency._id, e.target.value)}
                                                                            className={`text-xs font-semibold rounded-full border-0 px-2 py-1 ${getStatusColor(emergency.status)}`}
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="in-progress">In Progress</option>
                                                                            <option value="resolved">Resolved</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {emergency.assignedOfficer || emergency.forwardedTo || 'Not Assigned'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                        <div className="flex flex-col gap-1">
                                                                            <a
                                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-600 hover:text-blue-900 text-xs"
                                                                            >
                                                                                Track Location
                                                                            </a>
                                                                            {emergency.reporterPhone && (
                                                                                <a
                                                                                    href={`tel:${emergency.reporterPhone}`}
                                                                                    className="text-green-600 hover:text-green-900 text-xs"
                                                                                >
                                                                                    Call Reporter
                                                                                </a>
                                                                            )}
                                                                            {emergency.type === 'physical' && (
                                                                                <button
                                                                                    onClick={() => escalateToWildlifeParkOfficer(emergency._id)}
                                                                                    className="text-orange-600 hover:text-orange-900 text-xs"
                                                                                >
                                                                                    Escalate
                                                                                </button>
                                                                            )}
                                                                            {emergency.status === 'resolved' && (
                                                                                <button
                                                                                    onClick={() => deleteEmergency(emergency._id)}
                                                                                    className="text-red-600 hover:text-red-900 text-xs"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Available Personnel Summary */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Personnel for Assignment</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="p-4 border border-gray-200 rounded-xl">
                                                        <h3 className="font-semibold text-red-800 mb-2">Emergency Officers</h3>
                                                        <p className="text-2xl font-bold text-red-600">{availablePersonnel.emergencyOfficers.length}</p>
                                                        <p className="text-sm text-gray-600">Available</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-200 rounded-xl">
                                                        <h3 className="font-semibold text-orange-800 mb-2">Veterinarians</h3>
                                                        <p className="text-2xl font-bold text-orange-600">{availablePersonnel.vets.length}</p>
                                                        <p className="text-sm text-gray-600">Available</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-200 rounded-xl">
                                                        <h3 className="font-semibold text-green-800 mb-2">Wildlife Park Officers</h3>
                                                        <p className="text-2xl font-bold text-green-600">{availablePersonnel.wildlifeParkOfficers.length}</p>
                                                        <p className="text-sm text-gray-600">Available</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-200 rounded-xl">
                                                        <h3 className="font-semibold text-blue-800 mb-2">Drivers</h3>
                                                        <p className="text-2xl font-bold text-blue-600">{availablePersonnel.drivers.length}</p>
                                                        <p className="text-sm text-gray-600">Available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Complaints & Forms Tab */}
                                    {activeTab === 'complaints' && (
                                        <div className="space-y-6">
                                            {/* Complaints Section */}
                                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-200">
                                                    <h2 className="text-lg font-semibold text-gray-800">Public Complaints</h2>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complainant</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {complaints.map((complaint) => (
                                                                <tr key={complaint._id}>
                                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                                                                        {complaint.subject}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {complaint.name}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {new Date(complaint.createdAt || complaint.date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                            complaint.reply ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                        }`}>
                                                                            {complaint.reply ? 'Replied' : 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                        {!complaint.reply && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedComplaint(complaint);
                                                                                    setShowReplyModal(true);
                                                                                }}
                                                                                className="text-green-600 hover:text-green-900"
                                                                            >
                                                                                Reply
                                                                            </button>
                                                                        )}
                                                                        <button className="text-blue-600 hover:text-blue-900">
                                                                            View Details
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Emergency Forms Section */}
                                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-200">
                                                    <h2 className="text-lg font-semibold text-gray-800">Physical Emergency Forms</h2>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                                                    {emergencyForms.map((form) => (
                                                        <div key={form._id} className="border border-gray-200 rounded-xl p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-semibold text-gray-800 capitalize">{form.emergency_type} Emergency</h3>
                                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Form</span>
                                                            </div>
                                                            <div className="space-y-1 text-sm text-gray-600">
                                                                <p><span className="font-medium">Reporter:</span> {form.name}</p>
                                                                <p><span className="font-medium">Phone:</span> {form.phone}</p>
                                                                <p><span className="font-medium">Location:</span> {form.location}</p>
                                                                <p><span className="font-medium">Property:</span> {form.property_name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(form.date).toLocaleDateString()} at {form.time}
                                                                </p>
                                                            </div>
                                                            <div className="mt-3 flex gap-2">
                                                                <a
                                                                    href={`tel:${form.phone}`}
                                                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                                                >
                                                                    Call Reporter
                                                                </a>
                                                                <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50">
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {emergencyForms.length === 0 && (
                                                        <div className="col-span-full text-center py-8 text-gray-500">
                                                            No emergency forms received
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reports Tab */}
                                    {activeTab === 'reports' && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Operations Summary</h2>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-blue-600">{stats.totalCalls}</div>
                                                        <div className="text-sm text-gray-600">Total Emergencies Received Today</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-green-600">{stats.emergenciesResolved}</div>
                                                        <div className="text-sm text-gray-600">Emergencies Resolved</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-orange-600">{stats.pendingComplaints}</div>
                                                        <div className="text-sm text-gray-600">Complaints Under Review</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-purple-600">{stats.reportsGenerated}</div>
                                                        <div className="text-sm text-gray-600">Reports Generated</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emergency Categories Breakdown */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergencies Forwarded by Category</h2>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-4 border-2 border-red-200 rounded-xl text-center">
                                                        <div className="text-2xl font-bold text-red-600">{stats.humanEmergencies}</div>
                                                        <div className="text-sm text-gray-600">Human Emergencies</div>
                                                        <div className="text-xs text-gray-500">→ Emergency Officers</div>
                                                    </div>
                                                    <div className="p-4 border-2 border-orange-200 rounded-xl text-center">
                                                        <div className="text-2xl font-bold text-orange-600">{stats.animalEmergencies}</div>
                                                        <div className="text-sm text-gray-600">Animal Emergencies</div>
                                                        <div className="text-xs text-gray-500">→ Veterinarians</div>
                                                    </div>
                                                    <div className="p-4 border-2 border-purple-200 rounded-xl text-center">
                                                        <div className="text-2xl font-bold text-purple-600">{stats.unethicalEmergencies}</div>
                                                        <div className="text-sm text-gray-600">Unethical Activities</div>
                                                        <div className="text-xs text-gray-500">→ Wild Park Officers</div>
                                                    </div>
                                                    <div className="p-4 border-2 border-blue-200 rounded-xl text-center">
                                                        <div className="text-2xl font-bold text-blue-600">{stats.physicalEmergencies}</div>
                                                        <div className="text-sm text-gray-600">Physical Emergencies</div>
                                                        <div className="text-xs text-gray-500">→ Forms & Direct Response</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pending vs Resolved */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Status Overview</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-yellow-600">{stats.activeEmergencies}</div>
                                                        <div className="text-sm text-gray-600">Pending & In Progress</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-green-600">{stats.emergenciesResolved}</div>
                                                        <div className="text-sm text-gray-600">Resolved Today</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-gray-600">{stats.averageResponseTime}</div>
                                                        <div className="text-sm text-gray-600">Average Response Time</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Report Generation */}
                                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate & Download Reports</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <button 
                                                        onClick={generateEmergencyReport}
                                                        className="bg-white border-2 border-blue-200 p-6 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left"
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="ml-4">
                                                                <h3 className="text-lg font-medium text-gray-900">Emergency Report</h3>
                                                                <p className="text-sm text-gray-500">Detailed emergency response analytics from calls and forms</p>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button 
                                                        onClick={generateComplaintReport}
                                                        className="bg-white border-2 border-green-200 p-6 rounded-2xl hover:border-green-400 hover:shadow-md transition-all text-left"
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="p-2 bg-green-100 rounded-lg">
                                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                            </div>
                                                            <div className="ml-4">
                                                                <h3 className="text-lg font-medium text-gray-900">Complaint Report</h3>
                                                                <p className="text-sm text-gray-500">Public complaint handling summary and responses</p>
                                                            </div>
                                                        </div>
                                                    </button>
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
                                                {(backendUser?.name || 'Call Operator').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'CO'}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">{backendUser?.name || 'Call Operator'}</div>
                                                <div className="text-xs text-gray-500">Call Operator</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Emergency Stats */}
                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <h4 className="font-semibold text-gray-800 mb-3">Emergency Categories</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Human</span>
                                                <span className="font-medium text-red-600">{emergencies.filter(e => e.type === 'human').length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Animal</span>
                                                <span className="font-medium text-orange-600">{emergencies.filter(e => e.type === 'animal').length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Unethical</span>
                                                <span className="font-medium text-purple-600">{emergencies.filter(e => e.type === 'unethical').length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Forms</span>
                                                <span className="font-medium text-blue-600">{emergencyForms.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Urgent Alerts */}
                                    {(stats.activeEmergencies > 0 || stats.pendingComplaints > 5) && (
                                        <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-5">
                                            <h4 className="font-semibold text-red-800 mb-3">Urgent Alerts</h4>
                                            <div className="text-sm text-red-700 space-y-2">
                                                {stats.activeEmergencies > 0 && (
                                                    <div>🚨 {stats.activeEmergencies} active emergencies</div>
                                                )}
                                                {stats.pendingComplaints > 5 && (
                                                    <div>📞 {stats.pendingComplaints} pending complaints</div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setActiveTab(stats.activeEmergencies > 0 ? 'dashboard' : 'complaints')}
                                                className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                                            >
                                                Take Action
                                            </button>
                                        </div>
                                    )}

                                    {/* Daily Performance */}
                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <h4 className="font-semibold text-gray-800 mb-3">Today's Performance</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Calls Handled</span>
                                                <span className="font-medium text-blue-600">{stats.callsToday}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Emergencies Resolved</span>
                                                <span className="font-medium text-green-600">{stats.emergenciesResolved}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Response Time</span>
                                                <span className="font-medium text-purple-600">{stats.averageResponseTime}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-white rounded-2xl shadow-sm p-5">
                                        <h4 className="font-semibold text-gray-800 mb-3">Quick Actions</h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                                            >
                                                Log Emergency
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('complaints')}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                                            >
                                                View Complaints
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>

                {/* Create Emergency Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Log New Emergency</h2>
                            <form onSubmit={handleCreateEmergency}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Emergency Type</label>
                                            <select
                                                value={newEmergency.type}
                                                onChange={(e) => setNewEmergency({...newEmergency, type: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                required
                                            >
                                                <option value="human">Human Emergency → Emergency Officer</option>
                                                <option value="animal">Animal Emergency → Veterinarian</option>
                                                <option value="unethical">Unethical Activity → Wild Park Officer</option>
                                                <option value="physical">Physical Emergency → Wild Park Officer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Priority Level</label>
                                            <select
                                                value={newEmergency.priority}
                                                onChange={(e) => setNewEmergency({...newEmergency, priority: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            >
                                                <option value="low">Low Priority</option>
                                                <option value="medium">Medium Priority</option>
                                                <option value="high">High Priority</option>
                                                <option value="critical">Critical Emergency</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Emergency Description</label>
                                        <textarea
                                            value={newEmergency.description}
                                            onChange={(e) => setNewEmergency({...newEmergency, description: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={3}
                                            required
                                            placeholder="Describe the emergency situation in detail..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Incident Details</label>
                                        <textarea
                                            value={newEmergency.incidentDetails}
                                            onChange={(e) => setNewEmergency({...newEmergency, incidentDetails: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Additional incident details, conditions, severity..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Location (Precise GPS coordinates or landmark)</label>
                                        <input
                                            type="text"
                                            value={newEmergency.location}
                                            onChange={(e) => setNewEmergency({...newEmergency, location: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                            placeholder="e.g., Yala National Park, Block 1, GPS: 6.3725°N, 81.5185°E"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Reporter Name</label>
                                            <input
                                                type="text"
                                                value={newEmergency.reporterName}
                                                onChange={(e) => setNewEmergency({...newEmergency, reporterName: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                placeholder="Caller's full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Reporter Phone</label>
                                            <input
                                                type="tel"
                                                value={newEmergency.reporterPhone}
                                                onChange={(e) => setNewEmergency({...newEmergency, reporterPhone: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                placeholder="+94 XX XXX XXXX"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Witness Information (if any)</label>
                                        <textarea
                                            value={newEmergency.witnessInfo}
                                            onChange={(e) => setNewEmergency({...newEmergency, witnessInfo: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Names, contact details of witnesses, guide information..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Assign to Officer (optional)</label>
                                        <select
                                            value={newEmergency.assignedOfficer}
                                            onChange={(e) => setNewEmergency({...newEmergency, assignedOfficer: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Auto-assign based on emergency type</option>
                                            {newEmergency.type === 'human' && availablePersonnel.emergencyOfficers.map(officer => (
                                                <option key={officer._id} value={officer._id}>{officer.name}</option>
                                            ))}
                                            {newEmergency.type === 'animal' && availablePersonnel.vets.map(vet => (
                                                <option key={vet._id} value={vet._id}>{vet.name}</option>
                                            ))}
                                            {(newEmergency.type === 'unethical' || newEmergency.type === 'physical') && availablePersonnel.wildlifeParkOfficers.map(officer => (
                                                <option key={officer._id} value={officer._id}>{officer.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Log Emergency
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reply to Complaint Modal */}
                {showReplyModal && selectedComplaint && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Reply to Complaint</h2>
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600"><strong>From:</strong> {selectedComplaint.name}</p>
                                <p className="text-sm text-gray-600"><strong>Subject:</strong> {selectedComplaint.subject}</p>
                                <p className="text-sm text-gray-600 mt-2">{selectedComplaint.message}</p>
                            </div>
                            <form onSubmit={handleReplyToComplaint}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Your Reply</label>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={4}
                                            required
                                            placeholder="Type your response to the complainant..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReplyModal(false);
                                            setSelectedComplaint(null);
                                            setReplyText('');
                                        }}
                                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Send Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </ProtectedRoute>
    );
};

export default CallOperatorDashboard;