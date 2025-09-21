import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardLayout, TabbedContent } from '../../components/common/DashboardLayout';
import { Modal, Field, Input, Button, StatusBadge, DataTable, Card, LoadingSpinner, EmptyState } from '../../components/common/DashboardComponents';

const CallOperatorDashboard = () => {
    const { backendUser } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [emergencyForms, setEmergencyForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [newEmergency, setNewEmergency] = useState({
        type: 'human',
        description: '',
        location: '',
        priority: 'medium',
        reporterName: '',
        reporterPhone: '',
        assignedOfficer: ''
    });
    const [replyText, setReplyText] = useState('');

    const [stats, setStats] = useState({
        totalCalls: 0,
        activeEmergencies: 0,
        pendingComplaints: 0,
        emergencyForms: 0,
        averageResponseTime: '8 min',
        callsToday: 0,
        emergenciesResolved: 0
    });

    useEffect(() => {
        if (backendUser?.role === 'callOperator') {
            fetchAllData();
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

            // Calculate stats
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
                emergenciesResolved: emergenciesData.filter(e => e.status === 'resolved').length
            });
        } catch (error) {
            console.error('Failed to fetch call operator data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmergency = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createEmergency({
                ...newEmergency,
                createdBy: backendUser?.name || 'Call Operator',
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].substring(0, 5)
            });
            setShowCreateModal(false);
            setNewEmergency({
                type: 'human',
                description: '',
                location: '',
                priority: 'medium',
                reporterName: '',
                reporterPhone: '',
                assignedOfficer: ''
            });
            fetchAllData();
            alert('Emergency logged successfully and forwarded to appropriate officer!');
        } catch (error) {
            console.error('Failed to create emergency:', error);
            setError('Failed to log emergency');
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
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                            <p className="text-gray-600 mt-2">Only call operators can access this page.</p>
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
                        <LoadingSpinner message="Loading call operator dashboard..." />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const sidebarItems = [
        { id: 'overview', label: 'Emergency Operations', icon: '🚨' },
        { id: 'complaints', label: 'Complaints & Forms', icon: '📋' },
        { id: 'reports', label: 'Reports & Analytics', icon: '📊' }
    ];

    const statsCards = [
        {
            title: 'Total Calls Today',
            value: stats.callsToday,
            icon: '📞',
            color: 'red',
            change: '+12%'
        },
        {
            title: 'Active Emergencies',
            value: stats.activeEmergencies,
            icon: '⚠️',
            color: 'orange',
            change: '+3'
        },
        {
            title: 'Pending Complaints',
            value: stats.pendingComplaints,
            icon: '💬',
            color: 'blue',
            change: '-2'
        },
        {
            title: 'Avg Response Time',
            value: stats.averageResponseTime,
            icon: '⏱️',
            color: 'green',
            change: '-1 min'
        }
    ];

    const tabs = [
        {
            id: 'overview',
            label: 'Emergency Operations',
            content: (
                <div className="space-y-6">
                    {/* Emergency Categories */}
                    <Card title="Emergency Response Categories">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 transition-colors cursor-pointer">
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

                            <div className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition-colors cursor-pointer">
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

                            <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors cursor-pointer">
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

                            <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer">
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
                    </Card>

                    {/* Recent Emergencies */}
                    <Card title="Recent Emergency Calls">
                        {emergencies.length > 0 ? (
                            <DataTable
                                headers={['Type', 'Description', 'Location', 'Priority', 'Status', 'Actions']}
                                data={emergencies.slice(0, 10)}
                                renderRow={(emergency) => (
                                    <tr key={emergency._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={emergency.type} variant="info" />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {emergency.description}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {emergency.status === 'pending' && (
                                                <>
                                                    {emergency.type === 'human' && (
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => forwardEmergency(emergency._id, 'Emergency Officer')}
                                                        >
                                                            Forward to Emergency Officer
                                                        </Button>
                                                    )}
                                                    {(emergency.type === 'animal' || emergency.type === 'unethical') && (
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => forwardEmergency(emergency._id, 'Wildlife Officer')}
                                                        >
                                                            Forward to Wildlife Officer
                                                        </Button>
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
                                )}
                            />
                        ) : (
                            <EmptyState message="No emergency calls received" />
                        )}
                    </Card>
                </div>
            )
        },
        {
            id: 'complaints',
            label: 'Complaints & Forms',
            content: (
                <div className="space-y-6">
                    {/* Complaints Section */}
                    <Card title="Public Complaints">
                        {complaints.length > 0 ? (
                            <DataTable
                                headers={['Subject', 'Complainant', 'Date', 'Status', 'Actions']}
                                data={complaints}
                                renderRow={(complaint) => (
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
                                            <StatusBadge 
                                                status={complaint.reply ? 'Replied' : 'Pending'} 
                                                variant={complaint.reply ? 'success' : 'warning'} 
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {!complaint.reply && (
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    onClick={() => {
                                                        setSelectedComplaint(complaint);
                                                        setShowReplyModal(true);
                                                    }}
                                                >
                                                    Reply
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                )}
                            />
                        ) : (
                            <EmptyState message="No complaints received" />
                        )}
                    </Card>

                    {/* Emergency Forms Section */}
                    <Card title="Physical Emergency Forms">
                        {emergencyForms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {emergencyForms.map((form) => (
                                    <div key={form._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-800 capitalize">{form.emergency_type} Emergency</h3>
                                            <StatusBadge status="Form" variant="info" />
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
                                            <Button size="sm" variant="outline">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No emergency forms received" />
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
                    <Card title="Daily Operations Summary">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{stats.totalCalls}</div>
                                <div className="text-sm text-gray-600">Total Calls Handled</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{stats.emergenciesResolved}</div>
                                <div className="text-sm text-gray-600">Emergencies Resolved</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{stats.pendingComplaints}</div>
                                <div className="text-sm text-gray-600">Complaints Processed</div>
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
                                    <h3 className="text-lg font-medium text-gray-900">Generate Emergency Report</h3>
                                    <p className="text-sm text-gray-500">Detailed emergency response analytics</p>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Generate Complaint Report</h3>
                                    <p className="text-sm text-gray-500">Public complaint handling summary</p>
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
            title: 'Quick Actions',
            content: (
                <div className="space-y-3">
                    <Button 
                        variant="danger" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowCreateModal(true)}
                    >
                        🚨 Log Emergency
                    </Button>
                    <Button variant="success" size="sm" className="w-full">
                        📋 View All Complaints
                    </Button>
                    <Button variant="info" size="sm" className="w-full">
                        📊 Generate Report
                    </Button>
                </div>
            )
        },
        {
            title: 'Emergency Contacts',
            content: (
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Emergency Officer:</span>
                        <span className="font-medium">+94 11 123 4567</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Wildlife Officer:</span>
                        <span className="font-medium">+94 11 123 4568</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Veterinarian:</span>
                        <span className="font-medium">+94 11 123 4569</span>
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
                searchPlaceholder="Search emergencies, complaints..."
                greetingMessage={`Welcome back, ${backendUser?.name || 'Call Operator'}!`}
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

            {/* Create Emergency Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Log New Emergency"
            >
                <form onSubmit={handleCreateEmergency}>
                    <div className="space-y-4">
                        <Field label="Emergency Type">
                            <select
                                value={newEmergency.type}
                                onChange={(e) => setNewEmergency({...newEmergency, type: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            >
                                <option value="human">Human Emergency</option>
                                <option value="animal">Animal Emergency</option>
                                <option value="unethical">Unethical Activity</option>
                                <option value="physical">Physical Emergency</option>
                            </select>
                        </Field>
                        <Field label="Description">
                            <textarea
                                value={newEmergency.description}
                                onChange={(e) => setNewEmergency({...newEmergency, description: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                rows={3}
                                required
                            />
                        </Field>
                        <Field label="Location">
                            <Input
                                type="text"
                                value={newEmergency.location}
                                onChange={(e) => setNewEmergency({...newEmergency, location: e.target.value})}
                                required
                            />
                        </Field>
                        <Field label="Priority">
                            <select
                                value={newEmergency.priority}
                                onChange={(e) => setNewEmergency({...newEmergency, priority: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </Field>
                        <Field label="Reporter Name">
                            <Input
                                type="text"
                                value={newEmergency.reporterName}
                                onChange={(e) => setNewEmergency({...newEmergency, reporterName: e.target.value})}
                            />
                        </Field>
                        <Field label="Reporter Phone">
                            <Input
                                type="tel"
                                value={newEmergency.reporterPhone}
                                onChange={(e) => setNewEmergency({...newEmergency, reporterPhone: e.target.value})}
                            />
                        </Field>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            className="flex-1"
                        >
                            Log Emergency
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reply to Complaint Modal */}
            <Modal
                isOpen={showReplyModal}
                onClose={() => {
                    setShowReplyModal(false);
                    setSelectedComplaint(null);
                    setReplyText('');
                }}
                title="Reply to Complaint"
            >
                {selectedComplaint && (
                    <>
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600"><strong>From:</strong> {selectedComplaint.name}</p>
                            <p className="text-sm text-gray-600"><strong>Subject:</strong> {selectedComplaint.subject}</p>
                            <p className="text-sm text-gray-600 mt-2">{selectedComplaint.message}</p>
                        </div>
                        <form onSubmit={handleReplyToComplaint}>
                            <Field label="Your Reply">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={4}
                                    required
                                    placeholder="Type your response to the complainant..."
                                />
                            </Field>
                            <div className="flex gap-4 mt-6">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowReplyModal(false);
                                        setSelectedComplaint(null);
                                        setReplyText('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="success"
                                    className="flex-1"
                                >
                                    Send Reply
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </Modal>
        </ProtectedRoute>
    );
};

export default CallOperatorDashboard;