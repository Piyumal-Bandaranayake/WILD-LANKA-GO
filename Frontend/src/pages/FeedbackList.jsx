import React, { useState, useEffect } from 'react';
import { protectedApi } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

const FeedbackList = () => {
    const { backendUser, user, loading: authLoading } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [activeTab, setActiveTab] = useState('my');

    const [newFeedback, setNewFeedback] = useState({
        message: '',
        feedbackType: '', // 'event' or 'activity'
        eventType: '',
        activityType: '',
        images: []
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        // Only fetch feedbacks when auth is ready and user is authenticated
        if (!authLoading && (backendUser || user)) {
            fetchFeedbacks();
        } else if (!authLoading && !backendUser && !user) {
            // If auth is loaded but no user, set loading to false
            setLoading(false);
            setError('Please log in to view feedback');
        }
    }, [authLoading, backendUser, user]);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching feedbacks...');
            
            // Fetch both public feedback and user's own feedback
            const [publicResponse, myFeedbackResponse] = await Promise.all([
                protectedApi.getFeedbacks(), // Public feedback
                protectedApi.getMyFeedback().catch((error) => {
                    console.log('⚠️ My feedback fetch failed, using empty array:', error);
                    return { data: { data: [] } };
                }) // User's own feedback
            ]);
            
            console.log('📊 Public response:', publicResponse);
            console.log('📊 My feedback response:', myFeedbackResponse);
            
            // Extract data from the nested response structure with better error handling
            const publicFeedbacks = Array.isArray(publicResponse.data?.data) ? publicResponse.data.data : [];
            const myFeedbacks = Array.isArray(myFeedbackResponse.data?.data) ? myFeedbackResponse.data.data : [];
            
            console.log('📋 Public feedbacks:', publicFeedbacks);
            console.log('📋 My feedbacks:', myFeedbacks);
            
            const allFeedbacks = [...publicFeedbacks, ...myFeedbacks];
            
            // Remove duplicates based on _id
            const uniqueFeedbacks = allFeedbacks.filter((feedback, index, self) => 
                index === self.findIndex(f => f._id === feedback._id)
            );
            
            console.log('✅ Final feedbacks:', uniqueFeedbacks);
            setFeedbacks(uniqueFeedbacks);
        } catch (error) {
            console.error('❌ Failed to fetch feedbacks:', error);
            setError('Failed to load feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFeedback = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const isValid = validateForm();
        if (!isValid) {
            setSubmitting(false);
            return;
        }

        try {
            console.log('Submitting feedback with data:', newFeedback);
            console.log('Message value:', newFeedback.message);
            console.log('Message length:', newFeedback.message?.length);

            const formData = new FormData();
            formData.append('username', user?.name || 'Anonymous');
            formData.append('message', newFeedback.message || '');
            formData.append('eventType', newFeedback.eventType || '');
            formData.append('activityType', newFeedback.activityType || '');

            newFeedback.images.forEach((image) => {
                formData.append('images', image);
            });

            // Debug FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await protectedApi.createFeedback(formData);
            console.log('Feedback created successfully:', response);

            setShowCreateModal(false);
            setNewFeedback({
                message: '',
                feedbackType: '',
                eventType: '',
                activityType: '',
                images: []
            });
            setValidationErrors({});
            fetchFeedbacks();
        } catch (error) {
            console.error('Failed to create feedback:', error);
            setError(`Failed to submit feedback: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setNewFeedback({
            ...newFeedback,
            images: [...newFeedback.images, ...files]
        });
    };

    const removeImage = (index) => {
        const newImages = newFeedback.images.filter((_, i) => i !== index);
        setNewFeedback({
            ...newFeedback,
            images: newImages
        });
    };

    const validateForm = () => {
        const errors = {};

        if (!newFeedback.message.trim()) {
            errors.message = 'Feedback message is required';
        } else if (newFeedback.message.trim().length < 10) {
            errors.message = 'Feedback message must be at least 10 characters long';
        } else if (newFeedback.message.trim().length > 1000) {
            errors.message = 'Feedback message must be less than 1000 characters';
        }

        // Check if feedback type is selected
        if (!newFeedback.feedbackType) {
            errors.feedbackType = 'Please select a feedback type (Event or Activity)';
        } else {
            // Only validate the selected type
            if (newFeedback.feedbackType === 'event' && !newFeedback.eventType) {
            errors.eventType = 'Please select an event type';
        }
            if (newFeedback.feedbackType === 'activity' && !newFeedback.activityType) {
            errors.activityType = 'Please select an activity type';
            }
        }

        if (newFeedback.images.length > 5) {
            errors.images = 'You can upload a maximum of 5 images';
        }

        newFeedback.images.forEach((image, index) => {
            if (image.size > 5 * 1024 * 1024) {
                errors.images = `Image ${index + 1} is too large (max 5MB)`;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(image.type)) {
                errors.images = `Image ${index + 1} must be a valid image file (JPEG, PNG, GIF, WebP)`;
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
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

    const handleEditFeedback = (feedback) => {
        setEditingFeedback(feedback);
        setNewFeedback({
            message: feedback.message,
            feedbackType: feedback.eventType ? 'event' : feedback.activityType ? 'activity' : '',
            eventType: feedback.eventType || '',
            activityType: feedback.activityType || '',
            images: []
        });
        setShowEditModal(true);
    };

    const handleUpdateFeedback = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setValidationErrors({});

        if (!validateForm()) {
            setSubmitting(false);
            return;
        }

        try {
            console.log('Updating feedback with data:', newFeedback);
            console.log('Editing feedback ID:', editingFeedback._id);

            const updateData = {
                message: newFeedback.message,
                eventType: newFeedback.eventType,
                activityType: newFeedback.activityType,
            };

            console.log('Update data:', updateData);

            const response = await protectedApi.updateFeedback(editingFeedback._id, updateData);
            console.log('Feedback updated successfully:', response);

            alert('Feedback updated successfully!');
            setShowEditModal(false);
            setEditingFeedback(null);
            setNewFeedback({
                message: '',
                feedbackType: '',
                eventType: '',
                activityType: '',
                images: [],
            });
            setValidationErrors({});
            fetchFeedbacks();
        } catch (error) {
            console.error('Failed to update feedback:', error);
            let errorMessage = error.response?.data?.message || error.message || 'Failed to update feedback';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter feedbacks based on the logged-in user
    const currentUser = user?.name || backendUser?.firstName + ' ' + backendUser?.lastName || 'Anonymous';
    const currentUserId = user?._id || backendUser?._id;
    
    console.log('🔍 Current user info:', { currentUser, currentUserId, user, backendUser });
    
    const myFeedbacks = feedbacks.filter(feedback => {
        // Check by username or userId
        const isMyFeedback = feedback.username === currentUser || 
                           feedback.userId === currentUserId ||
                           feedback.userId?._id === currentUserId;
        console.log('🔍 Feedback ownership check:', { 
            feedbackId: feedback._id, 
            feedbackUsername: feedback.username, 
            feedbackUserId: feedback.userId,
            currentUser, 
            currentUserId, 
            isMyFeedback 
        });
        return isMyFeedback;
    });
    
    // Community feedback should show ALL feedback (including user's own)
    const otherFeedbacks = feedbacks; // Show all feedback in community section
    
    console.log('📊 Filtered feedbacks:', { 
        total: feedbacks.length, 
        myFeedbacks: myFeedbacks.length, 
        communityFeedbacks: otherFeedbacks.length 
    });

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

    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
    const isCallOperator = backendUser?.role === 'callOperator';
    const isAdmin = backendUser?.role === 'admin';
    const canManageFeedback = isCallOperator || isAdmin;

    const FeedbackCard = ({ feedback, canEdit = false, canDelete = false }) => (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Feedback</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(feedback.date || feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {feedback.eventType && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full font-medium shadow-sm">
                                {feedback.eventType}
                            </span>
                        )}
                        {feedback.activityType && (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-medium shadow-sm">
                                {feedback.activityType}
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 leading-relaxed">{feedback.message}</p>
                </div>

                {feedback.images && feedback.images.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">Images ({feedback.images.length})</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feedback.images.filter(image => image && image.trim() !== '').map((image, index) => {
                            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
                            if (baseUrl.endsWith('/api')) {
                                baseUrl = baseUrl.replace('/api', '');
                            }
                            const imageUrl = image && image.startsWith('http') 
                                ? image 
                                : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
                            
                            console.log(`Image ${index + 1}:`, image, '-> URL:', imageUrl);
                            console.log('Base URL before processing:', import.meta.env.VITE_API_BASE_URL);
                            console.log('Base URL after processing:', baseUrl);
                            
                            return (
                                <div key={index} className="relative">
                                    <img
                                        src={imageUrl}
                                        alt={`Feedback image ${index + 1}`}
                                        className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-50"
                                        onClick={() => {
                                            setSelectedImage(imageUrl);
                                            setShowImageModal(true);
                                        }}
                                        onError={(e) => {
                                            console.error('Failed to load image:', imageUrl);
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo=';
                                            e.target.alt = 'Image failed to load';
                                        }}
                                    />
                                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                        {index + 1}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{feedback.username}</span>
                    </div>
                    {(canEdit || canDelete) && (
                        <div className="flex gap-2">
                            {canEdit && (
                                <button
                                    onClick={() => handleEditFeedback(feedback)}
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                            )}
                            {(canDelete || canManageFeedback) && (
                                <button
                                    onClick={() => handleDeleteFeedback(feedback._id)}
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (authLoading || loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">
                            {authLoading ? 'Loading authentication...' : 'Loading feedbacks...'}
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pt-32 pb-16 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
                <div className="container mx-auto px-4">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                            Share Your Experience
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                            Help us improve by sharing your feedback about activities, events, and services. Your voice matters!
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Share Your Feedback
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    activeTab === 'my'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    My Feedback ({myFeedbacks.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    activeTab === 'community'
                                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Community Feedback ({otherFeedbacks.length})
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* My Feedback Section */}
                    {activeTab === 'my' && (
                        <div className="mb-12">
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">My Feedback</h2>
                                            <p className="text-gray-600">Your personal feedback submissions</p>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                        {myFeedbacks.length} {myFeedbacks.length === 1 ? 'Submission' : 'Submissions'}
                                    </div>
                                </div>
                            {myFeedbacks.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {myFeedbacks.map((feedback) => (
                                        <FeedbackCard 
                                            key={feedback._id} 
                                            feedback={feedback} 
                                            canEdit={true} 
                                            canDelete={true} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No feedback yet</h3>
                                    <p className="text-gray-500 mb-6">Share your first experience with us!</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Submit Your First Feedback
                                    </button>
                                </div>
                            )}
                            </div>
                        </div>
                    )}

                    {/* Community Feedback Section */}
                    {activeTab === 'community' && (
                        <div>
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">Community Feedback</h2>
                                            <p className="text-gray-600">What others are saying about their experiences</p>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                        {otherFeedbacks.length} {otherFeedbacks.length === 1 ? 'Review' : 'Reviews'}
                                    </div>
                                </div>
                            {otherFeedbacks.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {otherFeedbacks.map((feedback) => (
                                        <FeedbackCard 
                                            key={feedback._id} 
                                            feedback={feedback} 
                                            canEdit={false} 
                                            canDelete={canManageFeedback} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-dashed border-green-200">
                                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No community feedback yet</h3>
                                    <p className="text-gray-500">Be the first to share your experience!</p>
                                </div>
                            )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Feedback Modal */}
            {showCreateModal && (
                <div className="fixed inset-0  bg-white/50 backdrop-blur-sm bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Share Your Experience</h2>
                                    <p className="text-white text-opacity-90">Help us improve with your feedback</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreateFeedback}>
                            <div className="space-y-4">
                                {/* Feedback Message */}
                                <div>
                                <label className="block text-sm font-medium mb-1">
                                    Feedback Message *
                                    <span className="text-gray-500 text-xs ml-2">
                                    ({newFeedback.message.length}/1000 characters)
                                    </span>
                                </label>
                                <textarea
                                    value={newFeedback.message}
                                    onChange={(e) => {
                                    setNewFeedback({ ...newFeedback, message: e.target.value });
                                    if (validationErrors.message) {
                                        setValidationErrors(prev => ({ ...prev, message: null }));
                                    }
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 ${
                                    validationErrors.message
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    } focus:outline-none focus:ring-2`}
                                    rows="4"
                                    placeholder="Tell us about your experience... (minimum 10 characters)"
                                />
                                {validationErrors.message && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
                                )}
                                </div>

                                {/* Feedback Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">Feedback Type *</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                id="eventType"
                                                name="feedbackType"
                                                value="event"
                                                checked={newFeedback.feedbackType === 'event'}
                                                onChange={(e) => {
                                                    setNewFeedback({ 
                                                        ...newFeedback, 
                                                        feedbackType: e.target.value,
                                                        eventType: '',
                                                        activityType: ''
                                                    });
                                                    setValidationErrors(prev => ({ 
                                                        ...prev, 
                                                        eventType: null, 
                                                        activityType: null 
                                                    }));
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="eventType" className="text-sm font-medium text-gray-700">
                                                Event Feedback
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                id="activityType"
                                                name="feedbackType"
                                                value="activity"
                                                checked={newFeedback.feedbackType === 'activity'}
                                                onChange={(e) => {
                                                    setNewFeedback({ 
                                                        ...newFeedback, 
                                                        feedbackType: e.target.value,
                                                        eventType: '',
                                                        activityType: ''
                                                    });
                                                    setValidationErrors(prev => ({ 
                                                        ...prev, 
                                                        eventType: null, 
                                                        activityType: null 
                                                    }));
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="activityType" className="text-sm font-medium text-gray-700">
                                                Activity Feedback
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* Feedback Type Validation Error */}
                                    {validationErrors.feedbackType && (
                                        <p className="text-red-500 text-sm mt-2">{validationErrors.feedbackType}</p>
                                    )}
                                    
                                    {/* Event Type Dropdown */}
                                    {newFeedback.feedbackType === 'event' && (
                                        <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1">Event Type *</label>
                                    <select
                                    value={newFeedback.eventType}
                                    onChange={(e) => {
                                        setNewFeedback({ ...newFeedback, eventType: e.target.value });
                                        if (validationErrors.eventType) {
                                        setValidationErrors(prev => ({ ...prev, eventType: null }));
                                        }
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 ${
                                        validationErrors.eventType
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    } focus:outline-none focus:ring-2`}
                                    >
                                    <option value="">Select Event Type</option>
                                    <option value="Celebration">Celebration</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Talk">Talk</option>
                                    <option value="Conservation">Conservation</option>
                                    <option value="Other">Other</option>
                                    </select>
                                    {validationErrors.eventType && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.eventType}</p>
                                    )}
                                </div>
                                    )}

                                    {/* Activity Type Dropdown */}
                                    {newFeedback.feedbackType === 'activity' && (
                                        <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1">Activity Type *</label>
                                    <select
                                    value={newFeedback.activityType}
                                    onChange={(e) => {
                                        setNewFeedback({ ...newFeedback, activityType: e.target.value });
                                        if (validationErrors.activityType) {
                                        setValidationErrors(prev => ({ ...prev, activityType: null }));
                                        }
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 ${
                                        validationErrors.activityType
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    } focus:outline-none focus:ring-2`}
                                    >
                                    <option value="">Select Activity Type</option>
                                    <option value="Safari">Safari</option>
                                    <option value="Bird Watching">Bird Watching</option>
                                    <option value="Photography">Photography</option>
                                    <option value="Accommodations">Accommodations</option>
                                    <option value="Other">Other</option>
                                    </select>
                                    {validationErrors.activityType && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.activityType}</p>
                                    )}
                                </div>
                                    )}
                                </div>

                                {/* Image Upload */}
                                <div>
                                <label className="block text-sm font-medium mb-1">
                                    Upload Images (Optional)
                                    <span className="text-gray-500 text-xs ml-2">
                                    ({newFeedback.images.length}/5 images)
                                    </span>
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={(e) => {
                                    handleImageUpload(e);
                                    if (validationErrors.images) {
                                        setValidationErrors(prev => ({ ...prev, images: null }));
                                    }
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 ${
                                    validationErrors.images
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    } focus:outline-none focus:ring-2`}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can upload up to 5 images (max 5MB each). Supported formats: JPEG, PNG, GIF, WebP
                                </p>
                                {validationErrors.images && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.images}</p>
                                )}

                                {newFeedback.images.length > 0 && (
                                    <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">Selected Images:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {newFeedback.images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-20 object-cover rounded border"
                                            />
                                            <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                            ×
                                            </button>
                                        </div>
                                        ))}
                                    </div>
                                    </div>
                                )}
                                </div>
                            </div>

                            {/* Form Buttons */}
                            <div className="flex gap-4 mt-8">
                                <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setValidationErrors({});
                                }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                                >
                                Cancel
                                </button>
                                <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-1 py-3 rounded-xl transition-all duration-200 font-medium ${
                                    submitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white transform hover:scale-105 shadow-lg'
                                }`}
                                >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                            </form>

                        </div>
                    </div>
                </div>
            )}

            {/* Edit Feedback Modal */}
            {showEditModal && editingFeedback && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm  flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Edit Your Feedback</h2>
                                    <p className="text-white text-opacity-90">Update your experience</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleUpdateFeedback}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Feedback Message *
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({newFeedback.message.length}/1000 characters)
                                        </span>
                                    </label>
                                    <textarea
                                        value={newFeedback.message}
                                        onChange={(e) => {
                                            setNewFeedback({...newFeedback, message: e.target.value});
                                            if (validationErrors.message) {
                                                setValidationErrors(prev => ({ ...prev, message: null }));
                                            }
                                        }}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            validationErrors.message 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                        } focus:outline-none focus:ring-2`}
                                        rows="4"
                                        placeholder="Tell us about your experience... (minimum 10 characters)"
                                        required
                                    />
                                    {validationErrors.message && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Event Type</label>
                                        <select
                                            value={newFeedback.eventType}
                                            onChange={(e) => setNewFeedback({...newFeedback, eventType: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Select Event Type</option>
                                            <option value="Celebration">Celebration</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Talk">Talk</option>
                                            <option value="Conservation">Conservation</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Activity Type</label>
                                        <select
                                            value={newFeedback.activityType}
                                            onChange={(e) => setNewFeedback({...newFeedback, activityType: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Select Activity Type</option>
                                            <option value="Safari">Safari</option>
                                            <option value="Bird Watching">Bird Watching</option>
                                            <option value="Photography">Photography</option>
                                            <option value="Accommodations">Accommodations</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Add New Images (Optional)
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({newFeedback.images.length}/5 images)
                                        </span>
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={(e) => {
                                            handleImageUpload(e);
                                            if (validationErrors.images) {
                                                setValidationErrors(prev => ({ ...prev, images: null }));
                                            }
                                        }}
                                        className={`w-full border rounded-lg px-3 py-2 ${
                                            validationErrors.images 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                        } focus:outline-none focus:ring-2`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        You can upload up to 5 images (max 5MB each). Supported formats: JPEG, PNG, GIF, WebP
                                    </p>
                                    {validationErrors.images && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {validationErrors.images}
                                        </p>
                                    )}
                                    
                                    {newFeedback.images.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium mb-2">New Images to Add:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {newFeedback.images.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-20 object-cover rounded border"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingFeedback(null);
                                        setNewFeedback({
                                            message: '',
                                            feedbackType: '',
                                            eventType: '',
                                            activityType: '',
                                            images: []
                                        });
                                        setValidationErrors({});
                                    }}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 py-3 rounded-xl transition-all duration-200 font-medium ${
                                        submitting 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transform hover:scale-105 shadow-lg'
                                    }`}
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Update Feedback
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
                    <div className="relative max-w-4xl max-h-[90vh] p-4">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 bg-white bg-opacity-20 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-30 transition-colors z-10"
                        >
                            ×
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full size image"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default FeedbackList;
