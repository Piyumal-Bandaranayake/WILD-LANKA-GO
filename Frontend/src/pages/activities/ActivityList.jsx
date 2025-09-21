import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const ActivityList = () => {
    const { backendUser, user } = useAuthContext();
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
        specialRequests: '',
        touristName: '',
        touristEmail: '',
        touristPhone: ''
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
            specialRequests: '',
            touristName: backendUser?.name || user?.name || '',
            touristEmail: backendUser?.email || user?.email || '',
            touristPhone: backendUser?.phone || user?.phone || ''
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
                <div className="flex-1 flex items-center justify-center">
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
        <>
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative h-[50vh] bg-cover bg-center flex items-center justify-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative text-center text-white max-w-3xl">
                    <h1 className="text-5xl font-bold mb-4">Explore Our Activities</h1>
                    <p className="text-lg">
                        From thrilling wildlife safaris to serene nature walks, discover the best of Sri Lanka's natural wonders.
                    </p>
                </div>
            </section>

            {/* Activities Section */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">All Activities</h2>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activities.map((activity) => (
                            <div key={activity._id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                                    <img
                                        src={"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"}
                                        alt={activity.title}
                                        className="w-full h-56 object-cover"
                                    />
                                <div className="p-6">
                                    <h3 className="text-2xl font-semibold text-green-800 mb-3">{activity.title}</h3>
                                    <p className="text-gray-700 mb-4">{activity.description}</p>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium text-gray-800">Price:</span> ${activity.price}</p>
                                        <p><span className="font-medium text-gray-800">Duration:</span> {activity.duration}</p>
                                        <p><span className="font-medium text-gray-800">Max Participants:</span> {activity.maxParticipants}</p>
                                        <p><span className="font-medium text-gray-800">Location:</span> {activity.location}</p>
                                    </div>
                                    <div className="mt-6 flex gap-4">
                                        {canBookActivities && (
                                            <button
                                                onClick={() => openBookingModal(activity)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
                                            >
                                                Book Now
                                            </button>
                                        )}
                                        {canManageActivities && (
                                            <button
                                                onClick={() => handleDeleteActivity(activity._id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activities.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">No activities available at the moment. Please check back later.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">Create New Activity</h2>
                        <form onSubmit={handleCreateActivity}>
                            {/* Form fields... */}
                        </form>
                    </div>
                </div>
            )}

            {showBookingModal && selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1501785888041-af3ba6f60060?q=80&w=1970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
                        }}
                    >
                        <h2 className="text-2xl font-bold mb-6">Book Activity: {selectedActivity.title}</h2>
                        <form onSubmit={handleBookActivity}>
                            <div className="mb-4">
                                <label htmlFor="touristName" className="block text-gray-700 text-sm font-bold mb-2">Your Name:</label>
                                <input
                                    type="text"
                                    id="touristName"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.touristName}
                                    onChange={(e) => setBookingData({ ...bookingData, touristName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="touristEmail" className="block text-gray-700 text-sm font-bold mb-2">Your Email:</label>
                                <input
                                    type="email"
                                    id="touristEmail"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.touristEmail}
                                    onChange={(e) => setBookingData({ ...bookingData, touristEmail: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="touristPhone" className="block text-gray-700 text-sm font-bold mb-2">Your Phone:</label>
                                <input
                                    type="tel"
                                    id="touristPhone"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.touristPhone}
                                    onChange={(e) => setBookingData({ ...bookingData, touristPhone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
                                <input
                                    type="date"
                                    id="date"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.date}
                                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="participants" className="block text-gray-700 text-sm font-bold mb-2">Participants:</label>
                                <input
                                    type="number"
                                    id="participants"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.participants}
                                    onChange={(e) => setBookingData({ ...bookingData, participants: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    id="requestTourGuide"
                                    className="mr-2 leading-tight"
                                    checked={bookingData.requestTourGuide}
                                    onChange={(e) => setBookingData({ ...bookingData, requestTourGuide: e.target.checked })}
                                />
                                <label htmlFor="requestTourGuide" className="text-sm text-gray-700">Request Tour Guide</label>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="specialRequests" className="block text-gray-700 text-sm font-bold mb-2">Special Requests:</label>
                                <textarea
                                    id="specialRequests"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={bookingData.specialRequests}
                                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="mb-4 text-lg font-bold text-gray-800">
                                <p>Price per person: ${selectedActivity.price}</p>
                                <p>Total Amount: ${selectedActivity.price * bookingData.participants}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Confirm Booking
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default ActivityList;