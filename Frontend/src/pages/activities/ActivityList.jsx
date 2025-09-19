import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const ActivityList = () => {
    const { backendUser } = useAuthContext();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);

    const [bookingData, setBookingData] = useState({
        activityId: '',
        date: '',
        participants: 1,
        requestTourGuide: false,
        specialRequests: ''
    });

    const [newActivity, setNewActivity] = useState({
        title: '',
        description: '',
        price: '',
        duration: '',
        maxParticipants: '',
        location: '',
        imageUrl: '',
        availableDates: []
    });

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getActivities();
            setActivities(response.data || []);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
            setError('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createActivity({
                ...newActivity,
                price: parseFloat(newActivity.price),
                maxParticipants: parseInt(newActivity.maxParticipants)
            });
            setShowCreateModal(false);
            setNewActivity({
                title: '',
                description: '',
                price: '',
                duration: '',
                maxParticipants: '',
                location: '',
                imageUrl: '',
                availableDates: []
            });
            fetchActivities();
        } catch (error) {
            console.error('Failed to create activity:', error);
            setError('Failed to create activity');
        }
    };

    const handleDeleteActivity = async (id) => {
        if (window.confirm('Are you sure you want to delete this activity?')) {
            try {
                await protectedApi.deleteActivity(id);
                fetchActivities();
            } catch (error) {
                console.error('Failed to delete activity:', error);
                setError('Failed to delete activity');
            }
        }
    };

    const handleBookActivity = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.bookActivity({
                ...bookingData,
                bookedBy: backendUser?.email || user?.email || 'Anonymous',
                bookedDate: new Date().toISOString(),
                status: 'confirmed',
                totalAmount: selectedActivity.price * bookingData.participants
            });
            setShowBookingModal(false);
            setBookingData({
                activityId: '',
                date: '',
                participants: 1,
                requestTourGuide: false,
                specialRequests: ''
            });
            setSelectedActivity(null);
            alert('Activity booked successfully! Payment confirmation will be sent to your email.');
        } catch (error) {
            console.error('Failed to book activity:', error);
            setError('Failed to book activity');
        }
    };

    const openBookingModal = (activity) => {
        setSelectedActivity(activity);
        setBookingData({
            ...bookingData,
            activityId: activity._id,
            date: '',
            participants: 1,
            requestTourGuide: false,
            specialRequests: ''
        });
        setShowBookingModal(true);
    };

    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
    const isAdmin = backendUser?.role === 'admin';
    const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';

    // Admin can create, edit, and delete activities
    const canManageActivities = isAdmin;
    // Tourists can book activities by date with participant count; can request a tour guide
    const canBookActivities = isTourist;
    // Wildlife Park Officer can view tourist activity bookings
    const canViewBookings = isWildlifeOfficer || isAdmin;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading activities...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Activities</h1>
                        {canManageActivities && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Create Activity
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((activity) => (
                            <div key={activity._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                {activity.imageUrl && (
                                    <img
                                        src={activity.imageUrl}
                                        alt={activity.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                                    <p className="text-gray-600 mb-4">{activity.description}</p>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">Price:</span> ${activity.price}</p>
                                        <p><span className="font-medium">Duration:</span> {activity.duration}</p>
                                        <p><span className="font-medium">Max Participants:</span> {activity.maxParticipants}</p>
                                        <p><span className="font-medium">Location:</span> {activity.location}</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {canBookActivities && (
                                            <button
                                                onClick={() => openBookingModal(activity)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex-1"
                                            >
                                                Book Now
                                            </button>
                                        )}
                                        {canManageActivities && (
                                            <button
                                                onClick={() => handleDeleteActivity(activity._id)}
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

                    {activities.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No activities available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Activity Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Create New Activity</h2>
                        <form onSubmit={handleCreateActivity}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newActivity.title}
                                        onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
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
                                        rows="3"
                                        required
                                    />
                                </div>
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
                                    <label className="block text-sm font-medium mb-1">Image URL</label>
                                    <input
                                        type="url"
                                        value={newActivity.imageUrl}
                                        onChange={(e) => setNewActivity({...newActivity, imageUrl: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Book Activity Modal */}
            {showBookingModal && selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Book Activity</h2>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h3 className="font-medium">{selectedActivity.title}</h3>
                            <p className="text-sm text-gray-600">Price: ${selectedActivity.price} per person</p>
                        </div>
                        <form onSubmit={handleBookActivity}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Activity Date</label>
                                    <input
                                        type="date"
                                        value={bookingData.date}
                                        onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Number of Participants</label>
                                    <input
                                        type="number"
                                        value={bookingData.participants}
                                        onChange={(e) => setBookingData({...bookingData, participants: parseInt(e.target.value)})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        min="1"
                                        max={selectedActivity.maxParticipants}
                                        required
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="requestTourGuide"
                                        checked={bookingData.requestTourGuide}
                                        onChange={(e) => setBookingData({...bookingData, requestTourGuide: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="requestTourGuide" className="text-sm">
                                        Request a Tour Guide (additional fee may apply)
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Special Requests</label>
                                    <textarea
                                        value={bookingData.specialRequests}
                                        onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        placeholder="Any special requirements or requests..."
                                    />
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-blue-800">
                                        Total Amount: ${selectedActivity.price * bookingData.participants}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Payment confirmation will be sent via email
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        setSelectedActivity(null);
                                    }}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Book & Pay
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

export default ActivityList;