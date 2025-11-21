import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { formatLocation } from '../../utils/formatters';

const EmergencyList = () => {
    const { backendUser, user } = useAuth();
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

    // Validation state for both forms
    const [emergencyErrors, setEmergencyErrors] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [emergencyTouched, setEmergencyTouched] = useState({});
    const [formTouched, setFormTouched] = useState({});
    const [isEmergencyValid, setIsEmergencyValid] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

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
            setError('Failed to load emergency forms');
        }
    };

    // Validation functions
    const validateEmergencyField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'description':
                if (!value.trim()) {
                    error = 'Description is required';
                } else if (value.trim().length < 10) {
                    error = 'Description must be at least 10 characters';
                }
                break;
            case 'location':
                if (!value.trim()) {
                    error = 'Location is required';
                } else if (value.trim().length < 3) {
                    error = 'Location must be at least 3 characters';
                }
                break;
            case 'date':
                if (!value) {
                    error = 'Date is required';
                } else if (new Date(value) > new Date()) {
                    error = 'Date cannot be in the future';
                }
                break;
            case 'time':
                if (!value) {
                    error = 'Time is required';
                }
                break;
            default:
                break;
        }
        
        return error;
    };

    const validateFormField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'name':
                if (!value.trim()) {
                    error = 'Name is required';
                } else if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                    error = 'Name can only contain letters and spaces';
                }
                break;
            case 'phone':
                if (!value.trim()) {
                    error = 'Phone number is required';
                } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value.trim())) {
                    error = 'Please enter a valid phone number';
                }
                break;
            case 'email':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'property_name':
                if (!value.trim()) {
                    error = 'Property name is required';
                } else if (value.trim().length < 2) {
                    error = 'Property name must be at least 2 characters';
                }
                break;
            case 'location':
                if (!value.trim()) {
                    error = 'Location is required';
                } else if (value.trim().length < 3) {
                    error = 'Location must be at least 3 characters';
                }
                break;
            case 'description':
                if (!value.trim()) {
                    error = 'Description is required';
                } else if (value.trim().length < 10) {
                    error = 'Description must be at least 10 characters';
                }
                break;
            case 'date':
                if (!value) {
                    error = 'Date is required';
                } else if (new Date(value) > new Date()) {
                    error = 'Date cannot be in the future';
                }
                break;
            case 'time':
                if (!value) {
                    error = 'Time is required';
                }
                break;
            default:
                break;
        }
        
        return error;
    };

    const validateEmergency = () => {
        const errors = {};
        let isValid = true;
        
        const requiredFields = ['description', 'location', 'date', 'time'];
        requiredFields.forEach(field => {
            const error = validateEmergencyField(field, newEmergency[field]);
            if (error) {
                errors[field] = error;
                isValid = false;
            }
        });
        
        setEmergencyErrors(errors);
        setIsEmergencyValid(isValid);
        return isValid;
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;
        
        const requiredFields = ['name', 'phone', 'email', 'property_name', 'location', 'description', 'date', 'time'];
        requiredFields.forEach(field => {
            const error = validateFormField(field, newEmergencyForm[field]);
            if (error) {
                errors[field] = error;
                isValid = false;
            }
        });
        
        setFormErrors(errors);
        setIsFormValid(isValid);
        return isValid;
    };

    // Input handlers with validation
    const handleEmergencyInputChange = (e) => {
        const { name, value } = e.target;
        setNewEmergency(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Mark field as touched
        setEmergencyTouched(prev => ({
            ...prev,
            [name]: true
        }));
        
        // Validate field in real-time
        const error = validateEmergencyField(name, value);
        setEmergencyErrors(prev => ({
            ...prev,
            [name]: error
        }));
        
        // Validate entire form
        setTimeout(() => validateEmergency(), 100);
    };

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setNewEmergencyForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Mark field as touched
        setFormTouched(prev => ({
            ...prev,
            [name]: true
        }));
        
        // Validate field in real-time
        const error = validateFormField(name, value);
        setFormErrors(prev => ({
            ...prev,
            [name]: error
        }));
        
        // Validate entire form
        setTimeout(() => validateForm(), 100);
    };

    const handleEmergencyBlur = (e) => {
        const { name, value } = e.target;
        setEmergencyTouched(prev => ({
            ...prev,
            [name]: true
        }));
        
        const error = validateEmergencyField(name, value);
        setEmergencyErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleFormBlur = (e) => {
        const { name, value } = e.target;
        setFormTouched(prev => ({
            ...prev,
            [name]: true
        }));
        
        const error = validateFormField(name, value);
        setFormErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleCreateEmergency = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateEmergency()) {
            return;
        }
        
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
            setEmergencyErrors({});
            setEmergencyTouched({});
            setIsEmergencyValid(false);
            fetchEmergencies();
        } catch (error) {
            console.error('Failed to create emergency:', error);
            setError('Failed to create emergency');
        }
    };

    const handleCreateEmergencyForm = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const response = await protectedApi.createEmergencyForm(newEmergencyForm);
            
            // Check if the response indicates success
            if (response.data?.success) {
                // Show success message with priority information
                const priority = response.data.data?.priority || 'medium';
                const alertsSent = response.data.data?.alertsSent || 0;
                
                console.log('Emergency form submitted successfully:', response.data);
                alert(`Emergency form submitted successfully!\n\nPriority: ${priority.toUpperCase()}\nCall operators notified: ${alertsSent}\n\nEmergency response team has been alerted.`);
                
                // Close modal and reset form
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
                setFormErrors({});
                setFormTouched({});
                setIsFormValid(false);
                
                // Refresh the emergency forms list
                fetchEmergencyForms();
            } else {
                // Handle API error response
                const errorMessage = response.data?.message || 'Failed to submit emergency form';
                setError(errorMessage);
                alert(`Error: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Failed to submit emergency form:', error);
            
            // Handle different types of errors
            let errorMessage = 'Failed to submit emergency form';
            
            if (error.response?.data?.success === false) {
                // API returned an error response
                errorMessage = error.response.data.message || errorMessage;
                
                // Handle validation errors
                if (error.response.data.errors) {
                    const validationErrors = error.response.data.errors;
                    setFormErrors(validationErrors);
                    errorMessage = 'Please fix the form errors and try again.';
                }
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid form data. Please check your inputs.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
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
                                            <p><span className="font-medium">Location:</span> {formatLocation(emergency.location)}</p>
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
                                    <label className="block text-sm font-medium mb-1">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={newEmergency.location}
                                        onChange={handleEmergencyInputChange}
                                        onBlur={handleEmergencyBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            emergencyTouched.location && emergencyErrors.location 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : emergencyTouched.location && !emergencyErrors.location
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter emergency location"
                                    />
                                    {emergencyTouched.location && emergencyErrors.location && (
                                        <p className="text-red-500 text-sm mt-1">{emergencyErrors.location}</p>
                                    )}
                                    {emergencyTouched.location && !emergencyErrors.location && newEmergency.location && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid location</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newEmergency.description}
                                        onChange={handleEmergencyInputChange}
                                        onBlur={handleEmergencyBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            emergencyTouched.description && emergencyErrors.description 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : emergencyTouched.description && !emergencyErrors.description
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        rows="3"
                                        required
                                        placeholder="Describe the emergency situation"
                                    />
                                    {emergencyTouched.description && emergencyErrors.description && (
                                        <p className="text-red-500 text-sm mt-1">{emergencyErrors.description}</p>
                                    )}
                                    {emergencyTouched.description && !emergencyErrors.description && newEmergency.description && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid description</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={newEmergency.date}
                                        onChange={handleEmergencyInputChange}
                                        onBlur={handleEmergencyBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            emergencyTouched.date && emergencyErrors.date 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : emergencyTouched.date && !emergencyErrors.date
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {emergencyTouched.date && emergencyErrors.date && (
                                        <p className="text-red-500 text-sm mt-1">{emergencyErrors.date}</p>
                                    )}
                                    {emergencyTouched.date && !emergencyErrors.date && newEmergency.date && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid date</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={newEmergency.time}
                                        onChange={handleEmergencyInputChange}
                                        onBlur={handleEmergencyBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            emergencyTouched.time && emergencyErrors.time 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : emergencyTouched.time && !emergencyErrors.time
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {emergencyTouched.time && emergencyErrors.time && (
                                        <p className="text-red-500 text-sm mt-1">{emergencyErrors.time}</p>
                                    )}
                                    {emergencyTouched.time && !emergencyErrors.time && newEmergency.time && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid time</p>
                                    )}
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
                                    disabled={!isEmergencyValid}
                                    className={`flex-1 py-2 rounded-lg transition-colors ${
                                        !isEmergencyValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700'
                                    } text-white`}
                                >
                                    {!isEmergencyValid ? 'Fix Form Errors First' : 'Log Emergency'}
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
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreateEmergencyForm}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newEmergencyForm.name}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.name && formErrors.name 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.name && !formErrors.name
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                    {formTouched.name && formErrors.name && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                                    )}
                                    {formTouched.name && !formErrors.name && newEmergencyForm.name && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid name</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={newEmergencyForm.phone}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.phone && formErrors.phone 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.phone && !formErrors.phone
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter your phone number"
                                    />
                                    {formTouched.phone && formErrors.phone && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                    )}
                                    {formTouched.phone && !formErrors.phone && newEmergencyForm.phone && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid phone number</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newEmergencyForm.email}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.email && formErrors.email 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.email && !formErrors.email
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter your email address"
                                    />
                                    {formTouched.email && formErrors.email && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                                    )}
                                    {formTouched.email && !formErrors.email && newEmergencyForm.email && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid email</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Property/Area Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="property_name"
                                        value={newEmergencyForm.property_name}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.property_name && formErrors.property_name 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.property_name && !formErrors.property_name
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter property or area name"
                                    />
                                    {formTouched.property_name && formErrors.property_name && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.property_name}</p>
                                    )}
                                    {formTouched.property_name && !formErrors.property_name && newEmergencyForm.property_name && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid property name</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={newEmergencyForm.location}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.location && formErrors.location 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.location && !formErrors.location
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                        placeholder="Enter emergency location"
                                    />
                                    {formTouched.location && formErrors.location && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                                    )}
                                    {formTouched.location && !formErrors.location && newEmergencyForm.location && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid location</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Emergency Type</label>
                                    <select
                                        name="emergency_type"
                                        value={newEmergencyForm.emergency_type}
                                        onChange={handleFormInputChange}
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
                                    <label className="block text-sm font-medium mb-1">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newEmergencyForm.description}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.description && formErrors.description 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.description && !formErrors.description
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        rows="3"
                                        placeholder="Please describe the emergency situation..."
                                        required
                                    />
                                    {formTouched.description && formErrors.description && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                                    )}
                                    {formTouched.description && !formErrors.description && newEmergencyForm.description && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid description</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={newEmergencyForm.date}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.date && formErrors.date 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.date && !formErrors.date
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {formTouched.date && formErrors.date && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                                    )}
                                    {formTouched.date && !formErrors.date && newEmergencyForm.date && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid date</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={newEmergencyForm.time}
                                        onChange={handleFormInputChange}
                                        onBlur={handleFormBlur}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            formTouched.time && formErrors.time 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : formTouched.time && !formErrors.time
                                                ? 'border-green-500 focus:border-green-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {formTouched.time && formErrors.time && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
                                    )}
                                    {formTouched.time && !formErrors.time && newEmergencyForm.time && (
                                        <p className="text-green-500 text-sm mt-1">✓ Valid time</p>
                                    )}
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
                                    disabled={loading || !isFormValid}
                                    className={`flex-1 py-2 rounded-lg transition-colors ${
                                        loading || !isFormValid
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                                >
                                    {loading ? 'Submitting...' : 
                                     !isFormValid ? 'Fix Form Errors First' : 
                                     'Submit Report'}
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
