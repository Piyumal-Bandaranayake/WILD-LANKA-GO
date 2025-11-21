import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/api';
import { 
  validateBookingForm, 
  validateActivityForm,
  getValidationClasses, 
  getValidationMessageClasses 
} from '../../utils/formValidation';

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

// Safely format location which may be an object { venue, address }
const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const venue = location.venue || location.name || '';
    const address = location.address || location.street || '';
    const combined = [venue, address].filter(Boolean).join(', ');
    return combined || JSON.stringify(location);
  }
  return String(location);
};

const ActivityList = () => {
    const { backendUser, user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [selectedActivityType, setSelectedActivityType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get today's date in YYYY-MM-DD format for date input min attribute
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [editingActivity, setEditingActivity] = useState(null);

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

    // Validation state management
    const [validationState, setValidationState] = useState({
        touristName: { isValid: true, message: '', severity: 'info' },
        touristEmail: { isValid: true, message: '', severity: 'info' },
        touristPhone: { isValid: true, message: '', severity: 'info' },
        date: { isValid: true, message: '', severity: 'info' },
        participants: { isValid: true, message: '', severity: 'info' },
        specialRequests: { isValid: true, message: '', severity: 'info' },
        tourGuide: { isValid: true, message: '', severity: 'info' }
    });

    const [touchedFields, setTouchedFields] = useState({
        touristName: false,
        touristEmail: false,
        touristPhone: false,
        date: false,
        participants: false,
        specialRequests: false,
        requestTourGuide: false
    });

    const [formValidation, setFormValidation] = useState({
        isValid: false,
        hasErrors: false,
        hasWarnings: false
    });

    // Validation handlers
    const handleFieldChange = (fieldName, value) => {
        // Update booking data
        setBookingData(prev => ({ ...prev, [fieldName]: value }));
        
        // Mark field as touched
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        
        // Perform real-time validation
        validateField(fieldName, value);
    };

    const validateField = (fieldName, value) => {
        const validation = validateBookingForm(
            { ...bookingData, [fieldName]: value }, 
            selectedActivity, 
            0 // Current bookings count - you might want to fetch this
        );
        
        setValidationState(prev => ({
            ...prev,
            [fieldName]: validation.validations[fieldName]
        }));
        
        // Update overall form validation
        setFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
    };

    const validateForm = () => {
        const validation = validateBookingForm(bookingData, selectedActivity, 0);
        
        setValidationState(validation.validations);
        setFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
        
        return validation.isValid;
    };

    const resetValidation = () => {
        setValidationState({
            touristName: { isValid: true, message: '', severity: 'info' },
            touristEmail: { isValid: true, message: '', severity: 'info' },
            touristPhone: { isValid: true, message: '', severity: 'info' },
            date: { isValid: true, message: '', severity: 'info' },
            participants: { isValid: true, message: '', severity: 'info' },
            specialRequests: { isValid: true, message: '', severity: 'info' },
            tourGuide: { isValid: true, message: '', severity: 'info' }
        });
        
        setTouchedFields({
            touristName: false,
            touristEmail: false,
            touristPhone: false,
            date: false,
            participants: false,
            specialRequests: false,
            requestTourGuide: false
        });
        
        setFormValidation({
            isValid: false,
            hasErrors: false,
            hasWarnings: false
        });
    };

    // Activity form validation handlers
    const handleActivityFieldChange = (fieldName, value) => {
        // Update activity data
        setNewActivity(prev => ({ ...prev, [fieldName]: value }));
        
        // Mark field as touched
        setActivityTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        
        // Perform real-time validation
        validateActivityField(fieldName, value);
    };

    const validateActivityField = (fieldName, value) => {
        const validation = validateActivityForm(
            { ...newActivity, [fieldName]: value }
        );
        
        setActivityValidationState(prev => ({
            ...prev,
            [fieldName]: validation.validations[fieldName]
        }));
        
        // Update overall form validation
        setActivityFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
    };

    const validateActivityFormComplete = () => {
        const validation = validateActivityForm(newActivity);
        
        setActivityValidationState(validation.validations);
        setActivityFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
        
        return validation.isValid;
    };

    const resetActivityValidation = () => {
        setActivityValidationState({
            name: { isValid: true, message: '', severity: 'info' },
            description: { isValid: true, message: '', severity: 'info' },
            price: { isValid: true, message: '', severity: 'info' },
            duration: { isValid: true, message: '', severity: 'info' },
            location: { isValid: true, message: '', severity: 'info' },
            activityType: { isValid: true, message: '', severity: 'info' },
            availableSlots: { isValid: true, message: '', severity: 'info' }
        });
        setActivityTouchedFields({
            name: false,
            description: false,
            price: false,
            duration: false,
            location: false,
            activityType: false,
            availableSlots: false
        });
        setActivityFormValidation({
            isValid: false,
            hasErrors: false,
            hasWarnings: false
        });
    };

    // Helper function to get validation classes for activity fields
    const getActivityValidationClasses = (fieldName) => {
        const validation = activityValidationState[fieldName];
        const touched = activityTouchedFields[fieldName];
        
        if (!touched || !validation) {
            return 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500';
        }
        
        if (validation.severity === 'error') {
            return 'border-red-500 focus:border-red-500 focus:ring-red-500';
        }
        
        if (validation.severity === 'success') {
            return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        }
        
        if (validation.severity === 'warning') {
            return 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500';
        }
        
        return 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500';
    };

    const [newActivity, setNewActivity] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        availableSlots: '',
        location: '',
        activityType: '',
        requirements: ''
    });

    // Activity form validation state
    const [activityValidationState, setActivityValidationState] = useState({
        name: { isValid: true, message: '', severity: 'info' },
        description: { isValid: true, message: '', severity: 'info' },
        price: { isValid: true, message: '', severity: 'info' },
        duration: { isValid: true, message: '', severity: 'info' },
        location: { isValid: true, message: '', severity: 'info' },
        activityType: { isValid: true, message: '', severity: 'info' },
        availableSlots: { isValid: true, message: '', severity: 'info' }
    });

    const [activityTouchedFields, setActivityTouchedFields] = useState({
        name: false,
        description: false,
        price: false,
        duration: false,
        location: false,
        activityType: false,
        availableSlots: false
    });

    const [activityFormValidation, setActivityFormValidation] = useState({
        isValid: false,
        hasErrors: false,
        hasWarnings: false
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getActivities();
            const responseData = response.data;
            console.log('🔍 Activities API Response:', responseData);
            
            // Handle the correct API response format
            let activitiesData = [];
            if (responseData?.success && responseData?.data?.activities && Array.isArray(responseData.data.activities)) {
                activitiesData = responseData.data.activities; // Correct format
                console.log('✅ Using correct API format for activities:', activitiesData.length, 'items');
            } else if (Array.isArray(responseData)) {
                activitiesData = responseData; // Direct array format
                console.log('✅ Using direct array format for activities:', activitiesData.length, 'items');
            } else if (responseData?.activities && Array.isArray(responseData.activities)) {
                activitiesData = responseData.activities; // Alternative format
                console.log('✅ Using alternative format for activities:', activitiesData.length, 'items');
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                activitiesData = responseData.data; // Legacy format
                console.log('✅ Using legacy format for activities:', activitiesData.length, 'items');
            } else {
                console.warn('⚠️ Unexpected activities response format:', responseData);
                console.log('Response keys:', Object.keys(responseData || {}));
                console.log('Data keys:', Object.keys(responseData?.data || {}));
            }
            
            setActivities(activitiesData);
            setFilteredActivities(activitiesData);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
            setError('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    // Filter activities based on selected type
    const filterActivities = (type) => {
        if (!type) {
            setFilteredActivities(activities);
        } else {
            const filtered = activities.filter(activity => 
                activity.category === type || activity.activityType === type
            );
            setFilteredActivities(filtered);
        }
    };

    // Handle activity type filter change
    const handleActivityTypeFilter = (type) => {
        setSelectedActivityType(type);
        filterActivities(type);
    };

    const openViewModal = (activity) => {
        setSelectedActivity(activity);
        setShowViewModal(true);
    };

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        const isValid = validateActivityFormComplete();
        if (!isValid) {
            alert('Please fix the form errors before submitting.');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Prepare form data for image upload
            const formData = new FormData();
            formData.append('title', newActivity.name);
            formData.append('description', newActivity.description);
            formData.append('location', newActivity.location);
            formData.append('duration', parseInt(newActivity.duration) || 1);
            formData.append('category', newActivity.activityType);
            formData.append('price', parseFloat(newActivity.price) || 0);
            formData.append('maxParticipants', parseInt(newActivity.availableSlots) || 1);
            formData.append('dailySlots', parseInt(newActivity.availableSlots) || 1);
            
            formData.append('requirements', newActivity.requirements || '');
            
            if (selectedImage) {
                formData.append('imageUrl', selectedImage);
            }
            
            // Log activity creation for debugging
            console.log('Creating activity with data:', Object.fromEntries(formData));
            await protectedApi.createActivity(formData);
            
            setShowCreateModal(false);
            setNewActivity({
                name: '',
                description: '',
                price: '',
                duration: '',
                availableSlots: '',
                location: '',
                activityType: '',
                requirements: ''
            });
            setSelectedImage(null);
            setImagePreview(null);
            resetActivityValidation();
            fetchActivities();
            alert('Activity created successfully!');
        } catch (error) {
            console.error('Failed to create activity:', error);
            setError('Failed to create activity: ' + (error.response?.data?.message || error.message));
            alert('Failed to create activity: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditActivity = (activity) => {
        setEditingActivity(activity);
        setNewActivity({
            name: activity.title || activity.name || '',
            description: activity.description || '',
            price: activity.price || '',
            duration: activity.duration || '',
            availableSlots: activity.maxParticipants || activity.availableSlots || activity.capacity || '',
            location: activity.location || '',
            activityType: activity.category || activity.activityType || '',
            requirements: Array.isArray(activity.requirements) ? activity.requirements.join(', ') : (activity.requirements || '')
        });
        setShowEditModal(true);
    };

    const handleUpdateActivity = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Prepare form data for image upload
            const formData = new FormData();
            formData.append('title', newActivity.name); // Backend expects 'title'
            formData.append('description', newActivity.description);
            formData.append('location', newActivity.location);
            formData.append('duration', parseInt(newActivity.duration) || 1); // Convert to number
            formData.append('category', newActivity.activityType); // Backend expects 'category'
            formData.append('price', parseFloat(newActivity.price) || 0);
            formData.append('maxParticipants', parseInt(newActivity.availableSlots) || 1); // Backend expects 'maxParticipants'
            formData.append('dailySlots', parseInt(newActivity.availableSlots) || 1); // Also set dailySlots
            
            formData.append('requirements', newActivity.requirements || '');
            
            if (selectedImage) {
                formData.append('imageUrl', selectedImage); // Backend expects 'imageUrl'
            }
            
            // Log activity update for debugging
            console.log('Updating activity with data:', Object.fromEntries(formData));
            const updateResponse = await protectedApi.updateActivity(editingActivity._id, formData);
            console.log('✅ Update response:', updateResponse);
            
            setShowEditModal(false);
            setEditingActivity(null);
            setNewActivity({
                name: '',
                description: '',
                price: '',
                duration: '',
                availableSlots: '',
                location: '',
                activityType: '',
                requirements: ''
            });
            setSelectedImage(null);
            setImagePreview(null);
            
            // Force refresh activities
            console.log('🔄 Refreshing activities after update...');
            await fetchActivities();
            alert('Activity updated successfully!');
        } catch (error) {
            console.error('Failed to update activity:', error);
            setError('Failed to update activity: ' + (error.response?.data?.message || error.message));
            alert('Failed to update activity: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
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
        console.log('=== BOOKING ACTIVITY STARTED ===');
        console.log('Selected activity:', selectedActivity);
        console.log('Booking data:', bookingData);
        
        // Double-check authentication before proceeding
        if (!isLoggedIn || !isTourist) {
            alert('Authentication error: Only logged-in tourists can book activities.');
            return;
        }
        
        // Validate form before submission
        if (!validateForm()) {
            alert('Please fix the validation errors before submitting the form.');
            return;
        }
        
        try {
            // First, check available slots before booking
            console.log('Checking available slots before booking...');
            console.log('Slot check parameters:', {
                activityId: bookingData.activityId,
                date: bookingData.date,
                participants: bookingData.participants
            });
            
            const slotCheck = await protectedApi.checkAvailableSlots({
                activityId: bookingData.activityId,
                date: bookingData.date,
                participants: bookingData.participants
            });
            console.log('Pre-booking slot check response:', slotCheck);
            console.log('Slot check data:', slotCheck.data);

            // Handle the nested response structure
            const slotData = slotCheck.data?.data || slotCheck.data;
            console.log('Processed slot data:', slotData);

            if (!slotData || !slotData.canBook) {
                const errorMessage = slotData?.message || 'Slot check failed';
                console.error('Slot check failed:', errorMessage);
                console.log('Slot check details:', {
                    canBook: slotData?.canBook,
                    availableSlots: slotData?.availableSlots,
                    requestedParticipants: slotData?.requestedParticipants,
                    message: slotData?.message
                });
                throw new Error(errorMessage);
            }

            // Calculate total amount
            const baseAmount = selectedActivity.price * bookingData.participants;
            const guideFee = bookingData.requestTourGuide ? 5000 : 0;
            const totalAmount = baseAmount + guideFee;

            // Prepare booking data with correct field mapping
            const bookingRequestData = {
                activityId: bookingData.activityId,
                userId: backendUser?._id || user?._id, // Add user ID
                numberOfParticipants: bookingData.participants, // Map participants to numberOfParticipants
                preferredDate: bookingData.date, // Map date to preferredDate
                requestTourGuide: bookingData.requestTourGuide,
                totalAmount: totalAmount,
                touristName: bookingData.touristName,
                touristEmail: bookingData.touristEmail,
                touristPhone: bookingData.touristPhone,
                specialRequests: bookingData.specialRequests,
                bookingDate: new Date().toISOString() // Add booking date
            };

            console.log('Sending booking request:', bookingRequestData);
            const result = await protectedApi.bookActivity(bookingRequestData);
            console.log('Booking result:', result);
            console.log('Booking data structure:', result.data);
            console.log('Booking object:', result.data?.data?.booking);
            
            // Verify slot reduction after booking
            console.log('Verifying slot reduction after booking...');
            const slotVerification = await protectedApi.verifySlotReduction({
                activityId: bookingData.activityId,
                date: bookingData.date
            });
            console.log('Post-booking slot verification:', slotVerification.data);
            
            // Check if booking was created successfully
            if (!result.data?.data?.booking?.bookingId) {
                console.error('Booking creation failed - no bookingId returned');
                console.error('Full result:', JSON.stringify(result, null, 2));
                throw new Error('Booking creation failed - no bookingId returned');
            }
            
            // Start Stripe Checkout for this booking's payment
            try {
                const customerName = bookingData.touristName || backendUser?.name || user?.name || 'Anonymous';
                const customerEmail = bookingData.touristEmail || backendUser?.email || user?.email || '';
                const activityTitle = selectedActivity.title || selectedActivity.name;
                
                console.log('Creating checkout session with bookingId:', result.data.data.booking.bookingId);
                
                const resp = await fetch(`${API_BASE_URL}/bookings/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        bookingId: result.data.data.booking.bookingId,
                        amount: totalAmount,
                        currency: 'lkr',
                        customerName,
                        customerEmail,
                        activityTitle,
                        bookingDate: bookingData.date,
                        participants: bookingData.participants
                    })
                });
                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    throw new Error(err?.message || 'Failed to initiate booking payment');
                }
                const data = await resp.json();
                const url = data?.data?.url || data?.url;
                if (!url) throw new Error('No checkout URL');

                setShowBookingModal(false);
                window.location.href = url;
            } catch (stripeErr) {
                alert(stripeErr.message || 'Could not start booking payment');
            }
        } catch (error) {
            console.error('=== BOOKING FAILED ===');
            console.error('Failed to book activity:', error);
            console.error('Error details:', error.response?.data || error.message);
            
            // Handle specific error cases
            let errorMessage = 'Failed to book activity';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Check if it's a slot availability error
            const errorData = error.response?.data?.data || error.response?.data;
            if (errorData?.availableSlots !== undefined) {
                const { availableSlots, requestedParticipants, date } = errorData;
                errorMessage = `Not enough slots available for ${date}. Only ${availableSlots} slots remaining, but ${requestedParticipants} participants requested. Please select a different date or reduce the number of participants.`;
            }
            
            setError(errorMessage);
            alert(errorMessage);
        }
    };

    const openBookingModal = (activity) => {
        // Check if user is logged in and is a tourist
        if (!isLoggedIn) {
            alert('Please log in to book activities. Only registered tourists can make bookings.');
            return;
        }
        
        if (!isTourist) {
            alert('Only tourists can book activities. Admin and staff users cannot make bookings.');
            return;
        }

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
        resetValidation();
        setShowBookingModal(true);
    };

    const isTourist = backendUser?.role === 'tourist';
    const isAdmin = backendUser?.role === 'admin';
    const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';
    const isLoggedIn = !!backendUser && !!backendUser._id;

    const canManageActivities = isAdmin;
    const canBookActivities = isLoggedIn && isTourist; // Only logged-in tourists can book
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
                        src="/src/assets/safari.jpg"
                        alt="Wildlife Activities"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-emerald-700/30 to-teal-800/35"></div>
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
                             <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                 Available Activities
                            </h2>
                        </div>
                        
                        {/* Activity Type Filter */}
                        <div className="animate-fade-in-up animation-delay-200">
                            <div className="flex items-center gap-4">
                                <label className="text-white font-semibold text-sm">Filter by Type:</label>
                                <select
                                    value={selectedActivityType}
                                    onChange={(e) => handleActivityTypeFilter(e.target.value)}
                                    className="bg-white/90 backdrop-blur-sm border border-white/30 text-gray-800 px-4 py-2 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-lg"
                                >
                                    <option value="">All Activities</option>
                                    <option value="safari">Safari</option>
                                    <option value="wildlife-tour">Wildlife Tour</option>
                                    <option value="bird-watching">Bird Watching</option>
                                    <option value="nature-walk">Nature Walk</option>
                                    <option value="photography">Photography</option>
                                    <option value="adventure">Adventure</option>
                                    <option value="educational">Educational</option>
                                </select>
                                {selectedActivityType && (
                                    <button
                                        onClick={() => handleActivityTypeFilter('')}
                                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 backdrop-blur-sm border border-white/30"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {(Array.isArray(filteredActivities) ? filteredActivities : []).map((activity, index) => (
                            <div 
                                key={activity._id} 
                                className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl overflow-hidden border border-gray-100/50 animate-fade-in-up transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] backdrop-blur-sm"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Image Container with Modern Overlay */}
                                <div className="relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
                                    <img
                                        src={activity.imageUrl || 
                                            (activity.images && activity.images.length > 0 
                                                ? `http://localhost:5001${activity.images[0]}` 
                                                : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop")
                                        }
                                        alt={activity.title || activity.name}
                                        className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";
                                        }}
                                    />
                                    
                                    {/* Price Badge - Modern Design */}
                                    <div className="absolute top-4 right-4 z-20">
                                         <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border border-white/20">
                                             <span className="text-xs opacity-90">from</span>
                                             <div className="text-sm font-black">LKR {activity.price}</div>
                                             <span className="text-xs opacity-90">/person</span>
                                        </div>
                                    </div>
                                    
                                    {/* Duration Badge - Enhanced */}
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold text-gray-800 shadow-lg border border-white/30">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {typeof activity.duration === 'number' ? `${activity.duration} hours` : activity.duration}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                                </div>
                                
                                {/* Content Section - Modern Layout */}
                                <div className="p-6 space-y-4">
                                    {/* Title with Modern Typography */}
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-300">
                                            {activity.title || activity.name}
                                        </h3>
                                        <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                                        {activity.description}
                                    </p>
                                    
                                    {/* Info Icons - Enhanced Design */}
                                    <div className="space-y-3 py-2">
                                        <div className="flex items-center gap-3 text-gray-700 group/item">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{formatLocation(activity.location)}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-gray-700 group/item">
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">Max {activity.maxParticipants || activity.capacity} participants</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons - Modern Design */}
                                    <div className="pt-4 space-y-3">
                                        <button
                                            onClick={() => openViewModal(activity)}
                                            className="w-full bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-gray-800 px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-emerald-200 hover:text-emerald-700 shadow-sm hover:shadow-md group/btn"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </span>
                                        </button>
                                        
                                        {canBookActivities && (
                                            <button
                                                onClick={() => openBookingModal(activity)}
                                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group/btn"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Book Adventure
                                                </span>
                                            </button>
                                        )}
                                        
                                        {/* Show message for logged-in non-tourists */}
                                        {isLoggedIn && !isTourist && !canManageActivities && (
                                            <div className="w-full bg-gray-100 text-gray-600 px-4 py-3 rounded-xl font-medium text-center text-sm border border-gray-200">
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Only tourists can book activities
                                                </span>
                                            </div>
                                        )}
                                        
                                        {canManageActivities && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleEditActivity(activity)}
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg group/btn"
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteActivity(activity._id)}
                                                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg group/btn"
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredActivities.length === 0 && !loading && (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                    {selectedActivityType ? `No ${selectedActivityType.replace('-', ' ')} Activities Found` : 'No Activities Available'}
                                </h3>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {selectedActivityType 
                                        ? `No activities found for "${selectedActivityType.replace('-', ' ')}" type. Try selecting a different filter or view all activities.`
                                        : "We're currently planning exciting new wildlife adventures. Check back soon for amazing activities!"
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Activity Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Create New Activity</h3>
                                        <p className="text-emerald-100 text-sm">Add a new wildlife adventure</p>
                                    </div>
                                </div>
                            <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                        resetActivityValidation();
                                    }}
                                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleCreateActivity} className="p-6 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Activity Image</label>
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="text-emerald-600 font-medium">Upload Activity Image</span>
                                            <span className="text-sm text-gray-500 mt-1">Click to browse or drag & drop</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-40 object-cover rounded-xl shadow-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Activity Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={newActivity.name}
                                    onChange={(e) => handleActivityFieldChange('name', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                                        activityTouchedFields.name 
                                            ? activityValidationState.name.severity === 'error' 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                : activityValidationState.name.severity === 'success'
                                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                                                    : 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
                                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                                    }`}
                                    placeholder="Enter activity name"
                                />
                                {activityTouchedFields.name && activityValidationState.name.message && (
                                    <div className={getValidationMessageClasses(activityValidationState.name.severity)}>
                                        {activityValidationState.name.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newActivity.description}
                                    onChange={(e) => handleActivityFieldChange('description', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                                        activityTouchedFields.description 
                                            ? activityValidationState.description.severity === 'error' 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                : activityValidationState.description.severity === 'success'
                                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                                                    : 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
                                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                                    }`}
                                    rows="3"
                                    placeholder="Describe the activity in detail..."
                                />
                                {activityTouchedFields.description && activityValidationState.description.message && (
                                    <div className={getValidationMessageClasses(activityValidationState.description.severity)}>
                                        {activityValidationState.description.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Price & Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR)</label>
                                    <input
                                        type="number"
                                        value={newActivity.price}
                                        onChange={(e) => handleActivityFieldChange('price', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="5000"
                                    />
                                    {activityTouchedFields.price && activityValidationState.price.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.price.severity)}>
                                            {activityValidationState.price.message}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={newActivity.duration}
                                        onChange={(e) => handleActivityFieldChange('duration', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="3 hours"
                                    />
                                    {activityTouchedFields.duration && activityValidationState.duration.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.duration.severity)}>
                                            {activityValidationState.duration.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newActivity.location}
                                    onChange={(e) => handleActivityFieldChange('location', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        placeholder="Enter location"
                                    />
                                    {activityTouchedFields.location && activityValidationState.location.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.location.severity)}>
                                            {activityValidationState.location.message}
                                        </div>
                                    )}
                            </div>
                            
                            {/* Type & Slots */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Type</label>
                                    <select
                                        value={newActivity.activityType}
                                        onChange={(e) => handleActivityFieldChange('activityType', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="safari">Safari</option>
                                        <option value="wildlife-tour">Wildlife Tour</option>
                                        <option value="bird-watching">Bird Watching</option>
                                        <option value="nature-walk">Nature Walk</option>
                                        <option value="photography">Photography</option>
                                        <option value="adventure">Adventure</option>
                                        <option value="educational">Educational</option>
                                    </select>
                                    {activityTouchedFields.activityType && activityValidationState.activityType.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.activityType.severity)}>
                                            {activityValidationState.activityType.message}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
                                    <input
                                        type="number"
                                        value={newActivity.availableSlots}
                                        onChange={(e) => handleActivityFieldChange('availableSlots', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="20"
                                    />
                                    {activityTouchedFields.availableSlots && activityValidationState.availableSlots.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.availableSlots.severity)}>
                                            {activityValidationState.availableSlots.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                        resetActivityValidation();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none ${
                                        activityFormValidation.isValid 
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    }`}
                                    disabled={isSubmitting || !activityFormValidation.isValid}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create Activity'
                                    )}
                                </button>
                                </div>
                        </form>
                            </div>
                </div>
            )}

            {/* Edit Activity Modal */}
            {showEditModal && editingActivity && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                            <div>
                                        <h3 className="text-xl font-bold">Edit Activity</h3>
                                        <p className="text-emerald-100 text-sm">Update activity details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingActivity(null);
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleUpdateActivity} className="p-6 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Activity Image</label>
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="edit-image-upload"
                                        />
                                        <label
                                            htmlFor="edit-image-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="text-emerald-600 font-medium">Update Activity Image</span>
                                            <span className="text-sm text-gray-500 mt-1">Click to browse or drag & drop</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-40 object-cover rounded-xl shadow-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Activity Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={newActivity.name}
                                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                    placeholder="Enter activity name"
                                />
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 resize-none"
                                    rows="3"
                                    placeholder="Describe the activity in detail..."
                                />
                            </div>
                            
                            {/* Price & Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR)</label>
                                    <input
                                        type="number"
                                        value={newActivity.price}
                                        onChange={(e) => handleActivityFieldChange('price', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="5000"
                                    />
                                    {activityTouchedFields.price && activityValidationState.price.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.price.severity)}>
                                            {activityValidationState.price.message}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={newActivity.duration}
                                        onChange={(e) => handleActivityFieldChange('duration', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="3 hours"
                                    />
                                    {activityTouchedFields.duration && activityValidationState.duration.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.duration.severity)}>
                                            {activityValidationState.duration.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newActivity.location}
                                    onChange={(e) => handleActivityFieldChange('location', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        placeholder="Enter location"
                                    />
                                    {activityTouchedFields.location && activityValidationState.location.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.location.severity)}>
                                            {activityValidationState.location.message}
                                        </div>
                                    )}
                            </div>
                            
                            {/* Type & Slots */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Type</label>
                                    <select
                                        value={newActivity.activityType}
                                        onChange={(e) => handleActivityFieldChange('activityType', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="safari">Safari</option>
                                        <option value="wildlife-tour">Wildlife Tour</option>
                                        <option value="bird-watching">Bird Watching</option>
                                        <option value="nature-walk">Nature Walk</option>
                                        <option value="photography">Photography</option>
                                        <option value="adventure">Adventure</option>
                                        <option value="educational">Educational</option>
                                    </select>
                                    {activityTouchedFields.activityType && activityValidationState.activityType.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.activityType.severity)}>
                                            {activityValidationState.activityType.message}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
                                    <input
                                        type="number"
                                        value={newActivity.availableSlots}
                                        onChange={(e) => handleActivityFieldChange('availableSlots', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getActivityValidationClasses('price')}`}
                                        placeholder="20"
                                    />
                                    {activityTouchedFields.availableSlots && activityValidationState.availableSlots.message && (
                                        <div className={getValidationMessageClasses(activityValidationState.availableSlots.severity)}>
                                            {activityValidationState.availableSlots.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingActivity(null);
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Updating...
                                        </div>
                                    ) : (
                                        'Update Activity'
                                    )}
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
                            <h3 className="font-bold text-emerald-800 text-lg">{selectedActivity.title || selectedActivity.name}</h3>
                            <p className="text-emerald-600">{formatLocation(selectedActivity.location)} • {typeof selectedActivity.duration === 'number' ? `${selectedActivity.duration} hours` : selectedActivity.duration}</p>
                        </div>
                        
                        <form onSubmit={handleBookActivity} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={bookingData.touristName}
                                    onChange={(e) => handleFieldChange('touristName', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getValidationClasses(validationState.touristName, touchedFields.touristName)}`}
                                    placeholder="Enter your full name"
                                    required
                                />
                                {touchedFields.touristName && validationState.touristName.message && (
                                    <p className={getValidationMessageClasses(validationState.touristName.severity)}>
                                        {validationState.touristName.message}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={bookingData.touristEmail}
                                    onChange={(e) => handleFieldChange('touristEmail', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getValidationClasses(validationState.touristEmail, touchedFields.touristEmail)}`}
                                    placeholder="your@email.com"
                                    required
                                />
                                {touchedFields.touristEmail && validationState.touristEmail.message && (
                                    <p className={getValidationMessageClasses(validationState.touristEmail.severity)}>
                                        {validationState.touristEmail.message}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={bookingData.touristPhone}
                                    onChange={(e) => handleFieldChange('touristPhone', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getValidationClasses(validationState.touristPhone, touchedFields.touristPhone)}`}
                                    placeholder="+94 XX XXX XXXX"
                                    required
                                />
                                {touchedFields.touristPhone && validationState.touristPhone.message && (
                                    <p className={getValidationMessageClasses(validationState.touristPhone.severity)}>
                                        {validationState.touristPhone.message}
                                    </p>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={bookingData.date}
                                        onChange={(e) => handleFieldChange('date', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getValidationClasses(validationState.date, touchedFields.date)}`}
                                        min={getTodayDate()} // Prevent past date selection
                                        required
                                    />
                                    {touchedFields.date && validationState.date.message ? (
                                        <p className={getValidationMessageClasses(validationState.date.severity)}>
                                            {validationState.date.message}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">Please select a future date</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Participants <span className="text-sm text-gray-500 font-normal">(age above 12)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={bookingData.participants}
                                        onChange={(e) => handleFieldChange('participants', parseInt(e.target.value) || 1)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getValidationClasses(validationState.participants, touchedFields.participants)}`}
                                        min="1"
                                        max={selectedActivity.maxParticipants || selectedActivity.capacity}
                                        required
                                    />
                                    {touchedFields.participants && validationState.participants.message ? (
                                        <p className={getValidationMessageClasses(validationState.participants.severity)}>
                                            {validationState.participants.message}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">Count adults and children above 12 years</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <input
                                    type="checkbox"
                                    id="requestTourGuide"
                                    checked={bookingData.requestTourGuide}
                                    onChange={(e) => handleFieldChange('requestTourGuide', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="requestTourGuide" className="ml-3 text-blue-800 font-medium">
                                    Request Professional Tour Guide (+LKR 5,000)
                                </label>
                            </div>
                            {touchedFields.requestTourGuide && validationState.tourGuide.message && (
                                <p className={getValidationMessageClasses(validationState.tourGuide.severity)}>
                                    {validationState.tourGuide.message}
                                </p>
                            )}
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Special Requests</label>
                                <textarea
                                    value={bookingData.specialRequests}
                                    onChange={(e) => handleFieldChange('specialRequests', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${getValidationClasses(validationState.specialRequests, touchedFields.specialRequests)}`}
                                    rows="3"
                                    placeholder="Any special requirements or requests..."
                                />
                                {touchedFields.specialRequests && validationState.specialRequests.message && (
                                    <p className={getValidationMessageClasses(validationState.specialRequests.severity)}>
                                        {validationState.specialRequests.message}
                                    </p>
                                )}
                            </div>
                            
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="flex justify-between items-center text-lg font-bold text-emerald-800">
                                    <span>Total Amount:</span>
                                    <span>LKR {(selectedActivity.price * bookingData.participants + (bookingData.requestTourGuide ? 5000 : 0)).toFixed(2)}</span>
                                </div>
                                <div className="text-sm text-emerald-600 mt-1">
                                    LKR {selectedActivity.price} × {bookingData.participants} participants
                                    {bookingData.requestTourGuide && ' + LKR 5,000 tour guide'}
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
                                    disabled={!formValidation.isValid}
                                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                                        formValidation.isValid 
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {formValidation.hasErrors ? 'Fix Errors to Continue' : 'Confirm Booking'}
                                </button>
                            </div>
                            
                            {/* Form validation summary */}
                            {formValidation.hasWarnings && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <h4 className="text-yellow-800 font-semibold mb-2">⚠️ Please Review:</h4>
                                    <ul className="text-yellow-700 text-sm space-y-1">
                                        {Object.entries(validationState)
                                            .filter(([_, validation]) => validation.severity === 'warning')
                                            .map(([field, validation]) => (
                                                <li key={field}>• {validation.message}</li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                            
                            {formValidation.hasErrors && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <h4 className="text-red-800 font-semibold mb-2">❌ Please Fix These Issues:</h4>
                                    <ul className="text-red-700 text-sm space-y-1">
                                        {Object.entries(validationState)
                                            .filter(([_, validation]) => validation.severity === 'error')
                                            .map(([field, validation]) => (
                                                <li key={field}>• {validation.message}</li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* View Activity Modal */}
            {showViewModal && selectedActivity && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-up border border-gray-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Activity Details</h2>
                                    <p className="text-emerald-100 text-sm mt-1">Explore this amazing adventure</p>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Image Section */}
                            <div className="relative group">
                                <img
                                    src={selectedActivity.imageUrl ||
                                        (selectedActivity.images && selectedActivity.images.length > 0
                                            ? `http://localhost:5001${selectedActivity.images[0]}`
                                            : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop")
                                    }
                                    alt={selectedActivity.title || selectedActivity.name}
                                    className="w-full h-96 lg:h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                
                                {/* Price Badge */}
                                <div className="absolute top-4 right-4">
                                    <div className="bg-white/95 backdrop-blur-sm text-emerald-600 px-4 py-2 rounded-full text-lg font-bold shadow-lg border border-white/30">
                                        LKR {selectedActivity.price}
                                        <span className="text-sm text-gray-600">/person</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-8 flex flex-col justify-between">
                                <div>
                                    {/* Title */}
                                    <h3 className="text-3xl font-bold text-gray-900 mb-3">
                                        {selectedActivity.title || selectedActivity.name}
                                    </h3>
                                    
                                    {/* Description */}
                                    <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                                        {selectedActivity.description}
                                    </p>

                                    {/* Key Features */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Location</p>
                                                <p className="font-semibold text-gray-900">{formatLocation(selectedActivity.location)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Duration</p>
                                                <p className="font-semibold text-gray-900">{typeof selectedActivity.duration === 'number' ? `${selectedActivity.duration} hours` : selectedActivity.duration}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Max Participants</p>
                                                <p className="font-semibold text-gray-900">{selectedActivity.maxParticipants || selectedActivity.capacity}</p>
                                            </div>
                                        </div>

                                        {(selectedActivity.category || selectedActivity.activityType) && (
                                            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Type</p>
                                                    <p className="font-semibold text-gray-900 capitalize">{selectedActivity.category || selectedActivity.activityType}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                                    >
                                        Close
                                    </button>
                                    {canBookActivities && (
                                        <button
                                            onClick={() => {
                                                setShowViewModal(false);
                                                openBookingModal(selectedActivity);
                                            }}
                                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            Book Adventure
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ActivityList;