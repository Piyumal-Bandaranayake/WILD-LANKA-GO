import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardLayout, TabbedContent } from '../../components/common/DashboardLayout';
import { Modal, Field, Input, Button, StatusBadge, DataTable, Card, LoadingSpinner, EmptyState } from '../../components/common/DashboardComponents';

const EmergencyOfficerDashboard = () => {
    const { backendUser } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
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
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                            <p className="text-gray-600 mt-2">Only emergency officers can access this page.</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <LoadingSpinner message="Loading emergency officer dashboard..." />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const activeEmergencies = emergencies.filter(e => e.status === 'in-progress');
    const pendingEmergencies = emergencies.filter(e => e.status === 'pending');
    const resolvedEmergencies = emergencies.filter(e => e.status === 'resolved');

    const sidebarItems = [
        { id: 'overview', label: 'Active Emergencies', icon: '🚨' },
        { id: 'pending', label: 'Pending Cases', icon: '⏳' },
        { id: 'resolved', label: 'Resolved Cases', icon: '✅' },
        { id: 'reports', label: 'Reports & Analytics', icon: '📊' }
    ];

    const statsCards = [
        {
            title: 'Pending Emergencies',
            value: stats.pendingEmergencies,
            icon: '⚠️',
            color: 'red',
            change: '+2'
        },
        {
            title: 'In Progress',
            value: stats.inProgressEmergencies,
            icon: '🏃',
            color: 'blue',
            change: '+1'
        },
        {
            title: 'Resolved Today',
            value: stats.resolvedToday,
            icon: '✅',
            color: 'green',
            change: '+3'
        },
        {
            title: 'Avg Response Time',
            value: stats.averageResponseTime,
            icon: '⏱️',
            color: 'purple',
            change: '-2 min'
        }
    ];

    const tabs = [
        {
            id: 'overview',
            label: 'Active Emergencies',
            content: (
                <div className="space-y-6">
                    <Card title="Active Human Emergencies">
                        {activeEmergencies.length > 0 ? (
                            <DataTable
                                headers={['Emergency Details', 'Location', 'Priority', 'Status', 'Time', 'Actions']}
                                data={activeEmergencies}
                                renderRow={(emergency) => (
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
                                            <StatusBadge status={emergency.priority} variant="warning" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={emergency.status} variant="info" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getTimeAgo(emergency.createdAt || emergency.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openDetailModal(emergency)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                onClick={() => openUpdateModal(emergency)}
                                            >
                                                Update Status
                                            </Button>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:text-purple-900 text-sm"
                                            >
                                                Track Location
                                            </a>
                                        </td>
                                    </tr>
                                )}
                            />
                        ) : (
                            <EmptyState message="No active emergencies found" />
                        )}
                    </Card>
                </div>
            )
        },
        {
            id: 'pending',
            label: 'Pending Cases',
            content: (
                <div className="space-y-6">
                    <Card title="Pending Human Emergencies">
                        {pendingEmergencies.length > 0 ? (
                            <DataTable
                                headers={['Emergency Details', 'Location', 'Priority', 'Status', 'Time', 'Actions']}
                                data={pendingEmergencies}
                                renderRow={(emergency) => (
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
                                            <StatusBadge status={emergency.priority} variant="warning" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={emergency.status} variant="warning" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getTimeAgo(emergency.createdAt || emergency.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openDetailModal(emergency)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                onClick={() => openUpdateModal(emergency)}
                                            >
                                                Update Status
                                            </Button>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:text-purple-900 text-sm"
                                            >
                                                Track Location
                                            </a>
                                        </td>
                                    </tr>
                                )}
                            />
                        ) : (
                            <EmptyState message="No pending emergencies found" />
                        )}
                    </Card>
                </div>
            )
        },
        {
            id: 'resolved',
            label: 'Resolved Cases',
            content: (
                <div className="space-y-6">
                    <Card title="Resolved Human Emergencies">
                        {resolvedEmergencies.length > 0 ? (
                            <DataTable
                                headers={['Emergency Details', 'Location', 'Priority', 'Status', 'Time', 'Actions']}
                                data={resolvedEmergencies}
                                renderRow={(emergency) => (
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
                                            <StatusBadge status={emergency.priority} variant="warning" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={emergency.status} variant="success" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getTimeAgo(emergency.createdAt || emergency.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openDetailModal(emergency)}
                                            >
                                                View Details
                                            </Button>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emergency.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:text-purple-900 text-sm"
                                            >
                                                Track Location
                                            </a>
                                        </td>
                                    </tr>
                                )}
                            />
                        ) : (
                            <EmptyState message="No resolved emergencies found" />
                        )}
                    </Card>
                </div>
            )
        },
        {
            id: 'reports',
            label: 'Reports & Analytics',
            content: (
                <div className="space-y-6">
                    <Card title="Emergency Response Reports">
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
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
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
                        </Card>

                        <Card>
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
                        </Card>

                        <Card>
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
                        </Card>

                        <Card>
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
                        </Card>
                    </div>
                </div>
            )
        }
    ];

    const rightWidgets = [
        {
            title: 'Duty Status',
            content: (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
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
                    <div className="text-xs text-gray-500">
                        Toggle your availability for emergency calls
                    </div>
                </div>
            )
        },
        {
            title: 'Quick Stats',
            content: (
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>First Aid Cases:</span>
                        <span className="font-medium">{stats.firstAidCases}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Hospital Coordinations:</span>
                        <span className="font-medium">{stats.hospitalCoordinations}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Critical Cases:</span>
                        <span className="font-medium">{stats.criticalCases}</span>
                    </div>
                </div>
            )
        }
    ];

    return (
        <ProtectedRoute>
            <DashboardLayout
                sidebarItems={sidebarItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchPlaceholder="Search emergencies..."
                greetingMessage={`Welcome back, ${backendUser?.name || 'Emergency Officer'}!`}
                statsCards={statsCards}
                rightWidgets={rightWidgets}
                headerColor="red"
            >
                <TabbedContent
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    headerColor="red"
                />
            </DashboardLayout>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Emergency Details"
            >
                {selectedEmergency && (
                    <>
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
                                <StatusBadge status={selectedEmergency.priority} variant="warning" className="ml-2" />
                            </div>
                            <div>
                                <span className="font-medium">Status:</span>
                                <StatusBadge status={selectedEmergency.status} variant="info" className="ml-2" />
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
                            <Button
                                variant="secondary"
                                onClick={() => setShowDetailModal(false)}
                                className="flex-1"
                            >
                                Close
                            </Button>
                            {selectedEmergency.reporterPhone && (
                                <a
                                    href={`tel:${selectedEmergency.reporterPhone}`}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                                >
                                    Call Reporter
                                </a>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* Update Status Modal */}
            <Modal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                title="Update Emergency Status"
            >
                {selectedEmergency && (
                    <form onSubmit={handleUpdateStatus}>
                        <div className="space-y-4">
                            <Field label="Status">
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
                            </Field>
                            <Field label="First Aid Provided">
                                <textarea
                                    value={statusUpdate.firstAidProvided}
                                    onChange={(e) => setStatusUpdate({...statusUpdate, firstAidProvided: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={2}
                                    placeholder="Describe first aid measures taken..."
                                />
                            </Field>
                            <Field label="Hospital Coordination">
                                <textarea
                                    value={statusUpdate.hospitalCoordination}
                                    onChange={(e) => setStatusUpdate({...statusUpdate, hospitalCoordination: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={2}
                                    placeholder="Hospital coordination details..."
                                />
                            </Field>
                            <Field label="Response Notes">
                                <textarea
                                    value={statusUpdate.responseNotes}
                                    onChange={(e) => setStatusUpdate({...statusUpdate, responseNotes: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="Additional response notes..."
                                />
                            </Field>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowUpdateModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                className="flex-1"
                            >
                                Update Status
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </ProtectedRoute>
    );
};

export default EmergencyOfficerDashboard;