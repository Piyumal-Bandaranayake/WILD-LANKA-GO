import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import EventRegistrationQRCode from '../../components/EventRegistrationQRCode';
import { 
  validateEventForm,
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
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 0.8s ease-out forwards;
  }

  .animate-scale-up {
    animation: scale-up 0.6s ease-out forwards;
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

const EventList = () => {
    const { backendUser, loading: authLoading, checkTokenValidity, refreshToken } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get today's date in YYYY-MM-DD format for date input min attribute
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showQRCodeModal, setShowQRCodeModal] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [registrationData, setRegistrationData] = useState({
        eventId: null,
        participants: 1
    });
    const [userRegistrations, setUserRegistrations] = useState([]);

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxSlots: '',
        imageUrl: ''
    });

    // Event form validation state
    const [eventValidationState, setEventValidationState] = useState({
        title: { isValid: true, message: '', severity: 'info' },
        description: { isValid: true, message: '', severity: 'info' },
        date: { isValid: true, message: '', severity: 'info' },
        time: { isValid: true, message: '', severity: 'info' },
        location: { isValid: true, message: '', severity: 'info' },
        maxSlots: { isValid: true, message: '', severity: 'info' }
    });

    const [eventTouchedFields, setEventTouchedFields] = useState({
        title: false,
        description: false,
        date: false,
        time: false,
        location: false,
        maxSlots: false
    });

    const [eventFormValidation, setEventFormValidation] = useState({
        isValid: false,
        hasErrors: false,
        hasWarnings: false
    });

    // Event form validation handlers
    const handleEventFieldChange = (fieldName, value) => {
        // Update event data
        setNewEvent(prev => ({ ...prev, [fieldName]: value }));
        
        // Mark field as touched
        setEventTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        
        // Perform real-time validation
        validateEventField(fieldName, value);
    };

    const validateEventField = (fieldName, value) => {
        const validation = validateEventForm(
            { ...newEvent, [fieldName]: value }
        );
        
        setEventValidationState(prev => ({
            ...prev,
            [fieldName]: validation.validations[fieldName]
        }));
        
        // Update overall form validation
        setEventFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
    };

    const validateEventFormComplete = () => {
        const validation = validateEventForm(newEvent);
        
        setEventValidationState(validation.validations);
        setEventFormValidation({
            isValid: validation.isValid,
            hasErrors: validation.hasErrors,
            hasWarnings: validation.hasWarnings
        });
        
        return validation.isValid;
    };

    const resetEventValidation = () => {
        setEventValidationState({
            title: { isValid: true, message: '', severity: 'info' },
            description: { isValid: true, message: '', severity: 'info' },
            date: { isValid: true, message: '', severity: 'info' },
            time: { isValid: true, message: '', severity: 'info' },
            location: { isValid: true, message: '', severity: 'info' },
            maxSlots: { isValid: true, message: '', severity: 'info' }
        });
        setEventTouchedFields({
            title: false,
            description: false,
            date: false,
            time: false,
            location: false,
            maxSlots: false
        });
        setEventFormValidation({
            isValid: false,
            hasErrors: false,
            hasWarnings: false
        });
    };

    // Helper function to get validation classes for event fields
    const getEventValidationClasses = (fieldName) => {
        const validation = eventValidationState[fieldName];
        const touched = eventTouchedFields[fieldName];
        
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
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Always fetch events (public data)
        if (!authLoading) {
            fetchEvents();
            
            // Only fetch user registrations if user is authenticated AND is a tourist
            if (backendUser && backendUser._id && backendUser.role === 'tourist') {
                fetchUserRegistrations();
            }
        }
    }, [backendUser, authLoading]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use public API call for events (no authentication required)
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/events`);
            
            if (response.ok) {
                const responseData = await response.json();
                console.log('🔍 Events API Response:', responseData);
                
                // Handle both old and new API response formats
                let eventsData = [];
                if (Array.isArray(responseData)) {
                    eventsData = responseData; // Old format
                    console.log('✅ Using old format for events:', eventsData.length, 'items');
                } else if (responseData?.data?.events && Array.isArray(responseData.data.events)) {
                    eventsData = responseData.data.events; // New format
                    console.log('✅ Using new format for events:', eventsData.length, 'items');
                } else if (responseData?.events && Array.isArray(responseData.events)) {
                    eventsData = responseData.events; // Alternative new format
                    console.log('✅ Using alternative format for events:', eventsData.length, 'items');
                } else {
                    console.warn('⚠️ Unexpected events response format:', responseData);
                }
                
                setEvents(eventsData);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setError('Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openViewModal = (event) => {
        setSelectedEvent(event);
        setShowViewModal(true);
    };

    const fetchUserRegistrations = async () => {
        try {
            // Check token validity and refresh if needed
            const isTokenValid = await checkTokenValidity();
            if (!isTokenValid) {
                console.log('🔄 Token invalid, attempting refresh...');
                const refreshSuccess = await refreshToken();
                if (!refreshSuccess) {
                    console.error('❌ Token refresh failed, clearing registrations');
                    setUserRegistrations([]);
                    return;
                }
            }
            
            const response = await protectedApi.getMyEventRegistrations();
            console.log('🔍 Event registrations API response:', response.data);
            console.log('🔍 Full response structure:', JSON.stringify(response.data, null, 2));
            
            // Handle the nested response structure - try multiple paths based on backend response
            let registrationsData = [];
            if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
                registrationsData = response.data.data.data;
                console.log('✅ Using response.data.data.data path');
            } else if (response.data?.data?.registrations && Array.isArray(response.data.data.registrations)) {
                registrationsData = response.data.data.registrations;
                console.log('✅ Using response.data.data.registrations path');
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                registrationsData = response.data.data;
                console.log('✅ Using response.data.data path');
            } else if (response.data?.registrations && Array.isArray(response.data.registrations)) {
                registrationsData = response.data.registrations;
                console.log('✅ Using response.data.registrations path');
            } else if (Array.isArray(response.data)) {
                registrationsData = response.data;
                console.log('✅ Using response.data path');
            } else {
                console.warn('⚠️ Unexpected registration response structure:', response.data);
                registrationsData = [];
            }
            
            console.log('✅ Processed registrations data:', registrationsData);
            console.log('📊 Registration count:', registrationsData.length);
            console.log('🔍 Sample registration:', registrationsData[0]);
            
            setUserRegistrations(Array.isArray(registrationsData) ? registrationsData : []);
            
            // Debug: Log the final state that will be used by helper functions
            console.log('🎯 Final userRegistrations state set:', {
                count: registrationsData.length,
                activeRegistrations: registrationsData.filter(reg => reg.status === 'registered').length,
                cancelledRegistrations: registrationsData.filter(reg => reg.status === 'cancelled').length,
                registrations: registrationsData.map(reg => ({
                    id: reg._id,
                    eventId: reg.eventId,
                    eventTitle: reg.eventTitle,
                    status: reg.status
                }))
            });
        } catch (error) {
            console.error('Failed to fetch user registrations:', error);
            // Handle authentication errors by clearing registrations
            if (error.status === 401) {
                console.log('🔐 Authentication error fetching registrations, clearing data');
                setUserRegistrations([]);
            } else {
                console.error('Non-auth error fetching registrations:', error);
                // For other errors, keep existing registrations but log the error
            }
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedImages(files);
        
        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreview(previews);
    };

    const removeImage = (index) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviews = imagePreview.filter((_, i) => i !== index);
        setSelectedImages(newImages);
        setImagePreview(newPreviews);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        const isValid = validateEventFormComplete();
        if (!isValid) {
            alert('Please fix the form errors before submitting.');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('title', newEvent.title); // Fixed: Changed from 'name' to 'title'
            formData.append('description', newEvent.description);
            formData.append('date', newEvent.date);
            formData.append('time', newEvent.time);
            formData.append('location', newEvent.location);
            formData.append('maxSlots', newEvent.maxSlots); // Fixed: Changed from 'availableSlots' to 'maxSlots'
            formData.append('category', 'Other'); // Fixed: Changed from 'eventType' to 'category'
            formData.append('duration', '3 hours');
            
            // Add images to FormData
            selectedImages.forEach((image, index) => {
                formData.append('images', image);
            });

            // Validate that the event date is not in the past
            const eventDate = new Date(newEvent.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
            
            if (eventDate < today) {
                alert('Please select a future date. Events cannot be scheduled for past dates.');
                return;
            }

            // Debug: Log what we're sending to the backend
            console.log('🔧 Creating event with FormData:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            setIsSubmitting(true);
            const response = await protectedApi.createEvent(formData);
            
            // Show success message
            alert('🎉 Event Created Successfully!\n\n' +
                  '✅ Your new event has been created and is now live.\n' +
                  '👥 Tourists can now register for this event.\n' +
                  '🔄 The page will refresh to show the new event.');
            
            setShowCreateModal(false);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                maxSlots: '',
                imageUrl: ''
            });
            setSelectedImages([]);
            setImagePreview([]);
            resetEventValidation();
            fetchEvents();
        } catch (error) {
            console.error('Failed to create event:', error);
            
            // Enhanced error message for event creation
            let alertMessage = '❌ Failed to Create Event\n\n';
            
            if (error.status === 401) {
                alertMessage += '🔐 Authentication Error\n' +
                               '💡 Your session may have expired.\n' +
                               '🔄 Please log out and log back in, then try again.';
            } else if (error.status === 403) {
                alertMessage += '🚫 Permission Denied\n' +
                               '💡 You don\'t have permission to create events.\n' +
                               '👤 Only admins and wildlife officers can create events.';
            } else if (error.status === 400) {
                const details = error.response?.data?.message || error.message || '';
                alertMessage += '⚠️ Invalid Event Data\n\n' +
                               '💡 ' + details + '\n\n' +
                               '🔄 Please check your information and try again.\n' +
                               '📝 Make sure all required fields are filled correctly.';
            } else {
                const details = error.response?.data?.message || error.message || 'Unknown error occurred';
                alertMessage += '🔧 Technical Error\n\n' +
                               '💡 ' + details + '\n\n' +
                               '🔄 Please try again in a few moments.\n' +
                               '📞 If the problem persists, please contact support.';
            }
            
            alert(alertMessage);
            setError('Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterForEvent = async (eventId) => {
        // Check if user is logged in
        if (!isLoggedIn) {
            alert('🔐 Login Required for Event Registration\n\n' +
                  '💡 You need to be logged in to register for events.\n' +
                  '👤 Only registered tourists can register for events.\n\n' +
                  '🔄 Please log in with your tourist account and try again.\n' +
                  '📝 Don\'t have an account? You can register as a new tourist.');
            return;
        }
        
        // Check if user is a tourist (only tourists can register for events)
        if (!isTourist) {
            const userRole = backendUser?.role || 'unknown';
            alert('🚫 Tourist Account Required\n\n' +
                  `👤 Current account type: ${userRole}\n` +
                  '💡 Only tourists can register for events.\n\n' +
                  '🔄 Admin and staff users cannot register for events.\n' +
                  '📝 If you need to register as a tourist, please create a separate tourist account.');
            return;
        }

        // Check token validity before opening registration modal
        try {
            const isTokenValid = await checkTokenValidity();
            if (!isTokenValid) {
                console.log('🔄 Token invalid, attempting refresh...');
                const refreshSuccess = await refreshToken();
                if (!refreshSuccess) {
                    console.error('❌ Token refresh failed, redirecting to login');
                    alert('🔐 Session Expired\n\n' +
                          '💡 Your session has expired. Please log in again to continue.\n' +
                          '🔄 You will be redirected to the login page.');
                    // Redirect to login page
                    window.location.href = '/login';
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            alert('🔐 Authentication Error\n\n' +
                  '💡 There was an issue with your authentication. Please log in again.\n' +
                  '🔄 You will be redirected to the login page.');
            // Redirect to login page
            window.location.href = '/login';
            return;
        }
        
        // Open registration modal with participant count input
        setRegistrationData({
            eventId: eventId,
            participants: 1
        });
        setShowRegistrationModal(true);
    };

    // Helper function to show QR code for a registration
    const showQRCodeForRegistration = (registration) => {
        const event = events.find(e => e._id === registration.eventId?._id || e._id === registration.eventId);
        if (event) {
            setSelectedRegistration(registration);
            setSelectedEvent(event);
            setShowQRCodeModal(true);
        }
    };

    const handleConfirmRegistration = async () => {
        try {
            console.log('=== EVENT REGISTRATION STARTED ===');
            console.log('Event ID:', registrationData.eventId);
            console.log('Participants:', registrationData.participants);
            console.log('User:', backendUser);

            // Double-check authentication before proceeding
            if (!isLoggedIn || !isTourist) {
                throw new Error('Authentication error: Only logged-in tourists can register for events.');
            }

            // Check token validity and refresh if needed
            const isTokenValid = await checkTokenValidity();
            if (!isTokenValid) {
                console.log('🔄 Token invalid, attempting refresh...');
                const refreshSuccess = await refreshToken();
                if (!refreshSuccess) {
                    console.error('❌ Token refresh failed, redirecting to login');
                    alert('🔐 Session Expired\n\n' +
                          '💡 Your session has expired. Please log in again to continue.\n' +
                          '🔄 You will be redirected to the login page.');
                    // Redirect to login page
                    window.location.href = '/login';
                    return;
                }
            }

            // First, check available slots before registration
            console.log('Checking available slots before registration...');
            const slotCheck = await protectedApi.checkEventAvailableSlots({
                eventId: registrationData.eventId,
                participants: registrationData.participants
            });
            console.log('Pre-registration slot check:', slotCheck.data);

            // Handle the nested response structure
            const slotData = slotCheck.data?.data || slotCheck.data;
            console.log('Processed slot data:', slotData);

            if (!slotData || !slotData.canRegister) {
                const errorMessage = slotData?.message || 'Slot check failed';
                console.error('Slot check failed:', errorMessage);
                console.log('Slot check details:', {
                    canRegister: slotData?.canRegister,
                    availableSlots: slotData?.availableSlots,
                    requestedParticipants: slotData?.requestedParticipants,
                    message: slotData?.message
                });
                throw new Error(errorMessage);
            }

            const response = await protectedApi.registerForEvent({
                eventId: registrationData.eventId,
                participants: registrationData.participants
            });
            
            // Close modal and refresh data
            setShowRegistrationModal(false);
            
            // Show success message with QR code option
            const participantText = registrationData.participants === 1 ? 'participant' : 'participants';
            const showQRCode = confirm(`🎉 Registration Successful!\n\n` +
                  `✅ You have successfully registered for this event!\n` +
                  `👥 Number of participants: ${registrationData.participants} ${participantText}\n` +
                  `📧 A confirmation will be sent to your email.\n\n` +
                  `Would you like to view your registration QR code now?`);
            
            if (showQRCode) {
                // Find the newly created registration
                const newRegistration = userRegistrations.find(reg => 
                    (reg.eventId?._id === registrationData.eventId || reg.eventId === registrationData.eventId) && 
                    reg.status === 'registered'
                );
                
                if (newRegistration) {
                    showQRCodeForRegistration(newRegistration);
                } else {
                    // If we can't find the registration immediately, refresh and try again
                    setTimeout(async () => {
                        await fetchUserRegistrations();
                        const refreshedRegistration = userRegistrations.find(reg => 
                            (reg.eventId?._id === registrationData.eventId || reg.eventId === registrationData.eventId) && 
                            reg.status === 'registered'
                        );
                        if (refreshedRegistration) {
                            showQRCodeForRegistration(refreshedRegistration);
                        }
                    }, 1000);
                }
            }
            
            fetchEvents(); // Refresh to show updated registration count
            
            // Only refresh user registrations if user is a tourist
            if (backendUser?.role === 'tourist') {
                fetchUserRegistrations();
            }
            console.log('=== EVENT REGISTRATION COMPLETED SUCCESSFULLY ===');
        } catch (error) {
            console.error('=== EVENT REGISTRATION FAILED ===');
            console.error('Failed to register for event:', error);
            
            // Enhanced error handling with user-friendly alert messages
            let alertMessage = '❌ Event Registration Failed\n\n';
            let errorMessage = 'Failed to register for event';
            
            // Check if it's a slot availability error first
            const errorData = error.response?.data?.data || error.response?.data;
            if (errorData?.availableSlots !== undefined) {
                const { availableSlots, requestedParticipants } = errorData;
                alertMessage += '💺 Not Enough Slots Available\n\n' +
                               `🔢 Available slots: ${availableSlots}\n` +
                               `👥 Requested participants: ${requestedParticipants}\n\n` +
                               '💡 Suggestions:\n' +
                               '   • Reduce the number of participants\n' +
                               '   • Try registering for a different event\n' +
                               '   • Check back later in case slots become available';
                errorMessage = `Not enough slots available. Only ${availableSlots} slots remaining for ${requestedParticipants} participants.`;
            } else if (error.status === 401) {
                alertMessage += '🔐 Session Expired\n\n' +
                               '💡 Your session has expired. Please log in again to continue.\n' +
                               '🔄 You will be redirected to the login page.';
                errorMessage = 'Authentication error. Please log in again.';
                // Redirect to login page after showing alert
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.status === 403) {
                alertMessage += '🚫 Permission Denied\n\n' +
                               '💡 Only tourists can register for events.\n' +
                               '🔍 Make sure you\'re logged in with a tourist account.';
                errorMessage = 'Only tourists can register for events.';
            } else if (error.status === 400) {
                const details = error.response?.data?.message || error.message || '';
                if (details.includes('already registered')) {
                    alertMessage += '⚠️ Already Registered\n\n' +
                                   '💡 You are already registered for this event.\n' +
                                   '🔄 Please refresh the page to see your current registration status.';
                    errorMessage = 'You are already registered for this event.';
                } else {
                    alertMessage += '⚠️ Invalid Registration Data\n\n' +
                                   '💡 ' + details + '\n\n' +
                                   '🔄 Please check your information and try again.';
                    errorMessage = details || 'Invalid registration data.';
                }
            } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                alertMessage += '🌐 Network Connection Error\n\n' +
                               '💡 Please check your internet connection and try again.\n' +
                               '📶 Make sure you\'re connected to the internet.';
                errorMessage = 'Network connection error. Please try again.';
            } else {
                const details = error.response?.data?.message || error.message || 'Unknown error occurred';
                alertMessage += '🔧 Technical Error\n\n' +
                               '💡 ' + details + '\n\n' +
                               '🔄 Please try again in a few moments.\n' +
                               '📞 If the problem persists, please contact support.';
                errorMessage = details;
            }
            
            alert(alertMessage);
            setError(errorMessage);
        }
    };

    const handleCancelRegistration = async (registrationId) => {
        // Enhanced confirmation dialog
        if (!registrationId) {
            alert('⚠️ Error: Unable to cancel registration - registration ID is missing. Please refresh the page and try again.');
            return;
        }

        const confirmMessage = `🚫 Are you sure you want to cancel this event registration?\n\n` +
                              `⚠️ This action cannot be undone.\n` +
                              `📅 You may lose your spot if the event fills up later.\n\n` +
                              `Click OK to confirm cancellation, or Cancel to keep your registration.`;
        
        if (window.confirm(confirmMessage)) {
            try {
                console.log('🔄 Cancelling registration with ID:', registrationId);
                
                // Show loading state
                const originalError = error;
                setError('🔄 Cancelling your registration...');
                
                const response = await protectedApi.cancelEventRegistration(registrationId);
                console.log('✅ Cancellation response:', response);
                
                // Clear loading state
                setError(null);
                
                // Show success message
                alert('✅ Registration Cancelled Successfully!\n\n' +
                      '🎯 Your event registration has been cancelled.\n' +
                      '💺 Your spot has been freed up for other participants.\n' +
                      '🔄 The page will refresh to show updated information.');
                
                // Refresh data with a small delay to ensure backend processing is complete
                console.log('🔄 Refreshing data after cancellation...');
                setTimeout(async () => {
                    await fetchUserRegistrations(); // Refresh user registrations first
                    await fetchEvents(); // Then refresh events to show updated slot count
                    console.log('✅ Data refresh completed');
                }, 500);
                
                console.log('✅ Event registration cancelled successfully');
                
            } catch (error) {
                console.error('❌ Failed to cancel registration:', error);
                
                // Clear loading state
                setError(null);
                
                // Detailed error handling with user-friendly messages
                let errorMessage = '❌ Failed to Cancel Registration\n\n';
                
                if (error.status === 404) {
                    errorMessage += '🔍 Registration not found or already cancelled.\n' +
                                   '💡 This might happen if:\n' +
                                   '   • The registration was already cancelled\n' +
                                   '   • The event was deleted by an administrator\n' +
                                   '   • There was a synchronization issue\n\n' +
                                   '🔄 Please refresh the page to see the current status.';
                } else if (error.status === 401) {
                    errorMessage += '🔐 Authentication Error\n' +
                                   '💡 Your session may have expired.\n' +
                                   '🔄 Please log out and log back in, then try again.';
                } else if (error.status === 403) {
                    errorMessage += '🚫 Permission Denied\n' +
                                   '💡 You don\'t have permission to cancel this registration.\n' +
                                   '🔍 This might happen if the registration belongs to another user.';
                } else if (error.status === 400) {
                    const details = error.response?.data?.message || error.message || '';
                    if (details.includes('ObjectId')) {
                        errorMessage += '🔧 Technical Error - Invalid Registration ID\n' +
                                       '💡 There seems to be a data format issue.\n' +
                                       '🔄 Please refresh the page and try again.';
                    } else {
                        errorMessage += '⚠️ Invalid Request\n' +
                                       '💡 ' + details + '\n' +
                                       '🔄 Please try again or contact support if the issue persists.';
                    }
                } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                    errorMessage += '🌐 Network Connection Error\n' +
                                   '💡 Please check your internet connection and try again.\n' +
                                   '📶 Make sure you\'re connected to the internet.';
                } else {
                    const details = error.response?.data?.message || error.message || 'Unknown error occurred';
                    errorMessage += '🔧 Technical Error\n' +
                                   '💡 ' + details + '\n\n' +
                                   '🔄 Please try again in a few moments.\n' +
                                   '📞 If the problem persists, please contact support.';
                }
                
                alert(errorMessage);
                setError('Failed to cancel registration. Please try again.');
            }
        }
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        
        // Format date for HTML date input (yyyy-MM-dd)
        let formattedDate = '';
        if (event.dateTime && event.dateTime.startDate) {
            const date = new Date(event.dateTime.startDate);
            formattedDate = date.toISOString().split('T')[0];
        } else if (event.date) {
            const date = new Date(event.date);
            formattedDate = date.toISOString().split('T')[0];
        }
        
        // Format time for HTML time input (HH:MM)
        let formattedTime = '';
        if (event.dateTime && event.dateTime.startTime) {
            formattedTime = event.dateTime.startTime;
        } else if (event.time) {
            formattedTime = event.time;
        }
        
        // Format location
        let locationString = '';
        if (event.location) {
            if (typeof event.location === 'string') {
                locationString = event.location;
            } else if (event.location.venue) {
                locationString = event.location.venue;
            }
        }
        
        setNewEvent({
            title: event.title || '',
            description: event.description || '',
            date: formattedDate,
            time: formattedTime,
            location: locationString,
            maxSlots: event.capacity?.maxSlots || event.maxSlots || '',
            imageUrl: event.imageUrl || ''
        });
        
        // Clear any existing image selections
        setSelectedImages([]);
        setImagePreview([]);
        setShowEditModal(true);
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', newEvent.title); // Fixed: Changed from 'name' to 'title'
            formData.append('description', newEvent.description);
            formData.append('date', newEvent.date);
            formData.append('time', newEvent.time);
            formData.append('location', newEvent.location);
            formData.append('maxSlots', newEvent.maxSlots); // Fixed: Changed from 'availableSlots' to 'maxSlots'
            formData.append('category', 'Other'); // Fixed: Changed from 'eventType' to 'category'
            formData.append('duration', '3 hours');
            
            // Add images to FormData if any are selected
            selectedImages.forEach((image, index) => {
                formData.append('images', image);
            });

            // Validate that the event date is not in the past
            const eventDate = new Date(newEvent.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
            
            if (eventDate < today) {
                alert('Please select a future date. Events cannot be scheduled for past dates.');
                return;
            }

            // Debug: Log what we're sending to the backend
            console.log('🔧 Updating event with FormData:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            await protectedApi.updateEvent(editingEvent._id, formData);
            setShowEditModal(false);
            setEditingEvent(null);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                maxSlots: '',
                imageUrl: ''
            });
            setSelectedImages([]);
            setImagePreview([]);
            fetchEvents();
        } catch (error) {
            console.error('Failed to update event:', error);
            
            // Handle authentication errors
            if (error.response?.status === 401 || error.status === 401) {
                setError('Authentication failed. Please log in again.');
                // The AuthContext will handle the logout automatically
                return;
            }
            
            setError('Failed to update event');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await protectedApi.deleteEvent(id);
                fetchEvents();
            } catch (error) {
                console.error('Failed to delete event:', error);
                
                // Handle authentication errors
                if (error.response?.status === 401 || error.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    // The AuthContext will handle the logout automatically
                    return;
                }
                
                setError('Failed to delete event');
            }
        }
    };

    const isAdmin = backendUser?.role === 'admin';
    const isTourist = backendUser?.role === 'tourist';
    const isLoggedIn = !!backendUser && !!backendUser._id;
    const canRegisterForEvents = isLoggedIn && isTourist; // Only logged-in tourists can register

    // Helper function to check if user is registered for an event
    const isUserRegisteredForEvent = (eventId) => {
        if (!Array.isArray(userRegistrations)) {
            console.warn('⚠️ userRegistrations is not an array:', userRegistrations);
            return false;
        }
        
        console.log(`🔍 Checking registration for event ${eventId}`);
        console.log('📋 All user registrations:', userRegistrations.map(reg => ({
            id: reg._id,
            eventId: reg.eventId?._id || reg.eventId,
            status: reg.status,
            eventTitle: reg.eventTitle
        })));
        
        // Only consider active registrations (status: 'registered')
        const activeRegistration = userRegistrations.some(reg => 
            (reg.eventId?._id === eventId || reg.eventId === eventId) && 
            reg.status === 'registered'
        );
        
        console.log(`✅ User is ${activeRegistration ? '' : 'NOT '}registered for event ${eventId}`);
        return activeRegistration;
    };

    // Helper function to get user registration for an event
    const getUserRegistrationForEvent = (eventId) => {
        if (!Array.isArray(userRegistrations)) {
            console.warn('⚠️ userRegistrations is not an array:', userRegistrations);
            return null;
        }
        
        // Only return active registrations (status: 'registered')
        const registration = userRegistrations.find(reg => 
            (reg.eventId?._id === eventId || reg.eventId === eventId) && 
            reg.status === 'registered'
        );
        
        console.log(`🔍 Found registration for event ${eventId}:`, registration ? {
            id: registration._id,
            status: registration.status,
            participants: registration.numberOfParticipants || registration.participants
        } : 'None');
        
        return registration;
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
                <Navbar />
                <div className="flex-1 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 mx-auto"></div>
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        </div>
                        <p className="mt-6 text-xl text-gray-600 font-medium">Loading amazing events...</p>
                        <p className="text-emerald-600">Please wait while we fetch the latest conservation programs</p>
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
                        src="/src/assets/event.jpg"
                        alt="Conservation Events"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-emerald-700/15 to-teal-800/20"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="container mx-auto px-6 text-center">
                        <div className="animate-fade-in-up">
                            <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-tight mb-6">
                                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                                    Conservation
                                </span>
                                <br />
                                <span className="text-white/90 text-4xl md:text-6xl">
                                    Events
                                </span>
                            </h1>
                        </div>
                        
                        <div className="animate-fade-in-up animation-delay-300 mb-8">
                            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                                Join our conservation events, workshops, and community programs. 
                                Make a difference for Sri Lanka's precious wildlife.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="animate-fade-in-up animation-delay-600 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-lg">
                                <div className="text-3xl font-bold text-white">{events.length}+</div>
                                <div className="text-white font-medium">Active Events</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-lg">
                                <div className="text-3xl font-bold text-white">500+</div>
                                <div className="text-white font-medium">Participants</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-lg">
                                <div className="text-3xl font-bold text-white">25+</div>
                                <div className="text-white font-medium">Locations</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Events Section */}
            <section className="relative -mt-32 z-10 py-20">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                        <div className="animate-slide-in-left">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Upcoming Events
                            </h2>
                        </div>
                        
                        {isAdmin && (
                            <div className="animate-fade-in-up animation-delay-300">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 hover:shadow-lg flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Event
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
                        {(Array.isArray(events) ? events : []).map((event, index) => {
                            // Debug: Log event data to understand structure
                            console.log('Event data for image debugging:', {
                                id: event._id,
                                title: event.title,
                                imageUrl: event.imageUrl,
                                images: event.images,
                                media: event.media
                            });
                            
                            return (
                            <div 
                                key={event._id} 
                                className="bg-white rounded-3xl shadow-lg overflow-hidden card-hover border border-gray-100 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="relative">
                                    <img
                                        src={
                                            // First try the imageUrl field (single image)
                                            event.imageUrl ||
                                            // Then try the images array (support string or object with url)
                                            (event.images && event.images.length > 0
                                                ? (typeof event.images[0] === 'string' ? event.images[0] : (event.images[0]?.url || null))
                                                : null
                                            ) ||
                                            // Fallback to default image
                                            "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop"
                                        }
                                        alt={event.title || event.name}
                                        className="w-full h-56 object-cover"
                                        onError={(e) => {
                                            console.log('Image failed to load:', e.target.src);
                                            e.target.src = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop";
                                        }}
                                    />
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Free Event
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium text-gray-800">
                                            {new Date(event.dateTime?.startDate || event.date).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">
                                        {event.title || event.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                        {event.description}
                                    </p>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {event.dateTime?.startTime || event.time || 'TBA'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">{formatLocation(event.location)}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {event.capacity?.availableSlots || event.availableSlots || 0} / {event.capacity?.maxSlots || event.maxSlots || 0} spots
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openViewModal(event)}
                                            className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-semibold transition-all hover:bg-gray-50 shadow-sm text-sm"
                                        >
                                            View Event
                                        </button>
                                        {canRegisterForEvents && (
                                            <>
                                                {isUserRegisteredForEvent(event._id) ? (
                                                    <div className="flex gap-2 w-full">
                                                        <div className="flex-1 bg-green-100 text-green-800 px-4 py-3 rounded-xl font-bold text-center">
                                                            ✓ Registered
                                                        </div>
                                                        <button
                                                            onClick={() => handleCancelRegistration(getUserRegistrationForEvent(event._id)?._id)}
                                                            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all transform hover:scale-105"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRegisterForEvent(event._id)}
                                                        disabled={(event.capacity?.availableSlots || event.availableSlots || 0) === 0}
                                                        className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                                                            (event.capacity?.availableSlots || event.availableSlots || 0) === 0 
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                                                        }`}
                                                    >
                                                        {(event.capacity?.availableSlots || event.availableSlots || 0) === 0 ? 'Event Full' : 'Register Now'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        
                                        {/* Show message for logged-in non-tourists */}
                                        {isLoggedIn && !isTourist && !isAdmin && (
                                            <div className="flex-1 bg-gray-100 text-gray-600 px-4 py-3 rounded-xl font-medium text-center">
                                                Only tourists can register for events
                                            </div>
                                        )}
                                        
                                        {isAdmin && (
                                            <>
                                                <button
                                                    onClick={() => handleEditEvent(event)}
                                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event._id)}
                                                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {events.length === 0 && !loading && (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">No Events Available</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    We're currently planning exciting new conservation events. 
                                    Check back soon for upcoming programs!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Login prompt for non-authenticated users */}
                    {!backendUser && events.length > 0 && (
                        <div className="text-center py-12 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 animate-fade-in-up">
                            <div className="max-w-2xl mx-auto px-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">Join Our Conservation Community!</h3>
                                <p className="text-gray-600 text-lg mb-6">
                                    Log in to register for events, track your participation, and become part of our wildlife conservation efforts.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => window.location.href = '/login'}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 hover:shadow-lg"
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/register'}
                                        className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Create New Event</h3>
                                        <p className="text-emerald-100 text-sm">Add a new wildlife event</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedImages([]);
                                        setImagePreview([]);
                                        resetEventValidation();
                                    }}
                                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Event Images</label>
                                {imagePreview.length === 0 ? (
                                    <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
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
                                            <span className="text-emerald-600 font-medium">Upload Event Images</span>
                                            <span className="text-sm text-gray-500 mt-1">Click to browse or drag & drop (up to 5 images)</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {imagePreview.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-xl shadow-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Event Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => handleEventFieldChange('title', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                    placeholder="Enter event title"
                                    required
                                />
                                {eventTouchedFields.title && eventValidationState.title.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.title.severity)}>
                                        {eventValidationState.title.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => handleEventFieldChange('description', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 resize-none"
                                    rows="3"
                                    placeholder="Describe the event in detail..."
                                    required
                                />
                                {eventTouchedFields.description && eventValidationState.description.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.description.severity)}>
                                        {eventValidationState.description.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => handleEventFieldChange('date', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        min={getTodayDate()} // Prevent past date selection
                                        required
                                    />
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
                                        </div>
                                    )}
                                    {eventTouchedFields.date && eventValidationState.date.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.date.severity)}>
                                            {eventValidationState.date.message}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Event must be scheduled for a future date</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => handleEventFieldChange('time', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getEventValidationClasses('time')}`}
                                        required
                                    />
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => handleEventFieldChange('location', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                    placeholder="Enter location"
                                    required
                                />
                                {eventTouchedFields.location && eventValidationState.location.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.location.severity)}>
                                        {eventValidationState.location.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Duration & Slots */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value="3 hours"
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        placeholder="3 hours"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
                                    <input
                                        type="number"
                                        value={newEvent.maxSlots}
                                        onChange={(e) => handleEventFieldChange('maxSlots', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        placeholder="50"
                                        min="1"
                                        required
                                    />
                                    {eventTouchedFields.maxSlots && eventValidationState.maxSlots.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.maxSlots.severity)}>
                                            {eventValidationState.maxSlots.message}
                                        </div>
                                    )}
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
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
                                        setSelectedImages([]);
                                        setImagePreview([]);
                                        resetEventValidation();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none ${
                                        eventFormValidation.isValid 
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    }`}
                                    disabled={isSubmitting || !eventFormValidation.isValid}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create Event'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
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
                                        <h3 className="text-xl font-bold">Edit Event</h3>
                                        <p className="text-emerald-100 text-sm">Update event details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingEvent(null);
                                        setSelectedImages([]);
                                        setImagePreview([]);
                                    }}
                                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleUpdateEvent} className="p-6 space-y-6">
                            {/* Event Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => handleEventFieldChange('title', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                    placeholder="Enter event title"
                                    required
                                />
                                {eventTouchedFields.title && eventValidationState.title.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.title.severity)}>
                                        {eventValidationState.title.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => handleEventFieldChange('description', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 resize-none"
                                    rows="3"
                                    placeholder="Describe the event in detail..."
                                    required
                                />
                                {eventTouchedFields.description && eventValidationState.description.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.description.severity)}>
                                        {eventValidationState.description.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => handleEventFieldChange('date', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        min={getTodayDate()} // Prevent past date selection
                                        required
                                    />
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
                                        </div>
                                    )}
                                    {eventTouchedFields.date && eventValidationState.date.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.date.severity)}>
                                            {eventValidationState.date.message}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Event must be scheduled for a future date</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => handleEventFieldChange('time', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${getEventValidationClasses('time')}`}
                                        required
                                    />
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => handleEventFieldChange('location', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                    placeholder="Enter location"
                                    required
                                />
                                {eventTouchedFields.location && eventValidationState.location.message && (
                                    <div className={getValidationMessageClasses(eventValidationState.location.severity)}>
                                        {eventValidationState.location.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Duration & Slots */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value="3 hours"
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        placeholder="3 hours"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Available Slots</label>
                                    <input
                                        type="number"
                                        value={newEvent.maxSlots}
                                        onChange={(e) => handleEventFieldChange('maxSlots', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${getEventValidationClasses('description')}`}
                                        placeholder="50"
                                        min="1"
                                        required
                                    />
                                    {eventTouchedFields.maxSlots && eventValidationState.maxSlots.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.maxSlots.severity)}>
                                            {eventValidationState.maxSlots.message}
                                        </div>
                                    )}
                                    {eventTouchedFields.time && eventValidationState.time.message && (
                                        <div className={getValidationMessageClasses(eventValidationState.time.severity)}>
                                            {eventValidationState.time.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Add New Images */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Add New Images (Optional)</label>
                                {imagePreview.length === 0 ? (
                                    <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
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
                                            <span className="text-emerald-600 font-medium">Upload Additional Images</span>
                                            <span className="text-sm text-gray-500 mt-1">Click to browse (up to 5 images)</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {imagePreview.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-xl shadow-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingEvent(null);
                                        setSelectedImages([]);
                                        setImagePreview([]);
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    Update Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Registration Modal - Only show for tourist users */}
            {showRegistrationModal && backendUser?.role === 'tourist' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-up border border-gray-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Register for Event</h3>
                                        <p className="text-blue-100 text-sm">Select number of participants</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRegistrationModal(false)}
                                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Participant Count */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Participants</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={registrationData.participants}
                                    onChange={(e) => setRegistrationData({...registrationData, participants: parseInt(e.target.value) || 1})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                    placeholder="Enter number of participants"
                                />
                                <p className="text-sm text-gray-500 mt-1">Maximum 10 participants per registration</p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRegistrationModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRegistration}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    Register Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Event Modal */}
            {showViewModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up border border-gray-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800">Event Details</h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            <div className="relative">
                                <img
                                    src={
                                        selectedEvent.imageUrl ||
                                        (selectedEvent.images && selectedEvent.images.length > 0 ? selectedEvent.images[0] : null) ||
                                        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop"
                                    }
                                    alt={selectedEvent.title || selectedEvent.name}
                                    className="w-full h-80 object-cover rounded-t-3xl lg:rounded-tr-none lg:rounded-bl-3xl"
                                />
                                <div className="absolute top-4 right-4">
                                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                        Free Event
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 lg:p-8">
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-2">
                                    {selectedEvent.title || selectedEvent.name}
                                </h3>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {selectedEvent.description}
                                </p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {new Date(selectedEvent.dateTime?.startDate || selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            {' • '}
                                            {selectedEvent.dateTime?.startTime || selectedEvent.time || 'TBA'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">{formatLocation(selectedEvent.location)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {selectedEvent.capacity?.availableSlots || selectedEvent.availableSlots || 0} / {selectedEvent.capacity?.maxSlots || selectedEvent.maxSlots || 0} spots
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
                                    >
                                        Close
                                    </button>
                                    {canRegisterForEvents && ((selectedEvent.capacity?.availableSlots || selectedEvent.availableSlots || 0) > 0) && (
                                        <button
                                            onClick={() => {
                                                setShowViewModal(false);
                                                setRegistrationData({ eventId: selectedEvent._id, participants: 1 });
                                                setShowRegistrationModal(true);
                                            }}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            Register Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRCodeModal && selectedRegistration && selectedEvent && (
                <EventRegistrationQRCode
                    registration={selectedRegistration}
                    event={selectedEvent}
                    onClose={() => {
                        setShowQRCodeModal(false);
                        setSelectedRegistration(null);
                        setSelectedEvent(null);
                    }}
                />
            )}

            <Footer />
        </div>
    );
};

export default EventList;
