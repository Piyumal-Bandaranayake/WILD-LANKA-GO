import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const EmergencyOfficerDashboard = () => {
    const { backendUser } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState({
        status: '',
        firstAidProvided: '',
        hospitalCoordination: '',
        responseNotes: '',
        estimatedArrival: '',
        teamSize: 1
    });

    const [stats, setStats] = useState({
        totalEmergencies: 0,
        pendingEmergencies: 0,
        inProgressEmergencies: 0,
        resolvedToday: 0,
        averageResponseTime: '12 min',
        hospitalCoordinations: 0,
        firstAidCases: 0,
        criticalCases: 0
    });

    const [onDuty, setOnDuty] = useState(() => {
        const saved = localStorage.getItem('emergency_officer_on_duty');
        return saved ? saved === 'true' : true;
    });

    useEffect(() => {
        localStorage.setItem('emergency_officer_on_duty', String(onDuty));
    }, [onDuty]);

    useEffect(() => {
        if (backendUser?.role === 'emergencyOfficer') {
            fetchEmergencies();
        }
    }, [backendUser]);

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

            setStats({
                totalEmergencies: humanEmergencies.length,
                pendingEmergencies: humanEmergencies.filter(e => e.status === 'pending').length,
                inProgressEmergencies: humanEmergencies.filter(e => e.status === 'in-progress').length,
                resolvedToday,
                averageResponseTime: '12 min',
                hospitalCoordinations: humanEmergencies.filter(e =>
                    e.responseNotes && e.responseNotes.toLowerCase().includes('hospital')
                ).length,
                firstAidCases: humanEmergencies.filter(e =>
                    e.firstAidProvided && e.firstAidProvided.trim() !== ''
                ).length,
                criticalCases: humanEmergencies.filter(e => e.priority === 'critical').length
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
                teamSize: 1
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
            teamSize: emergency.teamSize || 1
        });
        setShowUpdateModal(true);
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
    if (backendUser?.role !== 'emergencyOfficer') {
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
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 pt-32 pb-16">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Emergency Officer Dashboard</h1>
                                <p className="text-gray-600 mt-2">Coordinate human emergency responses and first-aid operations</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {onDuty ? 'On Duty' : 'Off Duty'}
                                    </span>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={onDuty}
                                            onChange={(e) => setOnDuty(e.target.checked)}
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                                {error}
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Pending Emergencies</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.pendingEmergencies}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.inProgressEmergencies}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.resolvedToday}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.averageResponseTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">First Aid Cases</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.firstAidCases}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-pink-100 rounded-lg">
                                        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Hospital Coordinations</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.hospitalCoordinations}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Critical Cases</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.criticalCases}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 mb-6">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeTab === 'active'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Active Emergencies ({activeEmergencies.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeTab === 'pending'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Pending ({pendingEmergencies.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('resolved')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeTab === 'resolved'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Resolved ({resolvedEmergencies.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeTab === 'reports'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Reports
                            </button>
                        </div>

                        {/* Emergency Lists */}
                        {(activeTab === 'active' || activeTab === 'pending' || activeTab === 'resolved') && (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">
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
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Response Reports</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">Generate Response Time Report</h3>
                                                <p className="text-sm text-gray-500">Detailed analysis of emergency response times</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">Generate First Aid Report</h3>
                                                <p className="text-sm text-gray-500">Summary of first aid interventions provided</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
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

                                    <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">Critical Case Analysis</h3>
                                                <p className="text-sm text-gray-500">Detailed review of critical emergency cases</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
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
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Update Emergency Status</h2>
                            <form onSubmit={handleUpdateStatus}>
                                <div className="space-y-4">
                                    <div>
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
                                        <label className="block text-sm font-medium mb-1">First Aid Provided</label>
                                        <textarea
                                            value={statusUpdate.firstAidProvided}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, firstAidProvided: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Describe first aid measures taken..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hospital Coordination</label>
                                        <textarea
                                            value={statusUpdate.hospitalCoordination}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, hospitalCoordination: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={2}
                                            placeholder="Hospital coordination details..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Response Notes</label>
                                        <textarea
                                            value={statusUpdate.responseNotes}
                                            onChange={(e) => setStatusUpdate({...statusUpdate, responseNotes: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            rows={3}
                                            placeholder="Additional response notes..."
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
                                        Update Status
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

export default EmergencyOfficerDashboard;