import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const EmergencyList = () => {
    const { backendUser, user } = useAuthContext();
    const [emergencies, setEmergencies] = useState([]);
    const [emergencyForms, setEmergencyForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);

    const [newEmergency, setNewEmergency] = useState({
        type: 'wildlife',
        location: '',
        description: '',
        priority: 'Medium',
        date: '',
        time: ''
    });

    const [newEmergencyForm, setNewEmergencyForm] = useState({
        name: '',
        phone: '',
        email: '',
        property_name: '',
        location: '',
        emergency_type: 'wildlife',
        description: '',
        date: '',
        time: ''
    });

    useEffect(() => {
        fetchEmergencies();
        fetchEmergencyForms();
    }, []);

    const fetchEmergencies = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getEmergencies();
            setEmergencies(response.data || []);
        } catch (error) {
            console.error('Failed to fetch emergencies:', error);
            setError('Failed to load emergencies');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyForms = async () => {
        try {
            const response = await protectedApi.getEmergencyForms();
            setEmergencyForms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch emergency forms:', error);
        }
    };

    const handleCreateEmergency = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createEmergency({
                ...newEmergency,
                reportedBy: user?.name || 'Call Operator',
                status: 'pending'
            });
            setShowCreateModal(false);
            setNewEmergency({
                type: 'wildlife',
                location: '',
                description: '',
                priority: 'Medium',
                date: '',
                time: ''
            });
            fetchEmergencies();
        } catch (error) {
            console.error('Failed to create emergency:', error);
            setError('Failed to create emergency');
        }
    };

    const handleCreateEmergencyForm = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createEmergencyForm(newEmergencyForm);
            setShowFormModal(false);
            setNewEmergencyForm({
                name: '',
                phone: '',
                email: '',
                property_name: '',
                location: '',
                emergency_type: 'wildlife',
                description: '',
                date: '',
                time: ''
            });
            fetchEmergencyForms();
        } catch (error) {
            console.error('Failed to submit emergency form:', error);
            setError('Failed to submit emergency form');
        }
    };

    const handleUpdateEmergencyStatus = async (id, status) => {
        try {
            await protectedApi.updateEmergencyStatus(id, status);
            fetchEmergencies();
        } catch (error) {
            console.error('Failed to update emergency status:', error);
            setError('Failed to update emergency status');
        }
    };

    const handleDeleteEmergency = async (id) => {
        if (window.confirm('Are you sure you want to delete this emergency?')) {
            try {
                await protectedApi.deleteEmergency(id);
                fetchEmergencies();
            } catch (error) {
                console.error('Failed to delete emergency:', error);
                setError('Failed to delete emergency');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-red-100 text-red-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    // Role-based permissions
    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
    const isCallOperator = backendUser?.role === 'callOperator';
    const isEmergencyOfficer = backendUser?.role === 'emergencyOfficer';
    const isAdmin = backendUser?.role === 'admin';

    // Call Operators can receive and create emergency calls
    const canManageEmergencyCalls = isCallOperator || isAdmin;
    // Emergency Officers can handle forwarded calls and update status
    const canHandleEmergencies = isEmergencyOfficer || isAdmin;
    // Anyone can submit emergency forms
    const canSubmitEmergencyForm = true;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading emergencies...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Emergency Management</h1>
                        <div className="flex gap-4">
                            {canSubmitEmergencyForm && (
                                <button
                                    onClick={() => setShowFormModal(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Report Emergency
                                </button>
                            )}
                            {canManageEmergencyCalls && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Log Emergency Call
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Emergency Calls */}
                    {(canManageEmergencyCalls || canHandleEmergencies) && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Emergency Calls</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {emergencies.map((emergency) => (
                                    <div key={emergency._id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-semibold capitalize">{emergency.type} Emergency</h3>
                                            <div className="flex gap-2 items-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emergency.status)}`}>
                                                    {emergency.status || 'pending'}
                                                </span>
                                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(emergency.priority)}`} title={`${emergency.priority} Priority`}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <p><span className="font-medium">Location:</span> {emergency.location}</p>
                                            <p><span className="font-medium">Description:</span> {emergency.description}</p>
                                            <p><span className="font-medium">Priority:</span> {emergency.priority}</p>
                                            <p><span className="font-medium">Reported by:</span> {emergency.reportedBy}</p>
                                            <p><span className="font-medium">Date & Time:</span> {new Date(`${emergency.date}T${emergency.time}`).toLocaleString()}</p>
                                        </div>

                                        <div className="mt-6 flex gap-2 flex-wrap">
                                            {canHandleEmergencies && emergency.status !== 'resolved' && (
                                                <>
                                                    {emergency.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleUpdateEmergencyStatus(emergency._id, 'in-progress')}
                                                            className="bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700 transition-colors"
                                                        >
                                                            Start Handling
                                                        </button>
                                                    )}
                                                    {emergency.status === 'in-progress' && (
                                                        <button
                                                            onClick={() => handleUpdateEmergencyStatus(emergency._id, 'resolved')}
                                                            className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors"
                                                        >
                                                            Mark Resolved
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                onClick={() => alert(`Emergency Details:\n\nType: ${emergency.type}\nLocation: ${emergency.location}\nPriority: ${emergency.priority}\nStatus: ${emergency.status}\nDescription: ${emergency.description}\nReported by: ${emergency.reportedBy}\nDate: ${new Date(`${emergency.date}T${emergency.time}`).toLocaleString()}`)}
                                                className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            {canManageEmergencyCalls && (
                                                <button
                                                    onClick={() => handleDeleteEmergency(emergency._id)}
                                                    className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {emergencies.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No emergency calls logged</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Emergency Forms */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Emergency Reports</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {emergencyForms.map((form) => (
                                <div key={form._id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold capitalize">{form.emergency_type} Emergency</h3>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Form Submission
                                        </span>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <p><span className="font-medium">Name:</span> {form.name}</p>
                                        <p><span className="font-medium">Phone:</span> <a href={`tel:${form.phone}`} className="text-blue-600 hover:underline">{form.phone}</a></p>
                                        <p><span className="font-medium">Email:</span> {form.email}</p>
                                        <p><span className="font-medium">Property:</span> {form.property_name}</p>
                                        <p><span className="font-medium">Location:</span> {form.location}</p>
                                        <p><span className="font-medium">Description:</span> {form.description}</p>
                                        <p><span className="font-medium">Date & Time:</span> {new Date(`${form.date}T${form.time}`).toLocaleString()}</p>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        {canManageEmergencyCalls && (
                                            <button
                                                onClick={() => alert('Contact the reporter immediately and create an emergency call if needed.')}
                                                className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors"
                                            >
                                                Process Report
                                            </button>
                                        )}
                                        <button
                                            onClick={() => alert(`Emergency Report Details:\n\nReporter: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nProperty: ${form.property_name}\nLocation: ${form.location}\nType: ${form.emergency_type}\nDescription: ${form.description}\nDate: ${new Date(`${form.date}T${form.time}`).toLocaleString()}`)}
                                            className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {emergencyForms.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No emergency reports submitted</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Emergency Call Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Log Emergency Call</h2>
                        <form onSubmit={handleCreateEmergency}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Emergency Type</label>
                                    <select
                                        value={newEmergency.type}
                                        onChange={(e) => setNewEmergency({...newEmergency, type: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="wildlife">Wildlife Emergency</option>
                                        <option value="medical">Medical Emergency</option>
                                        <option value="fire">Fire Emergency</option>
                                        <option value="accident">Accident</option>
                                        <option value="flood">Flood</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select
                                        value={newEmergency.priority}
                                        onChange={(e) => setNewEmergency({...newEmergency, priority: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newEmergency.location}
                                        onChange={(e) => setNewEmergency({...newEmergency, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newEmergency.description}
                                        onChange={(e) => setNewEmergency({...newEmergency, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newEmergency.date}
                                        onChange={(e) => setNewEmergency({...newEmergency, date: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newEmergency.time}
                                        onChange={(e) => setNewEmergency({...newEmergency, time: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Log Emergency
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Emergency Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Report Emergency</h2>
                        <form onSubmit={handleCreateEmergencyForm}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={newEmergencyForm.name}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newEmergencyForm.phone}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newEmergencyForm.email}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, email: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Property/Area Name</label>
                                    <input
                                        type="text"
                                        value={newEmergencyForm.property_name}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, property_name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newEmergencyForm.location}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Emergency Type</label>
                                    <select
                                        value={newEmergencyForm.emergency_type}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, emergency_type: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="wildlife">Wildlife Emergency</option>
                                        <option value="medical">Medical Emergency</option>
                                        <option value="fire">Fire Emergency</option>
                                        <option value="accident">Accident</option>
                                        <option value="flood">Flood</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newEmergencyForm.description}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        placeholder="Please describe the emergency situation..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newEmergencyForm.date}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, date: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newEmergencyForm.time}
                                        onChange={(e) => setNewEmergencyForm({...newEmergencyForm, time: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default EmergencyList;