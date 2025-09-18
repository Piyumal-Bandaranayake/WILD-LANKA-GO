import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const UserManagement = () => {
    const { backendUser } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [tourGuides, setTourGuides] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [wildlifeOfficers, setWildlifeOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            const [usersRes, guidesRes, driversRes, officersRes] = await Promise.all([
                protectedApi.getAllUsers().catch(() => ({ data: [] })),
                protectedApi.getTourGuides().catch(() => ({ data: [] })),
                protectedApi.getDrivers().catch(() => ({ data: [] })),
                protectedApi.getWildlifeOfficers().catch(() => ({ data: [] }))
            ]);

            setUsers(usersRes.data || []);
            setTourGuides(guidesRes.data || []);
            setDrivers(driversRes.data || []);
            setWildlifeOfficers(officersRes.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (userId, userType, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            if (userType === 'tourGuide') {
                await protectedApi.updateTourGuideAvailability(userId, { isAvailable: newStatus });
            } else if (userType === 'driver') {
                await protectedApi.updateDriverAvailability(userId, { isAvailable: newStatus });
            }
            fetchAllUsers();
        } catch (error) {
            console.error('Failed to update availability:', error);
            setError('Failed to update availability');
        }
    };

    const handleDeleteUser = async (userId, userType) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await protectedApi.deleteUser(userId);
                fetchAllUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                setError('Failed to delete user');
            }
        }
    };

    const getUserStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
            case 'inactive':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const renderUserCard = (user, userType) => (
        <div key={user._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold">
                        {user.firstname ? `${user.firstname} ${user.lastname}` :
                         user.DriverName || user.name || 'Unknown User'}
                    </h3>
                    <p className="text-gray-600">{user.email || user.Email}</p>
                    <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {userType}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {user.Status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserStatusColor(user.Status)}`}>
                            {user.Status}
                        </span>
                    )}
                    {typeof user.isAvailable !== 'undefined' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 text-sm">
                {user.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
                {user.PhoneNumber && <p><span className="font-medium">Phone:</span> {user.PhoneNumber}</p>}

                {user.Guide_Registration_No && (
                    <p><span className="font-medium">Registration No:</span> {user.Guide_Registration_No}</p>
                )}
                {user.Experience_Year && (
                    <p><span className="font-medium">Experience:</span> {user.Experience_Year} years</p>
                )}

                {user.LicenceNumber && (
                    <p><span className="font-medium">License:</span> {user.LicenceNumber}</p>
                )}
                {user.vehicleType && (
                    <p><span className="font-medium">Vehicle:</span> {user.vehicleType} - {user.vehicleNumber}</p>
                )}

                {user.currentTourStatus && (
                    <p><span className="font-medium">Tour Status:</span> {user.currentTourStatus}</p>
                )}

                <p><span className="font-medium">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            {backendUser?.role === 'admin' && (
                <div className="mt-4 flex gap-2">
                    {(userType === 'tourGuide' || userType === 'driver') && typeof user.isAvailable !== 'undefined' && (
                        <button
                            onClick={() => handleToggleAvailability(user._id, userType, user.isAvailable)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                user.isAvailable
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        >
                            {user.isAvailable ? 'Set Unavailable' : 'Set Available'}
                        </button>
                    )}
                    <button
                        onClick={() => handleDeleteUser(user._id, userType)}
                        className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );

    const isAdmin = backendUser?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                        <p className="text-gray-600">You don't have permission to access user management.</p>
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
                        <p className="mt-4 text-gray-600">Loading users...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <div className="text-sm text-gray-600">
                            Total Users: {users.length + tourGuides.length + drivers.length + wildlifeOfficers.length}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="mb-8 border-b">
                        <nav className="flex space-x-8">
                            {[
                                { id: 'all', label: 'All Users', count: users.length + tourGuides.length + drivers.length + wildlifeOfficers.length },
                                { id: 'users', label: 'App Users', count: users.length },
                                { id: 'guides', label: 'Tour Guides', count: tourGuides.length },
                                { id: 'drivers', label: 'Safari Drivers', count: drivers.length },
                                { id: 'officers', label: 'Wildlife Officers', count: wildlifeOfficers.length }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-green-500 text-green-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* User Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* App Users */}
                        {(activeTab === 'all' || activeTab === 'users') &&
                            users.map((user) => renderUserCard(user, 'User'))
                        }

                        {/* Tour Guides */}
                        {(activeTab === 'all' || activeTab === 'guides') &&
                            tourGuides.map((guide) => renderUserCard(guide, 'Tour Guide'))
                        }

                        {/* Safari Drivers */}
                        {(activeTab === 'all' || activeTab === 'drivers') &&
                            drivers.map((driver) => renderUserCard(driver, 'Safari Driver'))
                        }

                        {/* Wildlife Officers */}
                        {(activeTab === 'all' || activeTab === 'officers') &&
                            wildlifeOfficers.map((officer) => renderUserCard(officer, 'Wildlife Officer'))
                        }
                    </div>

                    {/* Statistics Summary */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">{users.length}</div>
                            <div className="text-blue-100">App Users</div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">{tourGuides.filter(g => g.isAvailable).length}/{tourGuides.length}</div>
                            <div className="text-green-100">Available Guides</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">{drivers.filter(d => d.isAvailable).length}/{drivers.length}</div>
                            <div className="text-purple-100">Available Drivers</div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">{wildlifeOfficers.length}</div>
                            <div className="text-orange-100">Wildlife Officers</div>
                        </div>
                    </div>

                    {/* Empty State */}
                    {users.length === 0 && tourGuides.length === 0 && drivers.length === 0 && wildlifeOfficers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No users found</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default UserManagement;