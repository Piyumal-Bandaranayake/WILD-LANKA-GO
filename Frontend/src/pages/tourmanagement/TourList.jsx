import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const TourList = () => {
    const { backendUser, user } = useAuthContext();
    const [tours, setTours] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    const [newTour, setNewTour] = useState({
        title: '',
        description: '',
        duration: '',
        maxParticipants: '',
        price: '',
        startLocation: '',
        endLocation: '',
        difficulty: 'Easy',
        includes: '',
        excludes: '',
        requirements: '',
        dateFrom: '',
        dateTo: ''
    });

    const [newApplication, setNewApplication] = useState({
        fullName: '',
        email: '',
        phone: '',
        experience: '',
        vehicleType: '',
        licenseNumber: '',
        availability: 'Available',
        skills: '',
        languages: ''
    });

    useEffect(() => {
        fetchTours();
        if (canViewApplications) {
            fetchApplications();
        }
    }, []);

    const fetchTours = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getTours();
            setTours(response.data || []);
        } catch (error) {
            console.error('Failed to fetch tours:', error);
            setError('Failed to load tours');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const response = await protectedApi.getApplications();
            setApplications(response.data || []);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        }
    };

    const handleCreateTour = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createTour({
                ...newTour,
                maxParticipants: parseInt(newTour.maxParticipants),
                price: parseFloat(newTour.price),
                createdBy: user?.name || 'Admin'
            });
            setShowCreateModal(false);
            setNewTour({
                title: '',
                description: '',
                duration: '',
                maxParticipants: '',
                price: '',
                startLocation: '',
                endLocation: '',
                difficulty: 'Easy',
                includes: '',
                excludes: '',
                requirements: '',
                dateFrom: '',
                dateTo: ''
            });
            fetchTours();
        } catch (error) {
            console.error('Failed to create tour:', error);
            setError('Failed to create tour');
        }
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.submitApplication({
                ...newApplication,
                applicationDate: new Date().toISOString(),
                status: 'pending'
            });
            setShowApplicationModal(false);
            setNewApplication({
                fullName: '',
                email: '',
                phone: '',
                experience: '',
                vehicleType: '',
                licenseNumber: '',
                availability: 'Available',
                skills: '',
                languages: ''
            });
            alert('Application submitted successfully!');
        } catch (error) {
            console.error('Failed to submit application:', error);
            setError('Failed to submit application');
        }
    };

    const handleDeleteTour = async (id) => {
        if (window.confirm('Are you sure you want to delete this tour?')) {
            try {
                await protectedApi.deleteTour(id);
                fetchTours();
            } catch (error) {
                console.error('Failed to delete tour:', error);
                setError('Failed to delete tour');
            }
        }
    };

    const handleApproveApplication = async (id) => {
        try {
            await protectedApi.updateApplicationStatus(id, 'approved');
            fetchApplications();
        } catch (error) {
            console.error('Failed to approve application:', error);
            setError('Failed to approve application');
        }
    };

    const handleRejectApplication = async (id) => {
        try {
            await protectedApi.updateApplicationStatus(id, 'rejected');
            fetchApplications();
        } catch (error) {
            console.error('Failed to reject application:', error);
            setError('Failed to reject application');
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getApplicationStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Role-based permissions
    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
    const isTourGuide = backendUser?.role === 'tourGuide';
    const isSafariDriver = backendUser?.role === 'safariDriver';
    const isAdmin = backendUser?.role === 'admin';

    // Admin can create tours, view and manage applications
    const canManageTours = isAdmin;
    // Tourists can book tours
    const canBookTours = isTourist;
    // Tour Guides and Safari Drivers can apply for jobs
    const canApplyForJobs = isTourGuide || isSafariDriver;
    // Admin can view and manage applications
    const canViewApplications = isAdmin;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading tours...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Tour Management</h1>
                        <div className="flex gap-4">
                            {canApplyForJobs && (
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Apply for Job
                                </button>
                            )}
                            {canManageTours && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create Tour
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Tours Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Tours</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tours.map((tour) => (
                                <div key={tour._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-semibold">{tour.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}>
                                                {tour.difficulty}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 mb-4">{tour.description}</p>

                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Duration:</span> {tour.duration}</p>
                                            <p><span className="font-medium">Price:</span> ${tour.price}</p>
                                            <p><span className="font-medium">Max Participants:</span> {tour.maxParticipants}</p>
                                            <p><span className="font-medium">Start:</span> {tour.startLocation}</p>
                                            <p><span className="font-medium">End:</span> {tour.endLocation}</p>
                                            <p><span className="font-medium">Dates:</span> {new Date(tour.dateFrom).toLocaleDateString()} - {new Date(tour.dateTo).toLocaleDateString()}</p>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            {canBookTours && (
                                                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex-1">
                                                    Book Tour
                                                </button>
                                            )}
                                            <button
                                                onClick={() => alert(`Tour Details:\n\nTitle: ${tour.title}\nDescription: ${tour.description}\nDuration: ${tour.duration}\nPrice: $${tour.price}\nMax Participants: ${tour.maxParticipants}\nDifficulty: ${tour.difficulty}\nStart: ${tour.startLocation}\nEnd: ${tour.endLocation}\nIncludes: ${tour.includes}\nExcludes: ${tour.excludes}\nRequirements: ${tour.requirements}\nDates: ${new Date(tour.dateFrom).toLocaleDateString()} - ${new Date(tour.dateTo).toLocaleDateString()}`)}
                                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                                            >
                                                Details
                                            </button>
                                            {canManageTours && (
                                                <button
                                                    onClick={() => handleDeleteTour(tour._id)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {tours.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No tours available</p>
                            </div>
                        )}
                    </div>

                    {/* Applications Section - Only visible to Admin */}
                    {canViewApplications && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Applications</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {applications.map((application) => (
                                    <div key={application._id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-semibold">{application.fullName}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(application.status)}`}>
                                                {application.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">Email:</span> {application.email}</p>
                                            <p><span className="font-medium">Phone:</span> {application.phone}</p>
                                            <p><span className="font-medium">Experience:</span> {application.experience}</p>
                                            <p><span className="font-medium">Vehicle Type:</span> {application.vehicleType}</p>
                                            <p><span className="font-medium">License:</span> {application.licenseNumber}</p>
                                            <p><span className="font-medium">Availability:</span> {application.availability}</p>
                                            <p><span className="font-medium">Skills:</span> {application.skills}</p>
                                            <p><span className="font-medium">Languages:</span> {application.languages}</p>
                                            <p><span className="font-medium">Applied:</span> {new Date(application.applicationDate).toLocaleDateString()}</p>
                                        </div>

                                        {application.status === 'pending' && (
                                            <div className="mt-6 flex gap-2">
                                                <button
                                                    onClick={() => handleApproveApplication(application._id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex-1"
                                                >
                                                    Approve
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
                            </div>

                            {applications.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No applications submitted</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Tour Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Create New Tour</h2>
                        <form onSubmit={handleCreateTour}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newTour.title}
                                        onChange={(e) => setNewTour({...newTour, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration</label>
                                    <input
                                        type="text"
                                        value={newTour.duration}
                                        onChange={(e) => setNewTour({...newTour, duration: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="e.g., 2 days"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Participants</label>
                                    <input
                                        type="number"
                                        value={newTour.maxParticipants}
                                        onChange={(e) => setNewTour({...newTour, maxParticipants: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newTour.price}
                                        onChange={(e) => setNewTour({...newTour, price: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Location</label>
                                    <input
                                        type="text"
                                        value={newTour.startLocation}
                                        onChange={(e) => setNewTour({...newTour, startLocation: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Location</label>
                                    <input
                                        type="text"
                                        value={newTour.endLocation}
                                        onChange={(e) => setNewTour({...newTour, endLocation: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date From</label>
                                    <input
                                        type="date"
                                        value={newTour.dateFrom}
                                        onChange={(e) => setNewTour({...newTour, dateFrom: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date To</label>
                                    <input
                                        type="date"
                                        value={newTour.dateTo}
                                        onChange={(e) => setNewTour({...newTour, dateTo: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                                    <select
                                        value={newTour.difficulty}
                                        onChange={(e) => setNewTour({...newTour, difficulty: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newTour.description}
                                        onChange={(e) => setNewTour({...newTour, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">What's Included</label>
                                    <textarea
                                        value={newTour.includes}
                                        onChange={(e) => setNewTour({...newTour, includes: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="2"
                                        placeholder="e.g., Transportation, Meals, Guide"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">What's Excluded</label>
                                    <textarea
                                        value={newTour.excludes}
                                        onChange={(e) => setNewTour({...newTour, excludes: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="2"
                                        placeholder="e.g., Personal expenses, Insurance"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Requirements</label>
                                    <textarea
                                        value={newTour.requirements}
                                        onChange={(e) => setNewTour({...newTour, requirements: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="2"
                                        placeholder="e.g., Good physical fitness, Swimming ability"
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
                                    Create Tour
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Job Application Modal */}
            {showApplicationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Apply for Tour Guide/Driver Position</h2>
                        <form onSubmit={handleSubmitApplication}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={newApplication.fullName}
                                        onChange={(e) => setNewApplication({...newApplication, fullName: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newApplication.email}
                                        onChange={(e) => setNewApplication({...newApplication, email: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={newApplication.phone}
                                        onChange={(e) => setNewApplication({...newApplication, phone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                                    <input
                                        type="text"
                                        value={newApplication.vehicleType}
                                        onChange={(e) => setNewApplication({...newApplication, vehicleType: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="e.g., Safari Jeep, Bus"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">License Number</label>
                                    <input
                                        type="text"
                                        value={newApplication.licenseNumber}
                                        onChange={(e) => setNewApplication({...newApplication, licenseNumber: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Availability</label>
                                    <select
                                        value={newApplication.availability}
                                        onChange={(e) => setNewApplication({...newApplication, availability: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Partial">Partially Available</option>
                                        <option value="Unavailable">Currently Unavailable</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Experience</label>
                                    <textarea
                                        value={newApplication.experience}
                                        onChange={(e) => setNewApplication({...newApplication, experience: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        placeholder="Describe your experience in tourism/driving..."
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Skills</label>
                                    <textarea
                                        value={newApplication.skills}
                                        onChange={(e) => setNewApplication({...newApplication, skills: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="2"
                                        placeholder="e.g., Wildlife knowledge, Photography, First Aid"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Languages</label>
                                    <input
                                        type="text"
                                        value={newApplication.languages}
                                        onChange={(e) => setNewApplication({...newApplication, languages: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="e.g., English, Sinhala, Tamil"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowApplicationModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Submit Application
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

export default TourList;