import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const AdminDashboard = () => {
    const { backendUser, user } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
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

    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApplications: 0,
        activeActivities: 0,
        totalDonations: 0
    });

    useEffect(() => {
        if (backendUser?.role === 'admin') {
            fetchAllData();
        }
    }, [backendUser]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [usersRes, appsRes, statsRes] = await Promise.all([
                protectedApi.getAllUsers(),
                protectedApi.getApplications(),
                protectedApi.getAdminStats()
            ]);

            setUsers(usersRes.data || []);
            setApplications(appsRes.data || []);
            setStats(statsRes.data || {});
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
                            <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
                            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800">Pending Applications</h3>
                            <p className="text-3xl font-bold text-yellow-600">{applications.filter(app => app.status === 'pending').length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800">Active Staff</h3>
                            <p className="text-3xl font-bold text-green-600">{users.filter(user => user.isActive !== false).length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
                            <p className="text-3xl font-bold text-green-600">Good</p>
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