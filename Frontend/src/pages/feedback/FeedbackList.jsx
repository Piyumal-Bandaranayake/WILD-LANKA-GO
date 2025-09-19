import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const FeedbackList = () => {
    const { backendUser, user } = useAuthContext();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newFeedback, setNewFeedback] = useState({
        title: '',
        message: '',
        rating: 5,
        category: 'General'
    });

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getFeedbacks();
            setFeedbacks(response.data || []);
        } catch (error) {
            console.error('Failed to fetch feedbacks:', error);
            setError('Failed to load feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFeedback = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createFeedback({
                ...newFeedback,
                username: user?.name || 'Anonymous',
                email: user?.email || '',
                rating: parseInt(newFeedback.rating)
            });
            setShowCreateModal(false);
            setNewFeedback({
                title: '',
                message: '',
                rating: 5,
                category: 'General'
            });
            fetchFeedbacks();
        } catch (error) {
            console.error('Failed to create feedback:', error);
            setError('Failed to submit feedback');
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                await protectedApi.deleteFeedback(id);
                fetchFeedbacks();
            } catch (error) {
                console.error('Failed to delete feedback:', error);
                setError('Failed to delete feedback');
            }
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <span
                key={index}
                className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
                ★
            </span>
        ));
    };

    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role; // Anyone can give feedback
    const isCallOperator = backendUser?.role === 'callOperator';
    const isAdmin = backendUser?.role === 'admin';
    const canManageFeedback = isCallOperator || isAdmin; // Only Call Operators and Admin can manage feedback

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading feedbacks...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Feedback</h1>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Give Feedback
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {feedbacks.map((feedback) => (
                            <div key={feedback._id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">{feedback.title}</h3>
                                        <div className="flex items-center mt-1">
                                            {renderStars(feedback.rating)}
                                            <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {feedback.category}
                                    </span>
                                </div>

                                <p className="text-gray-700 mb-4">{feedback.message}</p>

                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <div>
                                        <p><span className="font-medium">By:</span> {feedback.username}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(feedback.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    {canManageFeedback && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeleteFeedback(feedback._id)}
                                                className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {feedbacks.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No feedback available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Feedback Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Give Feedback</h2>
                        <form onSubmit={handleCreateFeedback}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newFeedback.title}
                                        onChange={(e) => setNewFeedback({...newFeedback, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={newFeedback.category}
                                        onChange={(e) => setNewFeedback({...newFeedback, category: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="General">General</option>
                                        <option value="Service">Service</option>
                                        <option value="Activities">Activities</option>
                                        <option value="Tours">Tours</option>
                                        <option value="Website">Website</option>
                                        <option value="Facilities">Facilities</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rating</label>
                                    <div className="flex gap-2 items-center">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => setNewFeedback({...newFeedback, rating})}
                                                className={`text-2xl ${rating <= newFeedback.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600">({newFeedback.rating}/5)</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Message</label>
                                    <textarea
                                        value={newFeedback.message}
                                        onChange={(e) => setNewFeedback({...newFeedback, message: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="4"
                                        placeholder="Tell us about your experience..."
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
                                    Submit
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

export default FeedbackList;