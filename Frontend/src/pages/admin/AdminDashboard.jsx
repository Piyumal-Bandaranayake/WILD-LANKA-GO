import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const AdminDashboard = () => {
    const { backendUser, user } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activities, setActivities] = useState([]);
    const [events, setEvents] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'tourGuide',
        password: '',
        phone: '',
        specialization: '',
        experience: ''
    });

    const [newActivity, setNewActivity] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        maxParticipants: '',
        location: '',
        category: 'wildlife',
        availableSlots: '',
        requirements: ''
    });

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxAttendees: '',
        category: 'educational',
        registrationFee: '',
        requirements: ''
    });

    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApplications: 0,
        activeActivities: 0,
        totalDonations: 0,
        totalEvents: 0,
        recentBookings: 0,
        monthlyRevenue: 0,
        systemHealth: 'Good'
    });

    useEffect(() => {
        if (backendUser?.role === 'admin') {
            fetchAllData();
        }
    }, [backendUser]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [usersRes, appsRes, activitiesRes, eventsRes, donationsRes] = await Promise.all([
                protectedApi.getAllUsers(),
                protectedApi.getApplications(),
                protectedApi.getActivities(),
                protectedApi.getEvents(),
                protectedApi.getDonations()
            ]);

            const usersData = usersRes.data || [];
            const appsData = appsRes.data || [];
            const activitiesData = activitiesRes.data || [];
            const eventsData = eventsRes.data || [];
            const donationsData = donationsRes.data || [];

            setUsers(usersData);
            setApplications(appsData);
            setActivities(activitiesData);
            setEvents(eventsData);
            setDonations(donationsData);

            // Calculate enhanced stats
            setStats({
                totalUsers: usersData.length,
                pendingApplications: appsData.filter(app => app.status === 'pending').length,
                activeActivities: activitiesData.length,
                totalDonations: donationsData.length,
                totalEvents: eventsData.length,
                recentBookings: 45, // This would come from bookings API
                monthlyRevenue: donationsData.reduce((sum, d) => sum + (d.amount || 0), 0),
                systemHealth: 'Good'
            });
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            setError('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createUser({
                ...newUser,
                createdBy: user?.name || 'Admin'
            });
            setShowCreateModal(false);
            setNewUser({
                name: '',
                email: '',
                role: 'tourGuide',
                password: '',
                phone: '',
                specialization: '',
                experience: ''
            });
            fetchAllData();
            alert('User created successfully! Login credentials have been sent via email.');
        } catch (error) {
            console.error('Failed to create user:', error);
            setError('Failed to create user');
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            await protectedApi.updateUserRole(userId, newRole);
            fetchAllData();
            setShowRoleModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user role:', error);
            setError('Failed to update user role');
        }
    };

    const handleDeactivateUser = async (userId) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            try {
                await protectedApi.deactivateUser(userId);
                fetchAllData();
            } catch (error) {
                console.error('Failed to deactivate user:', error);
                setError('Failed to deactivate user');
            }
        }
    };

    const handleApproveApplication = async (appId) => {
        const application = applications.find(app => app._id === appId);
        if (!application) return;

        try {
            // Approve application
            await protectedApi.updateApplicationStatus(appId, 'approved');

            // Create user account
            await protectedApi.createUser({
                name: application.fullName,
                email: application.email,
                role: application.vehicleType ? 'safariDriver' : 'tourGuide',
                phone: application.phone,
                experience: application.experience,
                skills: application.skills,
                languages: application.languages,
                createdBy: user?.name || 'Admin'
            });

            fetchAllData();
            alert('Application approved and user account created! Login credentials sent via email.');
        } catch (error) {
            console.error('Failed to approve application:', error);
            setError('Failed to approve application');
        }
    };

    const handleRejectApplication = async (appId) => {
        try {
            await protectedApi.updateApplicationStatus(appId, 'rejected');
            fetchAllData();
        } catch (error) {
            console.error('Failed to reject application:', error);
            setError('Failed to reject application');
        }
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        try {
            if (selectedActivity) {
                await protectedApi.updateActivity(selectedActivity._id, {
                    ...newActivity,
                    price: parseFloat(newActivity.price),
                    maxParticipants: parseInt(newActivity.maxParticipants),
                    availableSlots: parseInt(newActivity.availableSlots)
                });
            } else {
                await protectedApi.createActivity({
                    ...newActivity,
                    price: parseFloat(newActivity.price),
                    maxParticipants: parseInt(newActivity.maxParticipants),
                    availableSlots: parseInt(newActivity.availableSlots),
                    createdBy: user?.name || 'Admin'
                });
            }
            setShowActivityModal(false);
            setSelectedActivity(null);
            setNewActivity({
                name: '',
                description: '',
                price: '',
                duration: '',
                maxParticipants: '',
                location: '',
                category: 'wildlife',
                availableSlots: '',
                requirements: ''
            });
            fetchAllData();
            alert(`Activity ${selectedActivity ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Failed to save activity:', error);
            setError('Failed to save activity');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            if (selectedEvent) {
                await protectedApi.updateEvent(selectedEvent._id, {
                    ...newEvent,
                    maxAttendees: parseInt(newEvent.maxAttendees),
                    registrationFee: parseFloat(newEvent.registrationFee) || 0
                });
            } else {
                await protectedApi.createEvent({
                    ...newEvent,
                    maxAttendees: parseInt(newEvent.maxAttendees),
                    registrationFee: parseFloat(newEvent.registrationFee) || 0,
                    createdBy: user?.name || 'Admin'
                });
            }
            setShowEventModal(false);
            setSelectedEvent(null);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                maxAttendees: '',
                category: 'educational',
                registrationFee: '',
                requirements: ''
            });
            fetchAllData();
            alert(`Event ${selectedEvent ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Failed to save event:', error);
            setError('Failed to save event');
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (window.confirm('Are you sure you want to delete this activity?')) {
            try {
                await protectedApi.deleteActivity(activityId);
                fetchAllData();
            } catch (error) {
                console.error('Failed to delete activity:', error);
                setError('Failed to delete activity');
            }
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await protectedApi.deleteEvent(eventId);
                fetchAllData();
            } catch (error) {
                console.error('Failed to delete event:', error);
                setError('Failed to delete event');
            }
        }
    };

    const handleEditActivity = (activity) => {
        setSelectedActivity(activity);
        setNewActivity({
            name: activity.name,
            description: activity.description,
            price: activity.price.toString(),
            duration: activity.duration,
            maxParticipants: activity.maxParticipants.toString(),
            location: activity.location,
            category: activity.category,
            availableSlots: activity.availableSlots.toString(),
            requirements: activity.requirements || ''
        });
        setShowActivityModal(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setNewEvent({
            title: event.title,
            description: event.description,
            date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
            time: event.time,
            location: event.location,
            maxAttendees: event.maxAttendees.toString(),
            category: event.category,
            registrationFee: (event.registrationFee || 0).toString(),
            requirements: event.requirements || ''
        });
        setShowEventModal(true);
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: 'bg-purple-100 text-purple-800',
            wildlifeOfficer: 'bg-green-100 text-green-800',
            emergencyOfficer: 'bg-red-100 text-red-800',
            callOperator: 'bg-blue-100 text-blue-800',
            tourGuide: 'bg-yellow-100 text-yellow-800',
            safariDriver: 'bg-orange-100 text-orange-800',
            vet: 'bg-pink-100 text-pink-800',
            tourist: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    // Only Admin can access this page
    if (backendUser?.role !== 'admin') {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                        <p className="text-gray-600 mt-2">Only administrators can access this page.</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Create User Account
                        </button>
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
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
                                    <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Pending Applications</h3>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Active Activities</h3>
                                    <p className="text-3xl font-bold text-green-600">{stats.activeActivities}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Monthly Revenue</h3>
                                    <p className="text-3xl font-bold text-purple-600">${stats.monthlyRevenue.toLocaleString()}</p>
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Total Events</h3>
                                    <p className="text-3xl font-bold text-orange-600">{stats.totalEvents}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-pink-100 rounded-lg">
                                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Total Donations</h3>
                                    <p className="text-3xl font-bold text-pink-600">{stats.totalDonations}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
                                    <p className="text-3xl font-bold text-indigo-600">{stats.systemHealth}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 mb-6">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'users'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'applications'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Staff Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('activities')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'activities'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Activity Management
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'events'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Event Management
                        </button>
                        <button
                            onClick={() => setActiveTab('donations')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'donations'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Donation Management
                        </button>
                    </div>

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">System Users</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowRoleModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Change Role
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeactivateUser(user._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Applications Tab */}
                    {activeTab === 'applications' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {applications.map((application) => (
                                <div key={application._id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold">{application.fullName}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {application.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">Email:</span> {application.email}</p>
                                        <p><span className="font-medium">Phone:</span> {application.phone}</p>
                                        <p><span className="font-medium">Position:</span> {application.vehicleType ? 'Safari Driver' : 'Tour Guide'}</p>
                                        <p><span className="font-medium">Experience:</span> {application.experience}</p>
                                        <p><span className="font-medium">Skills:</span> {application.skills}</p>
                                        <p><span className="font-medium">Languages:</span> {application.languages}</p>
                                        {application.vehicleType && (
                                            <>
                                                <p><span className="font-medium">Vehicle Type:</span> {application.vehicleType}</p>
                                                <p><span className="font-medium">License:</span> {application.licenseNumber}</p>
                                            </>
                                        )}
                                        <p><span className="font-medium">Applied:</span> {new Date(application.applicationDate).toLocaleDateString()}</p>
                                    </div>

                                    {application.status === 'pending' && (
                                        <div className="mt-6 flex gap-2">
                                            <button
                                                onClick={() => handleApproveApplication(application._id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex-1"
                                            >
                                                Approve & Create Account
                                            </button>
                                            <button
                                                onClick={() => handleRejectApplication(application._id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex-1"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {applications.length === 0 && (
                                <div className="col-span-2 text-center py-12">
                                    <p className="text-gray-500 text-lg">No applications submitted</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">Activity Management</h2>
                                <button
                                    onClick={() => {
                                        setSelectedActivity(null);
                                        setNewActivity({
                                            name: '',
                                            description: '',
                                            price: '',
                                            duration: '',
                                            maxParticipants: '',
                                            location: '',
                                            category: 'wildlife',
                                            availableSlots: '',
                                            requirements: ''
                                        });
                                        setShowActivityModal(true);
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create New Activity
                                </button>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slots</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {activities.map((activity) => (
                                                <tr key={activity._id}>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                                                            <div className="text-sm text-gray-500">{activity.duration}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className="capitalize">{activity.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${activity.price}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {activity.availableSlots}/{activity.maxParticipants}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {activity.location}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => handleEditActivity(activity)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteActivity(activity._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">Event Management</h2>
                                <button
                                    onClick={() => {
                                        setSelectedEvent(null);
                                        setNewEvent({
                                            title: '',
                                            description: '',
                                            date: '',
                                            time: '',
                                            location: '',
                                            maxAttendees: '',
                                            category: 'educational',
                                            registrationFee: '',
                                            requirements: ''
                                        });
                                        setShowEventModal(true);
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create New Event
                                </button>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {events.map((event) => (
                                                <tr key={event._id}>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                            <div className="text-sm text-gray-500">{event.location}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(event.date).toLocaleDateString()}<br/>
                                                        {event.time}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className="capitalize">{event.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${event.registrationFee || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {event.registrations?.length || 0}/{event.maxAttendees}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Donations Tab */}
                    {activeTab === 'donations' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Donation Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">${stats.monthlyRevenue.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Total Donations</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">{donations.length}</div>
                                        <div className="text-sm text-gray-600">Number of Donors</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-600">
                                            ${donations.length > 0 ? Math.round(stats.monthlyRevenue / donations.length) : 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Average Donation</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800">Recent Donations</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {donations.map((donation) => (
                                                <tr key={donation._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{donation.donorName}</div>
                                                            <div className="text-sm text-gray-500">{donation.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${donation.amount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {donation.purpose || 'General Fund'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(donation.createdAt || donation.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            Completed
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Create User Account</h2>
                        <form onSubmit={handleCreateUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="tourGuide">Tour Guide</option>
                                        <option value="safariDriver">Safari Driver</option>
                                        <option value="wildlifeOfficer">Wildlife Park Officer</option>
                                        <option value="emergencyOfficer">Emergency Officer</option>
                                        <option value="callOperator">Call Operator</option>
                                        <option value="vet">Veterinarian</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Temporary Password</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Will be sent via email"
                                        required
                                    />
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
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {selectedActivity ? 'Edit Activity' : 'Create New Activity'}
                        </h2>
                        <form onSubmit={handleCreateActivity}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Activity Name</label>
                                    <input
                                        type="text"
                                        value={newActivity.name}
                                        onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newActivity.description}
                                        onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price ($)</label>
                                        <input
                                            type="number"
                                            value={newActivity.price}
                                            onChange={(e) => setNewActivity({...newActivity, price: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Duration</label>
                                        <input
                                            type="text"
                                            value={newActivity.duration}
                                            onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="e.g., 2 hours"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max Participants</label>
                                        <input
                                            type="number"
                                            value={newActivity.maxParticipants}
                                            onChange={(e) => setNewActivity({...newActivity, maxParticipants: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Available Slots</label>
                                        <input
                                            type="number"
                                            value={newActivity.availableSlots}
                                            onChange={(e) => setNewActivity({...newActivity, availableSlots: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newActivity.location}
                                        onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={newActivity.category}
                                        onChange={(e) => setNewActivity({...newActivity, category: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="wildlife">Wildlife</option>
                                        <option value="adventure">Adventure</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="educational">Educational</option>
                                        <option value="conservation">Conservation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Requirements (Optional)</label>
                                    <textarea
                                        value={newActivity.requirements}
                                        onChange={(e) => setNewActivity({...newActivity, requirements: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows={2}
                                        placeholder="Any special requirements or equipment needed"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowActivityModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {selectedActivity ? 'Update' : 'Create'} Activity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {selectedEvent ? 'Edit Event' : 'Create New Event'}
                        </h2>
                        <form onSubmit={handleCreateEvent}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={newEvent.time}
                                            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max Attendees</label>
                                        <input
                                            type="number"
                                            value={newEvent.maxAttendees}
                                            onChange={(e) => setNewEvent({...newEvent, maxAttendees: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Registration Fee ($)</label>
                                        <input
                                            type="number"
                                            value={newEvent.registrationFee}
                                            onChange={(e) => setNewEvent({...newEvent, registrationFee: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="0 for free"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={newEvent.category}
                                        onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="educational">Educational</option>
                                        <option value="conservation">Conservation</option>
                                        <option value="awareness">Awareness</option>
                                        <option value="fundraising">Fundraising</option>
                                        <option value="community">Community</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Requirements (Optional)</label>
                                    <textarea
                                        value={newEvent.requirements}
                                        onChange={(e) => setNewEvent({...newEvent, requirements: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows={2}
                                        placeholder="Any special requirements for attendees"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEventModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {selectedEvent ? 'Update' : 'Create'} Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Role Modal */}
            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Change User Role</h2>
                        <div className="mb-4">
                            <p><span className="font-medium">User:</span> {selectedUser.name}</p>
                            <p><span className="font-medium">Current Role:</span> {selectedUser.role}</p>
                        </div>
                        <div className="space-y-2">
                            {['tourGuide', 'safariDriver', 'wildlifeOfficer', 'emergencyOfficer', 'callOperator', 'vet', 'admin'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleUpdateUserRole(selectedUser._id, role)}
                                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                                        selectedUser.role === role ? 'bg-green-100 text-green-800' : ''
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setSelectedUser(null);
                                }}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AdminDashboard;