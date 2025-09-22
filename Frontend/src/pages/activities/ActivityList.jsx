import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

// Add custom styles for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scale-up {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 0.8s ease-out forwards;
  }

  .animate-scale-up {
    animation: scale-up 0.6s ease-out forwards;
  }

  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    opacity: 0;
  }
  
  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }
  
  .animation-delay-900 {
    animation-delay: 0.9s;
    opacity: 0;
  }

  .card-hover {
    transition: all 0.3s ease;
  }

  .card-hover:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .activity-badge {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

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
            const payload = {
                activityId: bookingData.activityId,
                bookingDate: bookingData.date, // yyyy-mm-dd from input
                numberOfParticipants: bookingData.participants,
                requestTourGuide: bookingData.requestTourGuide,
                preferredDate: bookingData.date,
                paymentMethod: 'Credit Card'
            };

            await protectedApi.bookActivity(payload);
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
            setError(error?.response?.data?.message || 'Failed to book activity');
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

    const canManageActivities = isAdmin;
    const canBookActivities = isTourist;
    const canViewBookings = isWildlifeOfficer || isAdmin;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
                <Navbar />
                <div className="flex-1 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 mx-auto"></div>
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        </div>
                        <p className="mt-6 text-xl text-gray-600 font-medium">Discovering amazing activities...</p>
                        <p className="text-emerald-600">Explore the best of Sri Lanka's wildlife adventures</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Modern Hero Section */}
            <section className="relative h-screen overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"
                        alt="Wildlife Activities"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-emerald-700/70 to-teal-800/80"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="container mx-auto px-6 text-center">
                        <div className="animate-fade-in-up">
                            <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-tight mb-6">
                                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                                    Wildlife
                                </span>
                                <br />
                                <span className="text-white/90 text-4xl md:text-6xl">
                                    Adventures
                                </span>
                            </h1>
                        </div>
                        
                        <div className="animate-fade-in-up animation-delay-300 mb-8">
                            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                                From thrilling wildlife safaris to serene nature walks, discover the best of 
                                Sri Lanka's natural wonders with expert guides.
                            </p>
                        </div>

                        {/* Adventure Types */}
                        <div className="animate-fade-in-up animation-delay-600 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                            <div className="activity-badge rounded-2xl p-4 text-white">
                                <div className="text-2xl mb-2">🦁</div>
                                <div className="font-semibold">Safari Tours</div>
                            </div>
                            <div className="activity-badge rounded-2xl p-4 text-white">
                                <div className="text-2xl mb-2">🐘</div>
                                <div className="font-semibold">Elephant Watching</div>
                            </div>
                            <div className="activity-badge rounded-2xl p-4 text-white">
                                <div className="text-2xl mb-2">🌿</div>
                                <div className="font-semibold">Nature Walks</div>
                            </div>
                            <div className="activity-badge rounded-2xl p-4 text-white">
                                <div className="text-2xl mb-2">📸</div>
                                <div className="font-semibold">Photography Tours</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section className="relative -mt-32 z-10 py-20">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                        <div className="animate-slide-in-left">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Available Activities
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl">
                                Choose from our carefully curated selection of wildlife experiences
                            </p>
                        </div>
                        
                        {canManageActivities && (
                            <div className="animate-fade-in-up animation-delay-300">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 hover:shadow-lg flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Activity
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8 animate-scale-up">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activities.map((activity, index) => (
                            <div 
                                key={activity._id} 
                                className="bg-white rounded-3xl shadow-lg overflow-hidden card-hover border border-gray-100 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
                                        alt={activity.title}
                                        className="w-full h-56 object-cover"
                                    />
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                            ${activity.price}/person
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium text-gray-800">
                                            {activity.duration}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">
                                        {activity.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                        {activity.description}
                                    </p>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">{activity.location}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">Max {activity.maxParticipants} participants</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        {canBookActivities && (
                                            <button
                                                onClick={() => openBookingModal(activity)}
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                            >
                                                Book Adventure
                                            </button>
                                        )}
                                        {canManageActivities && (
                                            <button
                                                onClick={() => handleDeleteActivity(activity._id)}
                                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                            >
                                                Delete Activity
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activities.length === 0 && !loading && (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">No Activities Available</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    We're currently planning exciting new wildlife adventures. 
                                    Check back soon for amazing activities!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Activity Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">Create New Activity</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateActivity} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Activity Title</label>
                                <input
                                    type="text"
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="Enter activity title"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                                <textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                                    rows="4"
                                    placeholder="Describe your activity"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newActivity.price}
                                        onChange={(e) => setNewActivity({ ...newActivity, price: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        placeholder="50.00"
                                        min="0"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={newActivity.duration}
                                        onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        placeholder="3 hours"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newActivity.location}
                                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="Activity location"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Max Participants</label>
                                <input
                                    type="number"
                                    value={newActivity.maxParticipants}
                                    onChange={(e) => setNewActivity({ ...newActivity, maxParticipants: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="20"
                                    min="1"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                >
                                    Create Activity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedActivity && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">Book Adventure</h2>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-100">
                            <h3 className="font-bold text-emerald-800 text-lg">{selectedActivity.title}</h3>
                            <p className="text-emerald-600">{selectedActivity.location} • {selectedActivity.duration}</p>
                        </div>
                        
                        <form onSubmit={handleBookActivity} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={bookingData.touristName}
                                    onChange={(e) => setBookingData({ ...bookingData, touristName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={bookingData.touristEmail}
                                    onChange={(e) => setBookingData({ ...bookingData, touristEmail: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={bookingData.touristPhone}
                                    onChange={(e) => setBookingData({ ...bookingData, touristPhone: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="+94 XX XXX XXXX"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={bookingData.date}
                                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Participants</label>
                                    <input
                                        type="number"
                                        value={bookingData.participants}
                                        onChange={(e) => setBookingData({ ...bookingData, participants: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        min="1"
                                        max={selectedActivity.maxParticipants}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <input
                                    type="checkbox"
                                    id="requestTourGuide"
                                    checked={bookingData.requestTourGuide}
                                    onChange={(e) => setBookingData({ ...bookingData, requestTourGuide: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="requestTourGuide" className="ml-3 text-blue-800 font-medium">
                                    Request Professional Tour Guide (+$20)
                                </label>
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Special Requests</label>
                                <textarea
                                    value={bookingData.specialRequests}
                                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                                    rows="3"
                                    placeholder="Any special requirements or requests..."
                                />
                            </div>
                            
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="flex justify-between items-center text-lg font-bold text-emerald-800">
                                    <span>Total Amount:</span>
                                    <span>${(selectedActivity.price * bookingData.participants + (bookingData.requestTourGuide ? 20 : 0)).toFixed(2)}</span>
                                </div>
                                <div className="text-sm text-emerald-600 mt-1">
                                    ${selectedActivity.price} × {bookingData.participants} participants
                                    {bookingData.requestTourGuide && ' + $20 tour guide'}
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                >
                                    Confirm Booking
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