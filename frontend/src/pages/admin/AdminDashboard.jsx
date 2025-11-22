import React, { useState, useEffect, useMemo } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import RoleGuard from '../../components/RoleGuard';
import RoleBasedFeature from '../../components/RoleBasedFeature';
import Navbar from '../../components/Navbar';

/**
 * AdminDashboard – single-file version, full functional + restyled
 * - Left Sidebar (icons + labels with active highlight)
 * - Top greeting banner with search + "Add New"
 * - Stat cards row
 * - Center panels: Users / Applications / Activities / Events (tabs)
 * - Right widgets: Mini weekly calendar + New Applicants + Quick Actions
 * - All existing CRUD & modals preserved
 */

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Debug mode - temporarily allow access for testing
  const DEBUG_MODE = true; // Set to false in production
  const isDebugAdmin = DEBUG_MODE && user; // Allow any logged-in user in debug mode

  // Core state
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | applications | activities | events
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // all | system | tourist
  const [sidebarActive, setSidebarActive] = useState('overview'); // for left sidebar visual only

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showTouristDetailsModal, setShowTouristDetailsModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Selections
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Forms
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'tourGuide',
    password: '',
    phone: '',
    specialization: '',
    experience: ''
  });

  // Form validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Edit User validation state
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [isEditValidating, setIsEditValidating] = useState(false);
  
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: '',
    phone: ''
  });
  const [customPassword, setCustomPassword] = useState('');

  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    location: '',
    category: 'Safari',
    availableSlots: '',
    requirements: '',
    images: []
  });

  const [activityErrors, setActivityErrors] = useState({});
  const [eventErrors, setEventErrors] = useState({});
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Validation functions for Activity form
  const validateActivityField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 3) return 'Activity name must be at least 3 characters';
        if (value.trim().length > 100) return 'Activity name must be less than 100 characters';
        return '';
      case 'description':
        if (!value || value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 500) return 'Description must be less than 500 characters';
        const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 20) return 'Description must have at least 20 words';
        return '';
      case 'category':
        if (!value) return 'Please select an activity type';
        return '';
      case 'location':
        if (!value || value.trim().length < 3) return 'Location must be at least 3 characters';
        return '';
      case 'duration':
        if (!value || isNaN(value) || parseInt(value) < 1) return 'Duration must be at least 1 hour';
        if (parseInt(value) > 24) return 'Duration cannot exceed 24 hours';
        return '';
      case 'price':
        if (!value || isNaN(value) || parseFloat(value) < 0) return 'Price must be a valid number';
        if (parseFloat(value) > 100000) return 'Price cannot exceed 100,000 LKR';
        return '';
      case 'availableSlots':
        if (!value || isNaN(value) || parseInt(value) < 1) return 'Available slots must be at least 1';
        if (parseInt(value) > 1000) return 'Available slots cannot exceed 1000';
        return '';
      default:
        return '';
    }
  };

  const validateActivityForm = () => {
    const errors = {};
    errors.name = validateActivityField('name', newActivity.name);
    errors.description = validateActivityField('description', newActivity.description);
    errors.category = validateActivityField('category', newActivity.category);
    errors.location = validateActivityField('location', newActivity.location);
    errors.duration = validateActivityField('duration', newActivity.duration);
    errors.price = validateActivityField('price', newActivity.price);
    errors.availableSlots = validateActivityField('availableSlots', newActivity.availableSlots);
    return errors;
  };

  // Validation functions for Event form
  const validateEventField = (field, value) => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length < 3) return 'Event title must be at least 3 characters';
        if (value.trim().length > 100) return 'Event title must be less than 100 characters';
        return '';
      case 'description':
        if (!value || value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 500) return 'Description must be less than 500 characters';
        const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 20) return 'Description must have at least 20 words';
        return '';
      case 'date':
        if (!value) return 'Please select an event date';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return 'Event date cannot be in the past';
        return '';
      case 'time':
        if (!value) return 'Please select an event time';
        return '';
      case 'location':
        if (!value || value.trim().length < 3) return 'Location must be at least 3 characters';
        return '';
      case 'maxAttendees':
        if (!value || isNaN(value) || parseInt(value) < 1) return 'Max attendees must be at least 1';
        if (parseInt(value) > 1000) return 'Max attendees cannot exceed 1000';
        return '';
      case 'category':
        if (!value) return 'Please select an event category';
        return '';
      default:
        return '';
    }
  };

  const validateEventForm = () => {
    const errors = {};
    errors.title = validateEventField('title', newEvent.title);
    errors.description = validateEventField('description', newEvent.description);
    errors.date = validateEventField('date', newEvent.date);
    errors.time = validateEventField('time', newEvent.time);
    errors.location = validateEventField('location', newEvent.location);
    errors.maxAttendees = validateEventField('maxAttendees', newEvent.maxAttendees);
    errors.category = validateEventField('category', newEvent.category);
    return errors;
  };

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    category: 'educational',
    requirements: '',
    images: []
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApplications: 0,
    activeActivities: 0,
    totalEvents: 0,
    recentBookings: 0,
    systemHealth: 'Good'
  });

  useEffect(() => {
    console.log('AdminDashboard useEffect - User:', user);
    if (user?.role === 'admin') {
      console.log('User is admin, fetching data...');
      fetchAllData();
    } else {
      console.log('User is not admin or not loaded yet. User role:', user?.role);
      setLoading(false); // Stop loading if user is not admin
    }
  }, [user]);

  const fetchAllData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Show loading message to user
      if (retryCount > 0) {
        setError(`Retrying... (attempt ${retryCount + 1}/3)`);
      }
      
      // Fetch data sequentially to avoid overwhelming the backend
      const [usersRes, appsRes, activitiesRes, eventsRes] = await Promise.allSettled([
        protectedApi.getAllUsers().catch(err => {
          return { data: { users: [] } };
        }),
        protectedApi.getJobApplications().catch(err => {
          return { data: [] };
        }),
        protectedApi.getActivities().catch(err => {
          return { data: [] };
        }),
        protectedApi.getEvents().catch(err => {
          return { data: [] };
        })
      ]);

      // Extract data from Promise.allSettled results with defensive programming
      let usersData = [];
      if (usersRes.status === 'fulfilled') {
        const apiResponse = usersRes.value?.data; // This is the full API response: {success, message, data, timestamp}
        console.log('🔍 Users API Response:', apiResponse);
        
        // The API returns: {success: true, data: {users: [...], pagination: {...}}, message: "...", timestamp: "..."}
        // So we need to access apiResponse.data.users
        if (apiResponse?.data?.users && Array.isArray(apiResponse.data.users)) {
          usersData = apiResponse.data.users; // Correct format for standardized API
          console.log('✅ Found users in standardized API format:', usersData.length, 'items');
        } else if (apiResponse?.users && Array.isArray(apiResponse.users)) {
          usersData = apiResponse.users; // Legacy format
          console.log('✅ Found users in legacy format:', usersData.length, 'items');
        } else if (Array.isArray(apiResponse)) {
          usersData = apiResponse; // Direct array format
          console.log('✅ Found users in direct array format:', usersData.length, 'items');
        } else {
          console.warn('⚠️ Could not find users in response. Response structure:', apiResponse);
          console.log('Response keys:', Object.keys(apiResponse || {}));
          if (apiResponse?.data) {
            console.log('Data keys:', Object.keys(apiResponse.data || {}));
          }
        }
      } else {
        console.error('❌ Users API call failed:', usersRes.reason);
      }
      
      // Handle applications data - check both old and new API response formats
      let appsData = [];
      if (appsRes.status === 'fulfilled') {
        const responseData = appsRes.value?.data;
        console.log('🔍 Applications API Response:', responseData);
        if (Array.isArray(responseData)) {
          appsData = responseData; // Old format
          console.log('✅ Using old format for applications:', appsData.length, 'items');
        } else if (responseData?.applications && Array.isArray(responseData.applications)) {
          appsData = responseData.applications; // Alternative format
          console.log('✅ Using alternative format for applications:', appsData.length, 'items');
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          appsData = responseData.data; // Legacy format
          console.log('✅ Using legacy format for applications:', appsData.length, 'items');
        } else {
          console.warn('⚠️ Unexpected applications response format:', responseData);
          console.log('Response keys:', Object.keys(responseData || {}));
          console.log('Data keys:', Object.keys(responseData?.data || {}));
        }
      } else {
        console.error('❌ Applications API call failed:', appsRes.reason);
      }
      
      // Handle activities data - check both new and old API response formats
      let activitiesData = [];
      if (activitiesRes.status === 'fulfilled') {
        const responseData = activitiesRes.value?.data;
        console.log('🔍 Activities API Response:', responseData);
        
        // The backend returns: { success: true, data: { activities: [...], pagination: {...} } }
        if (responseData?.data?.activities && Array.isArray(responseData.data.activities)) {
          activitiesData = responseData.data.activities; // Correct format from sendSuccess
          console.log('✅ Using sendSuccess format for activities:', activitiesData.length, 'items');
        } else if (responseData?.activities && Array.isArray(responseData.activities)) {
          activitiesData = responseData.activities; // Alternative format
          console.log('✅ Using alternative format for activities:', activitiesData.length, 'items');
        } else if (Array.isArray(responseData)) {
          activitiesData = responseData; // Direct array format
          console.log('✅ Using direct array format for activities:', activitiesData.length, 'items');
        } else {
          console.warn('⚠️ Unexpected activities response format:', responseData);
          console.log('Response keys:', Object.keys(responseData || {}));
          console.log('Data keys:', Object.keys(responseData?.data || {}));
        }
      } else {
        console.error('❌ Activities API call failed:', activitiesRes.reason);
      }
      
      // Handle events data - check both new and old API response formats
      let eventsData = [];
      if (eventsRes.status === 'fulfilled') {
        const responseData = eventsRes.value?.data;
        console.log('🔍 Events API Response:', responseData);
        
        // The backend returns: { success: true, data: { events: [...], pagination: {...} } }
        if (responseData?.data?.events && Array.isArray(responseData.data.events)) {
          eventsData = responseData.data.events; // Correct format from sendSuccess
          console.log('✅ Using sendSuccess format for events:', eventsData.length, 'items');
        } else if (responseData?.events && Array.isArray(responseData.events)) {
          eventsData = responseData.events; // Alternative format
          console.log('✅ Using alternative format for events:', eventsData.length, 'items');
        } else if (Array.isArray(responseData)) {
          eventsData = responseData; // Direct array format
          console.log('✅ Using direct array format for events:', eventsData.length, 'items');
        } else {
          console.warn('⚠️ Unexpected events response format:', responseData);
          console.log('Response keys:', Object.keys(responseData || {}));
          console.log('Data keys:', Object.keys(responseData?.data || {}));
        }
      } else {
        console.error('❌ Events API call failed:', eventsRes.reason);
      }

      setUsers(usersData);
      setApplications(appsData);
      setActivities(activitiesData);
      setEvents(eventsData);

      // Debug: Log final data being set
      console.log('🎯 Final data being set in admin dashboard:');
      console.log('- Users:', usersData.length, 'items');
      console.log('- Applications:', appsData.length, 'items');
      console.log('- Activities:', activitiesData.length, 'items');
      console.log('- Events:', eventsData.length, 'items');

      const newStats = {
        totalUsers: usersData.length,
        pendingApplications: (Array.isArray(appsData) ? appsData : []).filter(a => a.status === 'pending').length,
        approvedApplications: (Array.isArray(appsData) ? appsData : []).filter(a => a.status === 'approved_by_wpo').length,
        activeActivities: activitiesData.length,
        totalEvents: eventsData.length,
        recentBookings: 45, // placeholder until you wire bookings
        systemHealth: 'Good'
      };
      
      setStats(newStats);
      console.log('✅ Admin data loaded successfully:', newStats);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      
      // Retry logic for timeout errors
      if ((err.code === 'ECONNABORTED' || err.message.includes('timeout')) && retryCount < 2) {
        console.log(`Retrying fetchAllData (attempt ${retryCount + 2})...`);
        setTimeout(() => {
          fetchAllData(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Check if it's a timeout error
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timed out. The server is taking too long to respond. Please try again.');
      } else if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== Helpers =====
  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      wildlifeOfficer: 'bg-blue-100 text-blue-800',
      emergencyOfficer: 'bg-red-100 text-red-800',
      callOperator: 'bg-blue-100 text-blue-800',
      tourGuide: 'bg-yellow-100 text-yellow-800',
      safariDriver: 'bg-orange-100 text-orange-800',
      vet: 'bg-pink-100 text-pink-800',
      tourist: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const currency = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

  const avatarOf = (obj) => {
    const src = obj?.avatar || obj?.photo || obj?.profileImageUrl;
    if (src) return <img src={src} alt={obj?.name || obj?.fullName} className="w-10 h-10 rounded-full object-cover" />;
    const name = (obj?.name || obj?.fullName || 'U N').trim();
    const initials = name.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U';
    return (
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
        {initials}
      </div>
    );
  };

  // ===== Validation Functions =====
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          errors.firstName = 'First name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.firstName = 'First name can only contain letters and spaces';
        } else {
          delete errors.firstName;
        }
        break;
        
      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          errors.lastName = 'Last name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.lastName = 'Last name can only contain letters and spaces';
        } else {
          delete errors.lastName;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
        
      case 'phone':
        if (value.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(value.trim().replace(/[\s\-\(\)]/g, ''))) {
          errors.phone = 'Please enter a valid phone number';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'password':
        if (!value.trim()) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        } else {
          delete errors.password;
        }
        break;
        
      case 'specialization':
        if (value.trim() && value.trim().length < 3) {
          errors.specialization = 'Specialization must be at least 3 characters';
        } else {
          delete errors.specialization;
        }
        break;
        
      case 'experience':
        if (value.trim() && (!/^\d+$/.test(value.trim()) || parseInt(value.trim()) < 0)) {
          errors.experience = 'Experience must be a valid number (years)';
        } else {
          delete errors.experience;
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'password'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, newUser[field])) {
        isValid = false;
      }
    });
    
    // Validate optional fields if they have values
    if (newUser.phone.trim()) {
      if (!validateField('phone', newUser.phone)) {
        isValid = false;
      }
    }
    
    if (newUser.specialization.trim()) {
      if (!validateField('specialization', newUser.specialization)) {
        isValid = false;
      }
    }
    
    if (newUser.experience.trim()) {
      if (!validateField('experience', newUser.experience)) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleFieldChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    setTimeout(() => {
      validateField(field, value);
    }, 100);
  };

  // Edit User validation functions
  const validateEditField = (name, value) => {
    const errors = { ...editValidationErrors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.name = 'Name can only contain letters and spaces';
        } else {
          delete errors.name;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
        
      case 'phone':
        if (value.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(value.trim().replace(/[\s\-\(\)]/g, ''))) {
          errors.phone = 'Please enter a valid phone number';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'role':
        if (!value.trim()) {
          errors.role = 'Role is required';
        } else {
          delete errors.role;
        }
        break;
        
      default:
        break;
    }
    
    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const fields = ['name', 'email', 'role'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateEditField(field, editUser[field])) {
        isValid = false;
      }
    });
    
    // Validate optional fields if they have values
    if (editUser.phone.trim()) {
      if (!validateEditField('phone', editUser.phone)) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleEditFieldChange = (field, value) => {
    setEditUser(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    setTimeout(() => {
      validateEditField(field, value);
    }, 100);
  };

  // ===== CRUD Handlers =====
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setIsValidating(true);
      return;
    }
    
    setIsValidating(false);
    
    try {
      await protectedApi.createUser({ ...newUser, createdBy: user?.name || 'Admin' });
      setShowCreateModal(false);
      setNewUser({ firstName: '', lastName: '', email: '', role: 'tourGuide', password: '', phone: '', specialization: '', experience: '' });
      setValidationErrors({});
      fetchAllData();
      alert('User created successfully! Login credentials have been sent via email.');
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create user');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await protectedApi.updateUserRole(userId, newRole);
      fetchAllData();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await protectedApi.deactivateUser(userId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      setError('Failed to deactivate user');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || ''),
      email: user.email || '',
      role: user.role || '',
      phone: user.phone || ''
    });
    setEditValidationErrors({});
    setShowEditUserModal(true);
  };

  const handleViewTouristDetails = (tourist) => {
    setSelectedUser(tourist);
    setShowTouristDetailsModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    setIsEditValidating(true);
    const isValid = validateEditForm();
    
    if (!isValid) {
      setIsEditValidating(false);
      return;
    }
    
    try {
      await protectedApi.updateUser(selectedUser._id, editUser);
      setShowEditUserModal(false);
      setSelectedUser(null);
      setEditUser({ name: '', email: '', role: '', phone: '' });
      setEditValidationErrors({});
      fetchAllData();
      alert('User updated successfully!');
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Failed to update user');
    } finally {
      setIsEditValidating(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  const handleCreateAccountFromApplication = async (applicationId) => {
    // Find the application to show in modal
    const application = applications?.find(app => app._id === applicationId);
    if (application) {
      setSelectedApplication(application);
      setShowPasswordModal(true);
    }
  };

  const handleConfirmCreateAccount = async () => {
    try {
      const response = await protectedApi.createAccountFromApplication(selectedApplication._id, customPassword || null);
      alert('Account created successfully! Login credentials have been sent via email.');
      setShowPasswordModal(false);
      setCustomPassword('');
      setSelectedApplication(null);
      fetchAllData(); // Refresh data
    } catch (err) {
      console.error('Failed to create account from application:', err);
      setError('Failed to create account from application');
    }
  };

  const handleConfirmDeleteUser = async () => {
    try {
      console.log(`🗑️ Deleting user: ${selectedUser.name} (${selectedUser.email})`);
      const response = await protectedApi.deleteUser(selectedUser._id);
      console.log('✅ User deletion response:', response.data);
      
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      
      // Force refresh all data
      console.log('🔄 Refreshing all data after user deletion...');
      await fetchAllData();
      
      alert('User deleted successfully! All related data has been removed from the system.');
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

  const handleApproveApplication = async (appId) => {
    const application = applications.find(a => a._id === appId);
    if (!application) return;

    try {
      await protectedApi.updateApplicationStatus(appId, 'approved');
      // Split full name into first and last name
      const nameParts = application.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await protectedApi.createUser({
        firstName,
        lastName,
        email: application.email,
        role: application.vehicleType ? 'safariDriver' : 'tourGuide',
        phone: application.phone,
        experience: application.experience,
        skills: application.skills,
        languages: application.languages,
        createdBy: user?.name || 'Admin'
      });

      fetchAllData();
      alert('Application approved and user account created! Login credentials sent via email.');
    } catch (err) {
      console.error('Failed to approve application:', err);
      setError('Failed to approve application');
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      await protectedApi.updateApplicationStatus(appId, 'rejected');
      fetchAllData();
    } catch (err) {
      console.error('Failed to reject application:', err);
      setError('Failed to reject application');
    }
  };


  const handleImageUpload = (files) => {
    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      return validTypes.includes(file.type);
    });
    
    // Validate file sizes (5MB limit)
    const sizeValidFiles = validFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    // Check total image count (max 5)
    const currentCount = newActivity.images?.length || 0;
    const newCount = sizeValidFiles.length;
    
    if (currentCount + newCount > 5) {
      alert(`Maximum 5 images allowed. You currently have ${currentCount} images and are trying to add ${newCount} more.`);
      return;
    }
    
    // Show warnings for invalid files
    if (validFiles.length !== files.length) {
      alert('Some files were skipped because they are not valid image formats (JPG, PNG, GIF only).');
    }
    
    if (sizeValidFiles.length !== validFiles.length) {
      alert('Some files were skipped because they exceed the 5MB size limit.');
    }
    
    setNewActivity({ ...newActivity, images: [...(newActivity.images || []), ...sizeValidFiles] });
  };

  const handleEventImageUpload = (files) => {
    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      return validTypes.includes(file.type);
    });
    
    // Validate file sizes (5MB limit)
    const sizeValidFiles = validFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    // Check total image count (max 5)
    const currentCount = newEvent.images?.length || 0;
    const newCount = sizeValidFiles.length;
    
    if (currentCount + newCount > 5) {
      alert(`Maximum 5 images allowed. You currently have ${currentCount} images and are trying to add ${newCount} more.`);
      return;
    }
    
    // Show warnings for invalid files
    if (validFiles.length !== files.length) {
      alert('Some files were skipped because they are not valid image formats (JPG, PNG, GIF only).');
    }
    
    if (sizeValidFiles.length !== validFiles.length) {
      alert('Some files were skipped because they exceed the 5MB size limit.');
    }
    
    setNewEvent({ ...newEvent, images: [...(newEvent.images || []), ...sizeValidFiles] });
  };


  const handleCreateActivity = async (e) => {
    e.preventDefault();
    console.log('=== ACTIVITY FORM SUBMISSION STARTED ===');
    console.log('Form submitted with data:', newActivity);
    console.log('Event object:', e);
    
    // Validate form before submission
    console.log('Validating form...');
    const errors = validateActivityForm();
    setActivityErrors(errors);
    
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      console.log('=== ACTIVITY FORM VALIDATION FAILED ===');
      console.log('Validation errors:', errors);
      alert('Please fix the form errors before submitting.');
      return;
    }
    console.log('Form validation passed!');
    
    setIsSubmittingActivity(true);
    
    try {
      console.log('Attempting to create/update activity...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newActivity.name);
      formData.append('description', newActivity.description);
      formData.append('location', newActivity.location);
      formData.append('duration', newActivity.duration);
      formData.append('activityType', newActivity.category);
      formData.append('price', parseFloat(newActivity.price));
      formData.append('availableSlots', parseInt(newActivity.availableSlots));
      formData.append('requirements', newActivity.requirements || '');
      
      // Add images to FormData
      if (newActivity.images && newActivity.images.length > 0) {
        newActivity.images.forEach((image, index) => {
          formData.append('images', image);
        });
      }
      
      if (selectedActivity) {
        console.log('Updating activity:', selectedActivity._id);
        console.log('Sending update data with FormData');
        const updateResult = await protectedApi.updateActivity(selectedActivity._id, formData);
        console.log('Update result:', updateResult);
      } else {
        console.log('Creating new activity...');
        console.log('Sending activity data with FormData');
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        const createResult = await protectedApi.createActivity(formData);
        console.log('Create result:', createResult);
      }
      
      console.log('Activity saved successfully! Closing modal and refreshing data...');
      setShowActivityModal(false);
      setSelectedActivity(null);
      setNewActivity({
        name: '',
        description: '',
        price: '',
        duration: '',
        location: '',
        category: 'Safari',
        availableSlots: '',
        requirements: '',
        images: []
      });
      setActivityErrors({});
      await fetchAllData();
      alert(`Activity ${selectedActivity ? 'updated' : 'created'} successfully!`);
      console.log('=== ACTIVITY FORM SUBMISSION COMPLETED ===');
    } catch (err) {
      console.error('=== ACTIVITY FORM SUBMISSION FAILED ===');
      console.error('Failed to save activity:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to save activity: ' + (err.response?.data?.message || err.message));
      alert('Failed to save activity: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const errors = validateEventForm();
    setEventErrors(errors);
    
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      console.log('=== EVENT FORM VALIDATION FAILED ===');
      console.log('Validation errors:', errors);
      alert('Please fix the form errors before submitting.');
      return;
    }
    
    setIsSubmittingEvent(true);
    console.log('=== EVENT FORM SUBMISSION STARTED ===');
    console.log('Form submitted with data:', newEvent);
    
    
    try {
      console.log('Attempting to create/update event...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newEvent.title);
      formData.append('description', newEvent.description);
      formData.append('date', newEvent.date);
      formData.append('time', newEvent.time);
      formData.append('location', newEvent.location);
      formData.append('availableSlots', parseInt(newEvent.maxAttendees));
      formData.append('eventType', newEvent.category);
      formData.append('duration', '3 hours');
      
      // Add images to FormData
      if (newEvent.images && newEvent.images.length > 0) {
        newEvent.images.forEach((image, index) => {
          formData.append('images', image);
        });
      }
      
      if (selectedEvent) {
        console.log('Updating event:', selectedEvent._id);
        console.log('Sending update data with FormData');
        const updateResult = await protectedApi.updateEvent(selectedEvent._id, formData);
        console.log('Update result:', updateResult);
      } else {
        console.log('Creating new event...');
        console.log('Sending event data with FormData');
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        const createResult = await protectedApi.createEvent(formData);
        console.log('Create result:', createResult);
      }
      
      console.log('Event saved successfully! Closing modal and refreshing data...');
      setShowEventModal(false);
      setSelectedEvent(null);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxAttendees: '',
        category: 'educational',
        registrationFee: '',
        requirements: '',
        images: []
      });
      setEventErrors({});
      await fetchAllData();
      alert(`Event ${selectedEvent ? 'updated' : 'created'} successfully!`);
      console.log('=== EVENT FORM SUBMISSION COMPLETED ===');
    } catch (err) {
      console.error('=== EVENT FORM SUBMISSION FAILED ===');
      console.error('Failed to save event:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to save event: ' + (err.response?.data?.message || err.message));
      alert('Failed to save event: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await protectedApi.deleteActivity(activityId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete activity:', err);
      setError('Failed to delete activity');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await protectedApi.deleteEvent(eventId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event');
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setNewActivity({
      name: activity.name,
      description: activity.description,
      price: activity.price?.toString() || '',
      duration: activity.duration || '',
      location: activity.location || '',
      category: activity.activityType || activity.category || 'Safari',
      availableSlots: (activity.capacity || activity.availableSlots)?.toString() || '',
      requirements: activity.requirements || ''
    });
    setShowActivityModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title || '',
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      maxAttendees: event.maxAttendees?.toString() || '',
      category: event.category || 'educational',
      registrationFee: (event.registrationFee || 0).toString(),
      requirements: event.requirements || ''
    });
    setShowEventModal(true);
  };

  // ===== Derived lists for right panel =====
  const pendingApplicants = useMemo(
    () => (Array.isArray(applications) ? applications : []).filter(a => a.status === 'approved_by_wpo').slice(0, 6),
    [applications]
  );

  const approvedRecent = useMemo(
    () => (Array.isArray(applications) ? applications : [])
      .filter(a => a.status === 'approved_by_admin')
      .slice(-6)
      .reverse(),
    [applications]
  );


  // Role-based access control is handled by RoleGuard wrapper

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            {error && (
              <div className="mt-4">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={() => fetchAllData()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard requiredRole={isDebugAdmin ? null : "admin"}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />

      {/* Shell */}
      <div className="flex-1 pt-28 pb-10">
        <div className="mx-auto max-w-7xl px-4">
          {/* Grid: Sidebar | Main | Right */}
          <div className="grid grid-cols-12 gap-4">
            {/* LEFT SIDEBAR */}
            <aside className="col-span-12 lg:col-span-3">
              <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl lg:shadow-2xl p-4 lg:p-6 sticky top-20 lg:top-24 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                <div className="relative z-10">
                  {/* Mobile Header - Horizontal Layout */}
                  <div className="flex items-center justify-between lg:justify-start gap-3 mb-4 lg:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl shadow-lg">
                        <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-lg lg:text-xl font-bold text-gray-800">Admin Portal</div>
                        <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                      </div>
                      <div className="block sm:hidden">
                        <div className="text-sm font-bold text-gray-800">Admin</div>
                      </div>
                    </div>
                    {/* Mobile Menu Toggle - Hidden on desktop */}
                    <button className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                </div>

                {[
                  { key: 'overview', label: 'Overview', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                  )},
                  { key: 'users', label: 'Users', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  )},
                  { key: 'applications', label: 'Applications', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                  )},
                  { key: 'activities', label: 'Activities', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                  )},
                  { key: 'events', label: 'Events', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  )}
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setSidebarActive(item.key); if (['overview','users','applications','activities','events'].includes(item.key)) setActiveTab(item.key); }}
                    className={`group/item w-full flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl mb-1.5 lg:mb-2 transition-all duration-300 ${
                      sidebarActive === item.key 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 hover:shadow-md hover:scale-102'
                    }`}
                  >
                    <span className={`p-2 lg:p-2.5 rounded-lg lg:rounded-xl transition-all duration-300 ${
                      sidebarActive === item.key 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-500 group-hover/item:bg-blue-100 group-hover/item:text-blue-600'
                    }`}>
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {item.key === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                        {item.key === 'dashboard' && <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />}
                        {item.key === 'users' && <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
                        {item.key === 'applications' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />}
                        {item.key === 'activities' && <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />}
                        {item.key === 'events' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      </svg>
                    </span>
                    <span className={`text-xs lg:text-sm font-semibold transition-all duration-300 ${
                      sidebarActive === item.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                    {sidebarActive === item.key && (
                      <div className="ml-auto w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}

                <div className="mt-4 lg:mt-6 border-t border-gray-200/50 pt-3 lg:pt-4">
                  <RoleBasedFeature requiredRole="admin">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="hidden sm:inline">Create User</span>
                      <span className="sm:hidden">Create</span>
                    </button>
                  </RoleBasedFeature>
                </div>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="col-span-12 lg:col-span-9">
              {/* Top greeting banner */}
              <div className="mb-6">

                <div className="bg-blue-600 text-white rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
                      {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user?.name?.split(' ')[0] || 'Admin'}`}
                    </h2>
                    <p className="text-xs sm:text-sm opacity-90 mt-1">
                      You have {stats.pendingApplications} new applications. It's a lot of work for today!
                    </p>
                    <button
                      onClick={() => { setActiveTab('applications'); setSidebarActive('applications'); }}
                      className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm"
                    >
                      Review it
                    </button>
                  </div>
                  <div className="hidden md:block">
                    {/* simple illustration block */}
                    <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                  </div>
                </div>
              </div>


              {/* Tab buttons (for center area) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { k: 'overview', t: 'Overview' },
                  { k: 'users', t: 'User Management' },
                  { k: 'applications', t: 'Staff Applications' },
                  { k: 'activities', t: 'Activity Management' },
                  { k: 'events', t: 'Event Management' }
                ].map(({ k, t }) => (
                  <button
                    key={k}
                    onClick={() => { setActiveTab(k); setSidebarActive(k); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition
                    ${activeTab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CENTER PANELS (match your existing functionality, restyled) */}
              <div className="space-y-6">
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Modern Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Users</p>
                              <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{users.length}</p>
                              <p className="text-blue-200 text-xs mt-1">+12% from last month</p>
                            </div>
                            <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-medium">Active Activities</p>
                              <p className="text-4xl font-bold mt-2">{activities.length}</p>
                              <p className="text-blue-200 text-xs mt-1">+8% from last week</p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-indigo-100 text-sm font-medium">Activity Events</p>
                              <p className="text-4xl font-bold mt-2">{events.length}</p>
                              <p className="text-indigo-200 text-xs mt-1">+5% from last week</p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* User Distribution Pie Chart */}
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-bold text-gray-800">User Distribution</h4>
                              <div className="p-2 bg-blue-100 rounded-xl">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="p-8">
                            <div className="flex items-center justify-center mb-8">
                              <ModernPieChart 
                                data={[
                                  { label: 'System Users', value: users.filter(u => u.userType === 'system' || (!u.userType && u.role !== 'tourist')).length, color: '#10B981' },
                                  { label: 'Tourists', value: users.filter(u => u.userType === 'tourist' || u.role === 'tourist').length, color: '#3B82F6' }
                                ]}
                                size={220}
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mr-3 shadow-sm"></div>
                                  <span className="text-sm font-semibold text-gray-700">System Users</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{users.filter(u => u.userType === 'system' || (!u.userType && u.role !== 'tourist')).length}</span>
                              </div>
                              <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-200/50 transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full mr-3 shadow-sm"></div>
                                  <span className="text-sm font-semibold text-gray-700">Tourists</span>
                                </div>
                                <span className="text-lg font-bold text-indigo-600">{users.filter(u => u.userType === 'tourist' || u.role === 'tourist').length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Performance Metrics */}
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-bold text-gray-800">System Performance</h4>
                              <div className="p-2 bg-emerald-100 rounded-xl">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="p-8">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Server Response Time */}
                              <div className="text-center">
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#E5E7EB"
                                      strokeWidth="8"
                                      fill="none"
                                    />
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#10B981"
                                      strokeWidth="8"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 40}`}
                                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.85)}`}
                                      className="transition-all duration-1000 ease-out"
                                      style={{
                                        strokeLinecap: 'round',
                                        filter: 'drop-shadow(0 0 6px #10B981)'
                                      }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-800">85%</span>
                                  </div>
                                </div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Server Uptime</h5>
                                <p className="text-xs text-gray-500">Excellent</p>
                              </div>

                              {/* Database Performance */}
                              <div className="text-center">
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#E5E7EB"
                                      strokeWidth="8"
                                      fill="none"
                                    />
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#3B82F6"
                                      strokeWidth="8"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 40}`}
                                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.92)}`}
                                      className="transition-all duration-1000 ease-out"
                                      style={{
                                        strokeLinecap: 'round',
                                        filter: 'drop-shadow(0 0 6px #3B82F6)'
                                      }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-800">92%</span>
                                  </div>
                                </div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">DB Performance</h5>
                                <p className="text-xs text-gray-500">Optimal</p>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Response Time</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">142ms</span>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">68%</span>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                                </div>
                                <span className="text-sm font-bold text-purple-600">45%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Trends Line Chart */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50"></div>
                      <div className="relative z-10">
                        <div className="px-8 py-6 border-b border-gray-100/50">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold text-gray-800">Activity Trends (Last 7 Days)</h4>
                            <div className="p-2 bg-indigo-100 rounded-xl">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-8">
                          <ModernLineChart 
                            data={[
                              { day: 'Mon', users: 12, activities: 8, events: 3 },
                              { day: 'Tue', users: 15, activities: 12, events: 5 },
                              { day: 'Wed', users: 18, activities: 10, events: 4 },
                              { day: 'Thu', users: 22, activities: 15, events: 7 },
                              { day: 'Fri', users: 25, activities: 18, events: 9 },
                              { day: 'Sat', users: 20, activities: 14, events: 6 },
                              { day: 'Sun', users: 16, activities: 11, events: 4 }
                            ]}
                            height={320}
                          />
                        </div>
                      </div>
                    </div>

                    {/* System Health & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-gray-100/50 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                        <div className="relative z-10 p-8">
                          <div className="flex items-center mb-6">
                            <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">System Health</h4>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                              <span className="text-gray-700 font-medium">Database Status</span>
                              <span className="flex items-center text-green-600">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="font-semibold">Online</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                              <span className="text-gray-700 font-medium">API Response</span>
                              <span className="flex items-center text-green-600">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="font-semibold">Normal</span>
                              </span>
                            </div>
                            <div className="p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-medium">Storage Usage</span>
                                <span className="text-gray-800 font-bold">45%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out" style={{width: '45%'}}></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm">
                              <span className="text-gray-700 font-medium">Active Sessions</span>
                              <span className="text-gray-800 font-bold">{users.filter(u => u.isOnline).length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-gray-100/50 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                        <div className="relative z-10 p-8">
                          <div className="flex items-center mb-6">
                            <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />
                              </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Recent Applications</h4>
                          </div>
                          <div className="space-y-4">
                            {applications
                              .sort((a, b) => new Date(b.createdAt || b.submittedAt || Date.now()) - new Date(a.createdAt || a.submittedAt || Date.now()))
                              .slice(0, 5)
                              .map((app, index) => (
                              <div key={app._id} className="group/item flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {app.name || 
                                       app.fullName || 
                                       (app.firstname && app.lastname ? `${app.firstname} ${app.lastname}` : 
                                        app.firstname || app.lastname || 'Unknown Applicant')}
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {app.email || 'No email provided'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Applied: {app.createdAt || app.submittedAt ? new Date(app.createdAt || app.submittedAt).toLocaleDateString() : 'Recently'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  app.status === 'pending' || app.status === 'Submitted' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200' :
                                  app.status === 'approved' || app.status === 'ApprovedByWPO' || app.status === 'AccountCreated' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' :
                                  app.status === 'rejected' || app.status === 'RejectedByWPO' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200' :
                                  'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {app.status === 'Submitted' ? 'Pending' :
                                   app.status === 'ApprovedByWPO' ? 'Approved' :
                                   app.status === 'AccountCreated' ? 'Account Created' :
                                   app.status === 'RejectedByWPO' ? 'Rejected' :
                                   app.status || 'Pending'}
                                </span>
                              </div>
                            ))}
                            {applications.length === 0 && (
                              <div className="text-center py-12">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Applications Yet</h3>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                  New staff applications will appear here when they are submitted. Check back later for updates.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                  <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                    <div className="relative z-10">
                      <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-gray-100/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl lg:text-2xl font-bold text-gray-800">User Management</h3>
                              <p className="text-sm text-gray-500">Manage system users and tourists</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            onClick={() => fetchAllData()} 
                              className="group flex items-center gap-2 px-4 py-2.5 bg-white/60 hover:bg-white/80 text-blue-600 hover:text-blue-700 text-sm font-semibold rounded-xl border border-blue-200/50 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            disabled={loading}
                          >
                              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {loading ? 'Loading...' : 'Refresh All Users'}
                          </button>
                            <button 
                              onClick={() => setShowCreateModal(true)} 
                              className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                            >
                              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create System User
                            </button>
                        </div>
                      </div>
                      
                      {/* User Summary */}
                      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                          <div>
                                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{users.length}</p>
                                <p className="text-blue-200 text-xs mt-1">All registered users</p>
                          </div>
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-4 lg:p-6 text-white shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                          <div>
                                <p className="text-cyan-100 text-sm font-medium">System Users</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{users.filter(u => u.userType === 'system' || (!u.userType && u.role !== 'tourist')).length}</p>
                                <p className="text-cyan-200 text-xs mt-1">Admin & staff</p>
                          </div>
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4 lg:p-6 text-white shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                          <div>
                                <p className="text-blue-100 text-sm font-medium">Tourists</p>
                                <p className="text-2xl lg:text-3xl font-bold mt-1">{users.filter(u => u.userType === 'tourist' || u.role === 'tourist').length}</p>
                                <p className="text-blue-200 text-xs mt-1">Visitors & guests</p>
                              </div>
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Type Filter Tabs */}
                      <div className="flex flex-wrap gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-2xl border border-white/50">
                        <button
                          onClick={() => setUserTypeFilter('all')}
                          className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                            userTypeFilter === 'all' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105' 
                              : 'bg-white/60 text-gray-600 hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          All Users ({users.length})
                        </button>
                        <button
                          onClick={() => setUserTypeFilter('system')}
                          className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                            userTypeFilter === 'system' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105' 
                              : 'bg-white/60 text-gray-600 hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          System Users ({users.filter(u => u.userType === 'system' || (!u.userType && u.role !== 'tourist')).length})
                        </button>
                        <button
                          onClick={() => setUserTypeFilter('tourist')}
                          className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                            userTypeFilter === 'tourist' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105' 
                              : 'bg-white/60 text-gray-600 hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Tourists ({users.filter(u => u.userType === 'tourist' || u.role === 'tourist').length})
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-white/20">
                      <table className="w-full divide-y divide-gray-100/50 min-w-[1000px]">
                        <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                          <tr>
                            {['👤 User Details', '📧 Contact', '🎯 Role', '📊 Status', '⚡ Actions'].map((h, index) => (
                              <th key={h} className={`px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider ${
                                index === 0 ? 'w-1/4' : 
                                index === 1 ? 'w-1/4' : 
                                index === 2 ? 'w-1/6' : 
                                index === 3 ? 'w-1/6' : 
                                'w-1/6'
                              }`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-100/50">
                          {users
                            .filter(u => {
                              // User type filter
                              if (userTypeFilter === 'all') return true;
                              if (userTypeFilter === 'system') {
                                return (u.userType === 'system' || (!u.userType && u.role !== 'tourist'));
                              }
                              if (userTypeFilter === 'tourist') {
                                return (u.userType === 'tourist' || u.role === 'tourist');
                              }
                              return true;
                            })
                            .map(u => (
                            <tr key={u._id} className="group hover:bg-white/80 transition-all duration-300 hover:shadow-sm">
                              {/* User Details */}
                              <td className="px-6 py-4 w-1/4">
                                <div className="flex items-center gap-3">
                                  {avatarOf(u)}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.lastName || 'No Name')}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                      <span>ID: {u._id?.slice(-8)}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        u.userType === 'tourist' || u.role === 'tourist' 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {u.userType === 'tourist' || u.role === 'tourist' ? '🧳 Tourist' : '👨‍💼 Staff'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Contact */}
                              <td className="px-6 py-4 w-1/4">
                                <div className="min-w-0">
                                  <div className="text-sm text-gray-900 truncate">{u.email}</div>
                                <div className="text-xs text-gray-500">{u.phone || 'No phone'}</div>
                                </div>
                              </td>
                              
                              {/* Role */}
                              <td className="px-6 py-4 w-1/6">
                                <div className="space-y-1">
                                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>
                                    {u.role}
                                  </span>
                                  {u.specialization && (
                                    <div className="text-xs text-gray-600 truncate">{u.specialization}</div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Status */}
                              <td className="px-6 py-4 w-1/6">
                                <div className="space-y-2">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-300 ${
                                    u.isActive !== false 
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 shadow-sm' 
                                      : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50 shadow-sm'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {u.isActive !== false ? 'Active' : 'Inactive'}
                                  </span>
                                  {u.role === 'safariDriver' && (
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${
                                      u.isAvailable 
                                        ? 'bg-blue-50/80 text-blue-700 border border-blue-200/50' 
                                        : 'bg-orange-50/80 text-orange-700 border border-orange-200/50'
                                    }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${u.isAvailable ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                      {u.isAvailable ? 'Available' : 'Busy'}
                                    </div>
                                  )}
                                  {u.role === 'tourGuide' && (
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${
                                      u.isAvailable 
                                        ? 'bg-blue-50/80 text-blue-700 border border-blue-200/50' 
                                        : 'bg-orange-50/80 text-orange-700 border border-orange-200/50'
                                    }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${u.isAvailable ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                      {u.isAvailable ? 'Available' : 'Busy'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 w-1/6 text-sm font-medium">
                                <div className="flex flex-wrap gap-2">
                                  {(u.userType !== 'tourist' && u.role !== 'tourist') && (
                                    <RoleBasedFeature requiredRole={isDebugAdmin ? null : "admin"}>
                                      <button
                                        onClick={() => handleEditUser(u)}
                                        className="group flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50/80 hover:bg-green-100/80 rounded-lg border border-green-200/50 hover:border-green-300/50 transition-all duration-300 hover:shadow-md hover:scale-105"
                                      >
                                        <svg className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                    </RoleBasedFeature>
                                  )}
                                  
                                  {/* System User Actions */}
                                  {(u.userType === 'system' || (!u.userType && u.role !== 'tourist')) && (
                                    <RoleBasedFeature requiredRole={isDebugAdmin ? null : "admin"}>
                                      <button
                                        onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                                        className="group flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 rounded-lg border border-blue-200/50 hover:border-blue-300/50 transition-all duration-300 hover:shadow-md hover:scale-105"
                                      >
                                        <svg className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Role
                                      </button>
                                    </RoleBasedFeature>
                                  )}
                                  
                                  {/* Tourist Actions */}
                                  {(u.userType === 'tourist' || u.role === 'tourist') && (
                                    <RoleBasedFeature requiredRole={isDebugAdmin ? null : "admin"}>
                                      <button
                                        onClick={() => handleViewTouristDetails(u)}
                                        className="group flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50/80 hover:bg-green-100/80 rounded-lg border border-green-200/50 hover:border-green-300/50 transition-all duration-300 hover:shadow-md hover:scale-105"
                                      >
                                        <svg className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                      </button>
                                    </RoleBasedFeature>
                                  )}
                                  
                                  <RoleBasedFeature 
                                    requiredRole={isDebugAdmin ? null : "admin"}
                                    fallback={
                                      <div className="text-gray-400 text-xs">
                                        <div>Role: {user?.role || 'Unknown'}</div>
                                        <div>Admin required</div>
                                      </div>
                                    }
                                    hideIfNoAccess={false}
                                  >
                                    {u.role !== 'admin' && (
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </RoleBasedFeature>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </div>
                  </div>
                )}

                {/* APPLICATIONS */}
                {activeTab === 'applications' && (
                  <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                    <div className="relative z-10">
                      <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-gray-100/50">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-800">Staff Applications</h3>
                            <p className="text-sm text-gray-500">Review and manage staff applications</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 lg:p-8 space-y-6">
                    {(Array.isArray(applications) ? applications : []).map(app => (
                          <div key={app._id} className="group/card relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            <div className="relative z-10 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                            {avatarOf({ ...app, name: `${app.firstname} ${app.lastname}` })}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                                  </div>
                            <div>
                                    <h4 className="text-lg font-bold text-gray-900">{app.firstname} {app.lastname}</h4>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {app.email}
                                    </div>
                            </div>
                          </div>
                          <span
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300
                                  ${app.status === 'Submitted' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200/50' :
                                    app.status === 'ApprovedByWPO' ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50' :
                                    app.status === 'AccountCreated' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50' :
                                    app.status === 'RejectedByWPO' ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50' :
                                    'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200/50'}`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${
                                    app.status === 'Submitted' ? 'bg-yellow-500' :
                                    app.status === 'ApprovedByWPO' ? 'bg-green-500' :
                                    app.status === 'AccountCreated' ? 'bg-blue-500' :
                                    app.status === 'RejectedByWPO' ? 'bg-red-500' :
                                    'bg-gray-500'
                                  }`}></div>
                                  {app.status === 'Submitted' ? 'Pending Review' :
                                   app.status === 'ApprovedByWPO' ? 'Approved' :
                                   app.status === 'AccountCreated' ? 'Account Created' :
                                   app.status === 'RejectedByWPO' ? 'Rejected' :
                             app.status}
                          </span>
                        </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-500">Phone</div>
                                    <div className="text-sm font-semibold text-gray-800">{app.phone || 'Not provided'}</div>
                                  </div>
                                </div>

                                <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-500">Position</div>
                                    <div className="text-sm font-semibold text-gray-800">{app.role === 'Driver' ? 'Safari Driver' : 'Tour Guide'}</div>
                                  </div>
                                </div>

                          {app.role === 'TourGuide' ? (
                            <>
                                    <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                      <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-gray-500">Registration</div>
                                        <div className="text-sm font-semibold text-gray-800">{app.Guide_Registration_No || 'Not provided'}</div>
                                      </div>
                                    </div>

                                    <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                      <div className="p-2 bg-orange-100 rounded-lg">
                                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-gray-500">Experience</div>
                                        <div className="text-sm font-semibold text-gray-800">{app.Experience_Year || 0} years</div>
                                      </div>
                                    </div>
                            </>
                          ) : (
                            <>
                                    <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                      <div className="p-2 bg-indigo-100 rounded-lg">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-gray-500">Vehicle Type</div>
                                        <div className="text-sm font-semibold text-gray-800">{app.vehicleType || 'Not specified'}</div>
                                      </div>
                                    </div>

                                    <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                      <div className="p-2 bg-teal-100 rounded-lg">
                                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-gray-500">License</div>
                                        <div className="text-sm font-semibold text-gray-800">{app.LicenceNumber || 'Not provided'}</div>
                                      </div>
                                    </div>
                            </>
                          )}

                                <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                  <div className="p-2 bg-pink-100 rounded-lg">
                                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-500">Applied</div>
                                    <div className="text-sm font-semibold text-gray-800">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}</div>
                                  </div>
                                </div>

                                {app.vehicleNumber && (
                                  <div className="group/item flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md">
                                    <div className="p-2 bg-cyan-100 rounded-lg">
                                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500">Vehicle Number</div>
                                      <div className="text-sm font-semibold text-gray-800">{app.vehicleNumber}</div>
                                    </div>
                                  </div>
                                )}
                        </div>

                        {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowPasswordModal(true);
                            }}
                                  className="group flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-white/60 hover:bg-white/80 text-gray-700 hover:text-gray-800 rounded-xl border border-gray-200/50 hover:border-gray-300/50 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                                >
                                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                          </button>
                          
                          {app.status === 'ApprovedByWPO' && (
                            <button
                              onClick={() => handleCreateAccountFromApplication(app._id)}
                                    className="group flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                            >
                                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Account
                            </button>
                          )}
                        </div>

                        {/* Status Messages */}
                        {app.status === 'ApprovedByWPO' && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-green-800">Approved by Wildlife Officer</div>
                                      <div className="text-xs text-green-600">Ready for Account Creation</div>
                                    </div>
                                  </div>
                          </div>
                        )}
                        
                        {app.status === 'Submitted' && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200/50">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-yellow-800">Pending Review</div>
                                      <div className="text-xs text-yellow-600">Awaiting Wildlife Officer Review</div>
                                    </div>
                                  </div>
                          </div>
                        )}
                        
                        {app.status === 'AccountCreated' && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-blue-800">Account Created</div>
                                      <div className="text-xs text-blue-600">Successfully processed</div>
                                    </div>
                                  </div>
                          </div>
                        )}

                        {app.status === 'RejectedByWPO' && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200/50">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-red-800">Rejected</div>
                                      <div className="text-xs text-red-600">Application not approved</div>
                                    </div>
                                  </div>
                          </div>
                        )}
                            </div>
                      </div>
                    ))}

                    {applications.length === 0 && (
                          <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Applications Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">Staff applications will appear here when submitted. Check back later for new submissions.</p>
                      </div>
                    )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVITIES */}
                {activeTab === 'activities' && (
                  <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                    <div className="relative z-10">
                      <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-gray-100/50">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-800">Activity Management</h3>
                            <p className="text-sm text-gray-500">Manage and monitor all activities</p>
                          </div>
                        </div>
                    </div>

                      <div className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {(Array.isArray(activities) ? activities : []).map(a => (
                            <div key={a._id} className="group/card relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.02]">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              <div className="relative z-10 p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">{a.title || a.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {a.duration}
                                  </div>
                                  </div>
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                  <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600">Category</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 capitalize">{a.category || a.activityType}</span>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-green-100 rounded-lg">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600">Price</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{currency(a.price)}</span>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-orange-100 rounded-lg">
                                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600">Available Slots</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{a.maxParticipants || a.dailySlots || a.capacity || a.availableSlots || 0}</span>
                                  </div>

                                  <div className="flex items-start justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-600">Location</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-gray-800">
                                  {typeof a.location === 'object' && a.location !== null 
                                    ? `${a.location.venue || ''} ${a.location.address || ''}`.trim()
                                    : a.location || '-'
                                  }
                                    </div>
                                  </div>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button 
                                    onClick={() => handleDeleteActivity(a._id)} 
                                    className="group flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-red-50/80 hover:bg-red-100/80 text-red-600 hover:text-red-700 rounded-xl border border-red-200/50 hover:border-red-300/50 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                                  >
                                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                        {activities.length === 0 && (
                          <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Activities Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">Activities will appear here when they are created. Start by adding some exciting activities for your users.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* EVENTS */}
                {activeTab === 'events' && (
                  <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-cyan-50/30"></div>
                    <div className="relative z-10">
                      <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-gray-100/50">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-800">Event Management</h3>
                            <p className="text-sm text-gray-500">Manage and monitor all events</p>
                          </div>
                        </div>
                    </div>

                      <div className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {(Array.isArray(events) ? events : []).map(ev => (
                            <div key={ev._id} className="group/card relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.02]">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              <div className="relative z-10">
                                {/* Event Image */}
                                <div className="relative h-48 overflow-hidden">
                                      <img
                                        src={
                                          ev.imageUrl ||
                                          (ev.images && ev.images.length > 0
                                            ? (typeof ev.images[0] === 'string' ? ev.images[0] : (ev.images[0]?.url || null))
                                            : null
                                          ) ||
                                          'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=200&auto=format&fit=crop'
                                        }
                                        alt={ev.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=200&auto=format&fit=crop';
                                        }}
                                      />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                  <div className="absolute top-4 right-4">
                                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-6">
                                  <div className="mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{ev.title}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                        {typeof ev.location === 'object' && ev.location !== null 
                                          ? `${ev.location.venue || ''} ${ev.location.address || ''}`.trim()
                                          : ev.location || '-'
                                        }
                                      </div>
                                    </div>

                                  <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                  </div>
                                        <span className="text-sm font-medium text-gray-600">Date & Time</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-800">{ev.date ? new Date(ev.date).toLocaleDateString() : '-'}</div>
                                        <div className="text-xs text-gray-500">{ev.time || '-'}</div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-100 rounded-lg">
                                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Category</span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800 capitalize">{ev.category}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-green-100 rounded-lg">
                                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Registration Fee</span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800">{currency(ev.price || ev.registrationFee || 0)}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-orange-100 rounded-lg">
                                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Attendees</span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800">{(ev.registrations?.length || 0)}/{ev.maxSlots || ev.maxAttendees || 0}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <button 
                                      onClick={() => handleDeleteEvent(ev._id)} 
                                      className="group flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-red-50/80 hover:bg-red-100/80 text-red-600 hover:text-red-700 rounded-xl border border-red-200/50 hover:border-red-300/50 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                                    >
                                      <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                        {events.length === 0 && (
                          <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                              <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Events Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">Events will appear here when they are created. Start by adding some exciting events for your users.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </main>

            {/* RIGHT WIDGETS */}
            <aside className="col-span-12 md:col-span-2">
              <div className="space-y-6">
                {/* Right sidebar content can be added here in the future */}

              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ===== Modals ===== */}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="" size="lg">
          <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
            <div className="relative z-10">
              {/* Modern Header */}
              <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-gray-100/50">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-800">Create User Account</h3>
                    <p className="text-sm text-gray-500">Add a new team member to the system</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 lg:p-8 space-y-6">
                {/* Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      First Name *
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newUser.firstName} 
                        onChange={(e) => handleFieldChange('firstName', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.firstName 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.firstName.trim() && !validationErrors.firstName
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter first name"
                        required 
                      />
                      {newUser.firstName.trim() && !validationErrors.firstName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.firstName && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.firstName}
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Last Name *
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newUser.lastName} 
                        onChange={(e) => handleFieldChange('lastName', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.lastName 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.lastName.trim() && !validationErrors.lastName
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter last name"
                        required 
                      />
                      {newUser.lastName.trim() && !validationErrors.lastName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.lastName && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.lastName}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address *
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={newUser.email} 
                        onChange={(e) => handleFieldChange('email', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.email 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.email.trim() && !validationErrors.email
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter email address"
                        required 
                      />
                      {newUser.email.trim() && !validationErrors.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.email && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone Number
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={newUser.phone} 
                        onChange={(e) => handleFieldChange('phone', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.phone 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.phone.trim() && !validationErrors.phone
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter phone number (optional)"
                      />
                      {newUser.phone.trim() && !validationErrors.phone && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.phone && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.phone}
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                      Role *
                    </label>
                    <div className="relative">
                      <select 
                        value={newUser.role} 
                        onChange={(e) => handleFieldChange('role', e.target.value)} 
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/80 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="tourGuide">Tour Guide</option>
                        <option value="safariDriver">Safari Driver</option>
                        <option value="wildlifeOfficer">Wildlife Park Officer</option>
                        <option value="emergencyOfficer">Emergency Officer</option>
                        <option value="callOperator">Call Operator</option>
                        <option value="vet">Veterinarian</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Specialization
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newUser.specialization} 
                        onChange={(e) => handleFieldChange('specialization', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.specialization 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.specialization.trim() && !validationErrors.specialization
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter specialization (optional)"
                      />
                      {newUser.specialization.trim() && !validationErrors.specialization && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.specialization && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.specialization}
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Experience (Years)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={newUser.experience} 
                        onChange={(e) => handleFieldChange('experience', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.experience 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.experience.trim() && !validationErrors.experience
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter years of experience (optional)"
                        min="0"
                      />
                      {newUser.experience.trim() && !validationErrors.experience && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.experience && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.experience}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2 lg:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Temporary Password *
                    </label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={newUser.password} 
                        onChange={(e) => handleFieldChange('password', e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                          validationErrors.password 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-100' 
                            : newUser.password.trim() && !validationErrors.password
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 bg-white/80 focus:border-green-500 focus:ring-green-100'
                        }`}
                        placeholder="Enter temporary password (will be sent via email)"
                        required 
                      />
                      {newUser.password.trim() && !validationErrors.password && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {validationErrors.password && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {validationErrors.password}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Password must contain at least 8 characters with uppercase, lowercase, and number
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100/50">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setValidationErrors({});
                      setNewUser({ firstName: '', lastName: '', email: '', role: 'tourGuide', password: '', phone: '', specialization: '', experience: '' });
                    }} 
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 hover:text-gray-800 rounded-xl border border-gray-200/50 hover:border-gray-300/50 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={Object.keys(validationErrors).length > 0 || isValidating}
                    className="group flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isValidating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Validating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Activity Modal */}
      {showActivityModal && (
        <Modal onClose={() => setShowActivityModal(false)} title={selectedActivity ? 'Edit Activity' : 'Create New Activity'} size="8xl">
          <form onSubmit={handleCreateActivity} className="space-y-6">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedActivity ? 'Edit Activity' : 'Create New Activity'}</h2>
                    <p className="text-emerald-100">Design an amazing wildlife experience</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-100">Form Progress</div>
                  <div className="text-lg font-bold">
                    {Object.values(activityErrors).filter(error => error === '').length} of {Object.keys(activityErrors).length}
                  </div>
                </div>
              </div>
              <div className="mt-4 w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${Object.keys(activityErrors).length > 0 ? 
                      (Object.values(activityErrors).filter(error => error === '').length / Object.keys(activityErrors).length) * 100 : 
                      0}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Main Form Grid - 3 columns for better space utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
                      <p className="text-sm text-gray-600">Tell us about your activity</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Activity Name *
                      </label>
                      <input 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          activityErrors.name 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400 bg-white hover:border-gray-300'
                        }`}
                        value={newActivity.name} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, name: e.target.value });
                          const error = validateActivityField('name', e.target.value);
                          setActivityErrors({ ...activityErrors, name: error });
                        }}
                        onBlur={(e) => {
                          const error = validateActivityField('name', e.target.value);
                          setActivityErrors({ ...activityErrors, name: error });
                        }}
                        placeholder="e.g., Safari Adventure, Bird Watching Tour"
                        required 
                      />
                      {activityErrors.name && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {activityErrors.name}
                        </div>
                      )}
                    </div>

                    <Field label="Activity Type *">
                      <select 
                        className={`Input ${activityErrors.category ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                        value={newActivity.category} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, category: e.target.value });
                          if (activityErrors.category) setActivityErrors({ ...activityErrors, category: '' });
                        }}
                      >
                        <option value="">Select activity type</option>
                        <option value="Safari">🦁 Safari</option>
                        <option value="Bird Watching">🐦 Bird Watching</option>
                        <option value="Photography">📸 Photography</option>
                        <option value="Accommodations">🏨 Accommodations</option>
                        <option value="Tree house">🌳 Tree house</option>
                        <option value="Other">🔧 Other</option>
                      </select>
                      {activityErrors.category && <p className="text-red-500 text-sm mt-2">{activityErrors.category}</p>}
                    </Field>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description *
                        <span className="ml-auto text-xs text-gray-500">
                          {newActivity.description?.length || 0}/500
                        </span>
                      </label>
                      <textarea 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 resize-none ${
                          activityErrors.description 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400 bg-white hover:border-gray-300'
                        }`}
                        rows={4} 
                        value={newActivity.description} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, description: e.target.value });
                          if (activityErrors.description) setActivityErrors({ ...activityErrors, description: '' });
                        }}
                        onBlur={(e) => {
                          const error = validateActivityField('description', e.target.value);
                          setActivityErrors({ ...activityErrors, description: error });
                        }}
                        placeholder="Describe what participants will experience, what they'll see, and what makes this activity special..."
                        required 
                      />
                      <p className="text-gray-500 text-sm">Min 20 words</p>
                      {activityErrors.description && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {activityErrors.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Duration */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Pricing & Duration</h3>
                      <p className="text-sm text-gray-600">Set pricing and timing details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <Field label="Price (LKR) *">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">LKR</span>
                        <input 
                          type="number" 
                          className={`Input pl-16 ${activityErrors.price ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                          value={newActivity.price} 
                          onChange={(e) => {
                            setNewActivity({ ...newActivity, price: e.target.value });
                            if (activityErrors.price) setActivityErrors({ ...activityErrors, price: '' });
                          }}
                          onBlur={(e) => {
                            const error = validateActivityField('price', e.target.value);
                            setActivityErrors({ ...activityErrors, price: error });
                          }}
                          placeholder="0"
                          min="0"
                          step="1"
                          required 
                        />
                      </div>
                      <p className="text-gray-500 text-sm mt-2">Enter 0 for free activities</p>
                      {activityErrors.price && <p className="text-red-500 text-sm mt-2">{activityErrors.price}</p>}
                    </Field>

                    <Field label="Duration *">
                      <input 
                        className={`Input ${activityErrors.duration ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                        placeholder="e.g., 2 hours, 1 day" 
                        value={newActivity.duration} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, duration: e.target.value });
                          if (activityErrors.duration) setActivityErrors({ ...activityErrors, duration: '' });
                        }}
                        required 
                      />
                      <p className="text-gray-500 text-sm mt-2">Be specific about time</p>
                      {activityErrors.duration && <p className="text-red-500 text-sm mt-2">{activityErrors.duration}</p>}
                    </Field>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Capacity & Location */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Capacity & Location
                  </h3>
                  
                  <div className="space-y-6">
                    <Field label="Available Slots *">
                      <input 
                        type="number" 
                        className={`Input ${activityErrors.availableSlots ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                        value={newActivity.availableSlots} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, availableSlots: e.target.value });
                          if (activityErrors.availableSlots) setActivityErrors({ ...activityErrors, availableSlots: '' });
                        }}
                        placeholder="15"
                        min="0"
                        required 
                      />
                      <p className="text-gray-500 text-sm mt-2">Number of available slots for this activity</p>
                      {activityErrors.availableSlots && <p className="text-red-500 text-sm mt-2">{activityErrors.availableSlots}</p>}
                    </Field>

                    <Field label="Location *">
                      <input 
                        className={`Input ${activityErrors.location ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                        value={newActivity.location} 
                        onChange={(e) => {
                          setNewActivity({ ...newActivity, location: e.target.value });
                          if (activityErrors.location) setActivityErrors({ ...activityErrors, location: '' });
                        }}
                        placeholder="e.g., Yala National Park, Colombo"
                        required 
                      />
                      <p className="text-gray-500 text-sm mt-2">Meeting point or area</p>
                      {activityErrors.location && <p className="text-red-500 text-sm mt-2">{activityErrors.location}</p>}
                    </Field>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Additional Information
                  </h3>
                  
                  <Field label="Requirements & Guidelines">
                    <textarea 
                      rows={6} 
                      className="Input focus:ring-blue-200" 
                      value={newActivity.requirements} 
                      onChange={(e) => setNewActivity({ ...newActivity, requirements: e.target.value })}
                      placeholder="e.g., Bring water bottle, wear comfortable shoes, minimum age 12..."
                    />
                    <p className="text-gray-500 text-sm mt-2">Special requirements, what to bring, age restrictions</p>
                  </Field>
                </div>
              </div>
            </div>

        {/* Image Upload Section - Full Width */}
        <div className="bg-gradient-to-br from-purple-50 to-green-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Activity Images</h3>
              <p className="text-sm text-gray-600">Upload photos to showcase your activity</p>
            </div>
          </div>
              
              <div className="space-y-4">
                {/* Image Upload Input with Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images (Max 5 images, 5MB each)
                  </label>
                  
                  {/* Drag & Drop Area */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      
                      const files = Array.from(e.dataTransfer.files);
                      handleImageUpload(files);
                    }}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB each (max 5 images)
                      </p>
                    </div>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      handleImageUpload(files);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Image Preview Grid */}
                {newActivity.images && newActivity.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Images ({newActivity.images?.length || 0}/5)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {newActivity.images?.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = (newActivity.images || []).filter((_, i) => i !== index);
                              setNewActivity({ ...newActivity, images: newImages });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Image Upload Tips</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Use high-quality images that showcase the activity</li>
                          <li>Include different angles and perspectives</li>
                          <li>Ensure images are well-lit and clear</li>
                          <li>Consider including images of the location, equipment, or participants</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions - Fixed at bottom */}
            <div className="flex gap-3 pt-3 border-t border-gray-200 bg-white sticky bottom-0">
              <button 
                type="button" 
                onClick={() => {
                  setShowActivityModal(false);
                  setActivityErrors({});
                }} 
                className="Btn secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingActivity}
                className={`Btn primary flex-1 py-2 ${isSubmittingActivity ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  console.log('Submit button clicked!');
                  console.log('Button event:', e);
                }}
              >
                {isSubmittingActivity ? 'Creating...' : (selectedActivity ? 'Update Activity' : 'Create Activity')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)} title={selectedEvent ? 'Edit Event' : 'Create New Event'} size="8xl">
          <form onSubmit={handleCreateEvent} className="space-y-6">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEvent ? 'Edit Event' : 'Create New Event'}</h2>
                    <p className="text-orange-100">Organize an engaging wildlife event</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-100">Event Details</div>
                  <div className="text-lg font-bold">Free Event</div>
                </div>
              </div>
            </div>

            {/* Main Form Grid - 3 columns for better space utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Event Information</h3>
                      <p className="text-sm text-gray-600">Tell us about your event</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Event Title *
                      </label>
                      <input 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.title 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-orange-100 focus:border-orange-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.title} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, title: e.target.value });
                          const error = validateEventField('title', e.target.value);
                          setEventErrors({ ...eventErrors, title: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('title', e.target.value);
                          setEventErrors({ ...eventErrors, title: error });
                        }}
                        placeholder="e.g., Wildlife Conservation Workshop"
                        required 
                      />
                      {eventErrors.title && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.title}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description *
                        <span className="ml-auto text-xs text-gray-500">
                          {newEvent.description?.length || 0}/500
                        </span>
                      </label>
                      <textarea 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 resize-none ${
                          eventErrors.description 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-orange-100 focus:border-orange-400 bg-white hover:border-gray-300'
                        }`}
                        rows={4} 
                        value={newEvent.description} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, description: e.target.value });
                          const error = validateEventField('description', e.target.value);
                          setEventErrors({ ...eventErrors, description: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('description', e.target.value);
                          setEventErrors({ ...eventErrors, description: error });
                        }}
                        placeholder="Describe what participants will learn, what activities they'll do, and what makes this event special..."
                        required 
                      />
                      {eventErrors.description && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.description}
                        </div>
                      )}
                      <p className="text-gray-500 text-sm">Min 20 words</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time Information */}
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Date & Time</h3>
                      <p className="text-sm text-gray-600">When will the event take place?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date *
                      </label>
                      <input 
                        type="date" 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.date 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.date} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, date: e.target.value });
                          const error = validateEventField('date', e.target.value);
                          setEventErrors({ ...eventErrors, date: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('date', e.target.value);
                          setEventErrors({ ...eventErrors, date: error });
                        }}
                        required 
                      />
                      {eventErrors.date && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.date}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Time *
                      </label>
                      <input 
                        type="time" 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.time 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.time} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, time: e.target.value });
                          const error = validateEventField('time', e.target.value);
                          setEventErrors({ ...eventErrors, time: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('time', e.target.value);
                          setEventErrors({ ...eventErrors, time: error });
                        }}
                        required 
                      />
                      {eventErrors.time && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.time}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Location & Capacity */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Location & Capacity</h3>
                      <p className="text-sm text-gray-600">Where and how many people?</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location *
                      </label>
                      <input 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.location 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-green-100 focus:border-green-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.location} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, location: e.target.value });
                          const error = validateEventField('location', e.target.value);
                          setEventErrors({ ...eventErrors, location: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('location', e.target.value);
                          setEventErrors({ ...eventErrors, location: error });
                        }}
                        placeholder="e.g., Wildlife Education Center, Colombo"
                        required 
                      />
                      {eventErrors.location && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.location}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Max Attendees *
                      </label>
                      <input 
                        type="number" 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.maxAttendees 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-green-100 focus:border-green-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.maxAttendees} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, maxAttendees: e.target.value });
                          const error = validateEventField('maxAttendees', e.target.value);
                          setEventErrors({ ...eventErrors, maxAttendees: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('maxAttendees', e.target.value);
                          setEventErrors({ ...eventErrors, maxAttendees: error });
                        }}
                        placeholder="50"
                        required 
                      />
                      {eventErrors.maxAttendees && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.maxAttendees}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category & Requirements */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Category & Details</h3>
                      <p className="text-sm text-gray-600">Classify and add requirements</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Category *
                      </label>
                      <select 
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 ${
                          eventErrors.category 
                            ? 'border-red-400 focus:ring-red-100 bg-red-50' 
                            : 'border-gray-200 focus:ring-purple-100 focus:border-purple-400 bg-white hover:border-gray-300'
                        }`}
                        value={newEvent.category} 
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, category: e.target.value });
                          const error = validateEventField('category', e.target.value);
                          setEventErrors({ ...eventErrors, category: error });
                        }}
                        onBlur={(e) => {
                          const error = validateEventField('category', e.target.value);
                          setEventErrors({ ...eventErrors, category: error });
                        }}
                      >
                        <option value="educational">🎓 Educational</option>
                        <option value="conservation">🌱 Conservation</option>
                        <option value="awareness">📢 Awareness</option>
                        <option value="fundraising">💰 Fundraising</option>
                        <option value="community">🤝 Community</option>
                      </select>
                      {eventErrors.category && (
                        <div className="flex items-center text-red-500 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {eventErrors.category}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Requirements (Optional)
                      </label>
                      <textarea 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white hover:border-gray-300 resize-none"
                        rows={3} 
                        value={newEvent.requirements} 
                        onChange={(e) => setNewEvent({ ...newEvent, requirements: e.target.value })}
                        placeholder="Any special requirements, materials needed, or preparation instructions..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload Section - Full Width */}
            <div className="bg-gradient-to-br from-green-50 to-purple-50 p-6 rounded-2xl border border-green-100 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Event Images</h3>
                  <p className="text-sm text-gray-600">Upload photos to showcase your event</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Image Upload Input with Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images (Max 5 images, 5MB each)
                  </label>
                  
                  {/* Drag & Drop Area */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      
                      const files = Array.from(e.dataTransfer.files);
                      handleEventImageUpload(files);
                    }}
                    onClick={() => document.getElementById('event-image-upload').click()}
                  >
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB each (max 5 images)
                      </p>
                    </div>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    id="event-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      handleEventImageUpload(files);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Image Preview Grid */}
                {newEvent.images && newEvent.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Images ({newEvent.images?.length || 0}/5)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {newEvent.images?.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = (newEvent.images || []).filter((_, i) => i !== index);
                              setNewEvent({ ...newEvent, images: newImages });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Image Upload Tips</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Use high-quality images that showcase the event</li>
                          <li>Include different angles and perspectives</li>
                          <li>Ensure images are well-lit and clear</li>
                          <li>Consider including images of the venue, speakers, or previous events</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Ready to Create Event?</h3>
                    <p className="text-sm text-gray-600">Review your details and create your event</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowEventModal(false)} 
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingEvent}
                    className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      isSubmittingEvent 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    } text-white`}
                  >
                    {isSubmittingEvent ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{selectedEvent ? 'Update Event' : 'Create Event'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <Modal onClose={() => { setShowRoleModal(false); setSelectedUser(null); }} title="Change User Role" size="md">
          <div className="mb-4">
            <p><span className="font-medium">User:</span> {selectedUser.name}</p>
            <p><span className="font-medium">Current Role:</span> {selectedUser.role}</p>
          </div>
          <div className="space-y-2">
            {['tourGuide', 'safariDriver', 'wildlifeOfficer', 'emergencyOfficer', 'callOperator', 'vet', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => handleUpdateUserRole(selectedUser._id, role)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition
                  ${selectedUser.role === role ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="Btn secondary w-full">Close</button>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <Modal onClose={() => { setShowEditUserModal(false); setSelectedUser(null); setEditValidationErrors({}); }} title="Edit User" size="lg">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Edit User Account</h2>
                <p className="text-gray-600">Update user information and role</p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(e) => handleEditFieldChange('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-20 ${
                        editValidationErrors.name 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                          : editUser.name && !editValidationErrors.name
                          ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-white focus:border-green-500 focus:ring-green-500'
                      }`}
                      placeholder="Enter full name"
                      required
                    />
                    {editUser.name && !editValidationErrors.name && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editValidationErrors.name && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {editValidationErrors.name}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => handleEditFieldChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-20 ${
                        editValidationErrors.email 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                          : editUser.email && !editValidationErrors.email
                          ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-white focus:border-green-500 focus:ring-green-500'
                      }`}
                      placeholder="Enter email address"
                      required
                    />
                    {editUser.email && !editValidationErrors.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editValidationErrors.email && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {editValidationErrors.email}
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={editUser.phone}
                      onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-20 ${
                        editValidationErrors.phone 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                          : editUser.phone && !editValidationErrors.phone
                          ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-white focus:border-green-500 focus:ring-green-500'
                      }`}
                      placeholder="Enter phone number (optional)"
                    />
                    {editUser.phone && !editValidationErrors.phone && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editValidationErrors.phone && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {editValidationErrors.phone}
                    </div>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={editUser.role}
                      onChange={(e) => handleEditFieldChange('role', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-20 appearance-none bg-white ${
                        editValidationErrors.role 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                          : editUser.role && !editValidationErrors.role
                          ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                      }`}
                      required
                    >
                      <option value="">Select User Role</option>
                      <option value="tourGuide">Tour Guide</option>
                      <option value="safariDriver">Safari Driver</option>
                      <option value="wildlifeOfficer">Wildlife Officer</option>
                      <option value="emergencyOfficer">Emergency Officer</option>
                      <option value="callOperator">Call Operator</option>
                      <option value="vet">Veterinarian</option>
                      <option value="admin">Admin</option>
                      <option value="tourist">Tourist</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {editUser.role && !editValidationErrors.role && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editValidationErrors.role && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {editValidationErrors.role}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowEditUserModal(false); setSelectedUser(null); setEditValidationErrors({}); }}
                  className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditValidating}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isEditValidating ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Update User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Tourist Details Modal */}
      {showTouristDetailsModal && selectedUser && (
        <Modal onClose={() => { setShowTouristDetailsModal(false); setSelectedUser(null); }} title="Tourist Details" size="lg">
          <div className="space-y-6">
            {/* Tourist Header */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧳</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedUser.name || (selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.firstName || selectedUser.lastName || 'Tourist')}
                </h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  Tourist Account
                </span>
              </div>
            </div>

            {/* Tourist Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{selectedUser.country || selectedUser.address?.country || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Account Status</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.status === 'active' || selectedUser.isActive !== false
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedUser.status === 'active' || selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tourist Preferences */}
            {(selectedUser.preferences || selectedUser.interests) && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Preferences & Interests</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.preferences && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Preferences</label>
                      <p className="text-sm text-gray-900">{JSON.stringify(selectedUser.preferences, null, 2)}</p>
                    </div>
                  )}
                  {selectedUser.interests && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Interests</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.interests.map((interest, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setShowTouristDetailsModal(false); setSelectedUser(null); }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTouristDetailsModal(false);
                  handleEditUser(selectedUser);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Edit Tourist
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && selectedUser && (
        <Modal onClose={() => { setShowDeleteUserModal(false); setSelectedUser(null); }} title="🗑️ Complete User Deletion" size="lg">
          <div className="space-y-6">
            {/* Warning Header */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ Complete User Deletion</h3>
              <p className="text-lg text-gray-700 mb-4">
                You are about to <strong>permanently delete</strong> <span className="font-bold text-red-600">{selectedUser.name}</span>
              </p>
            </div>

            {/* User Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">👤 User Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Role:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* What Will Be Deleted */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">🗑️ What Will Be Deleted</h4>
              <div className="space-y-2 text-sm text-red-800">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>User account and profile information</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>All bookings and reservations</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>Event registrations and donations</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>Emergency reports and assignments</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>Animal care records and treatments</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>Tour assignments and notifications</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>Complaints and activity records</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span>All related data across the entire system</span>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">⚠️ Irreversible Action</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This action will permanently delete the user and ALL their data from the entire system. 
                    This cannot be undone and will affect all related records across all modules.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    <strong>Note:</strong> If this user has applications in the Wildlife Officer Dashboard, 
                    they will be automatically removed. The Wildlife Officer Dashboard will need to be 
                    refreshed to see the updated data.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => { setShowDeleteUserModal(false); setSelectedUser(null); }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                🗑️ Delete User Completely
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Application Details Modal */}
      {showPasswordModal && selectedApplication && (
        <Modal onClose={() => { setShowPasswordModal(false); setSelectedApplication(null); setCustomPassword(''); }} title="Application Details" size="lg">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">👤 Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedApplication.firstname} {selectedApplication.lastname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-sm text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-sm text-gray-900">{selectedApplication.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Applied Position</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedApplication.role === 'Driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedApplication.role === 'Driver' ? 'Safari Driver' : 'Tour Guide'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                {selectedApplication.role === 'Driver' ? '🚗 Driver Information' : '🎯 Tour Guide Information'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedApplication.role === 'TourGuide' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Guide Registration Number</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.Guide_Registration_No || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.Experience_Year || 0} years</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Driving License Number</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.LicenceNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.vehicleType || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vehicle Registration Number</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedApplication.vehicleNumber || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Application Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">📋 Application Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedApplication.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                      selectedApplication.status === 'ApprovedByWPO' ? 'bg-green-100 text-green-800' :
                      selectedApplication.status === 'AccountCreated' ? 'bg-blue-100 text-blue-800' :
                      selectedApplication.status === 'RejectedByWPO' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedApplication.status === 'Submitted' ? '⏳ Pending Review' :
                       selectedApplication.status === 'ApprovedByWPO' ? '✅ Approved by WPO' :
                       selectedApplication.status === 'AccountCreated' ? '🎉 Account Created' :
                       selectedApplication.status === 'RejectedByWPO' ? '❌ Rejected' :
                       '❓ Unknown Status'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Date</label>
                  <p className="text-sm text-gray-900 font-medium">{new Date(selectedApplication.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>

            {/* Account Creation Section */}
            {selectedApplication.status === 'ApprovedByWPO' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-900 mb-3">🎉 Create Account</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temporary Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Leave empty for auto-generated password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If left empty, a secure random password will be generated automatically.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> The login credentials will be sent to the applicant's email address.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => { setShowPasswordModal(false); setSelectedApplication(null); setCustomPassword(''); }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              {selectedApplication.status === 'ApprovedByWPO' && (
                <button
                  onClick={handleConfirmCreateAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Account & Send Email
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
    </RoleGuard>
  );
};

/* ===== Small UI helpers (inside same file) ===== */

const KPI = ({ label, value, accent }) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const Item = ({ label, value }) => (
  <div>
    <div className="text-gray-500 text-xs">{label}</div>
    <div className="text-sm font-medium text-gray-800">{value || '-'}</div>
  </div>
);

const Modal = ({ children, onClose, title, size = 'md' }) => {
  const width = size === '8xl' ? 'max-w-8xl' : size === '7xl' ? 'max-w-7xl' : size === '6xl' ? 'max-w-6xl' : size === '5xl' ? 'max-w-5xl' : size === '4xl' ? 'max-w-4xl' : size === '3xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-2xl' : size === 'md' ? 'max-w-md' : 'max-w-sm';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
      <div className={`bg-white rounded-2xl p-8 w-full ${width} max-h-[95vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1">{label}</span>
    {children}
  </label>
);

// Tailwind helper class used in inputs/buttons above
// (put these in your global.css if you want, but inline works fine with Tailwind JIT)
const _style = `
  .Input { @apply w-full border border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-green-200 min-h-[56px]; }
  .Btn { @apply rounded-xl px-8 py-4 font-medium text-lg; }
  .Btn.primary { @apply bg-green-600 text-white hover:bg-green-700; }
  .Btn.secondary { @apply bg-gray-500 text-white hover:bg-gray-600; }
`;
// Inject the small style shim
if (typeof document !== 'undefined' && !document.getElementById('admin-inline-style')) {
  const s = document.createElement('style');
  s.id = 'admin-inline-style';
  s.innerHTML = _style;
  document.head.appendChild(s);
}

// Modern Chart Components
const ModernPieChart = ({ data, size = 200 }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Validate and sanitize data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Filter out invalid data and ensure values are numbers
  const validData = data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0 &&
    item.label
  );

  if (validData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">No valid data available</p>
        </div>
      </div>
    );
  }

  const total = validData.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const paths = validData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    
    const radius = size / 2 - 15;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    cumulativePercentage += percentage;
    
    return (
      <g key={index}>
        <defs>
          <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={item.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={item.color} stopOpacity="0.6" />
          </linearGradient>
          <filter id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d={pathData}
          fill={`url(#gradient-${index})`}
          stroke="white"
          strokeWidth="3"
          className="transition-all duration-700 hover:opacity-80 hover:scale-105 cursor-pointer"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            transformOrigin: `${centerX}px ${centerY}px`,
            animation: isLoaded ? `drawPieSegment 1.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s both` : 'none',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
          onMouseEnter={(e) => {
            e.target.style.filter = `url(#glow-${index}) drop-shadow(0 6px 12px rgba(0,0,0,0.2))`;
            e.target.style.transform = 'scale(1.05)';
            e.target.style.strokeWidth = '4';
          }}
          onMouseLeave={(e) => {
            e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))';
            e.target.style.transform = 'scale(1)';
            e.target.style.strokeWidth = '3';
          }}
        />
      </g>
    );
  });
  
  if (!isLoaded) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-500"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{`
        @keyframes drawPieSegment {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
            filter: blur(2px);
          }
          30% {
            opacity: 0.6;
            transform: scale(0.7) rotate(-5deg);
            filter: blur(1px);
          }
          60% {
            opacity: 0.8;
            transform: scale(0.9) rotate(0deg);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          }
        }
        
        @keyframes fadeInCenter {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(10px);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.8) translateY(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .pie-center {
          animation: fadeInCenter 1s cubic-bezier(0.4, 0, 0.2, 1) 1.8s both;
        }
        
        .pie-center:hover {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
      <svg width={size} height={size} className="drop-shadow-lg">
        {paths}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pie-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">{total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
};

const ModernHistogram = ({ data, height = 200 }) => {
  // Validate and sanitize data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Filter out invalid data and ensure values are numbers
  const validData = data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0 &&
    item.label
  );

  if (validData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No valid data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...validData.map(item => item.value));
  const barWidth = 70;
  const spacing = 25;
  const chartWidth = validData.length * (barWidth + spacing) - spacing;
  
  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <defs>
          {validData.map((item, index) => (
            <linearGradient key={index} id={`barGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={item.color || '#3B82F6'} stopOpacity="0.8" />
              <stop offset="100%" stopColor={item.color || '#3B82F6'} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>
        {validData.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 60) : 0;
          const x = index * (barWidth + spacing);
          const y = height - barHeight - 30;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#barGradient-${index})`}
                rx="8"
                className="transition-all duration-500 hover:opacity-80"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                }}
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-semibold"
                fontSize="12"
              >
                {item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="text-xs fill-gray-800 font-bold"
                fontSize="14"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ModernLineChart = ({ data, height = 300 }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hoveredPoint, setHoveredPoint] = React.useState(null);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Validate and sanitize data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Filter out invalid data and ensure values are numbers
  const validData = data.filter(item => 
    item && 
    typeof item.users === 'number' && !isNaN(item.users) && item.users >= 0 &&
    typeof item.activities === 'number' && !isNaN(item.activities) && item.activities >= 0 &&
    typeof item.events === 'number' && !isNaN(item.events) && item.events >= 0 &&
    item.day
  );

  if (validData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No valid data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...validData.map(item => Math.max(item.users, item.activities, item.events)));
  const chartWidth = 500;
  const chartHeight = height - 80;
  const padding = 50;
  
  const getY = (value) => chartHeight - (value / maxValue) * chartHeight + padding;
  const getX = (index) => (index / (validData.length - 1)) * (chartWidth - 2 * padding) + padding;
  
  const createPath = (key) => {
    return validData.map((item, index) => {
      const x = getX(index);
      const y = getY(item[key]);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  const createAreaPath = (key) => {
    const path = createPath(key);
    return `${path} L ${getX(validData.length - 1)} ${chartHeight + padding} L ${getX(0)} ${chartHeight + padding} Z`;
  };
  
  if (!isLoaded) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <defs>
          <linearGradient id="usersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="activitiesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eventsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1={padding}
            y1={chartHeight * ratio + padding}
            x2={chartWidth - padding}
            y2={chartHeight * ratio + padding}
            stroke="#E5E7EB"
            strokeWidth="1"
            opacity={isLoaded ? "0.5" : "0"}
            className="transition-all duration-1000 ease-out"
            style={{
              transitionDelay: `${index * 100}ms`
            }}
          />
        ))}
        
        {/* Area fills */}
        <path 
          d={createAreaPath('users')} 
          fill="url(#usersGradient)" 
          opacity={isLoaded ? "1" : "0"}
          className="transition-all duration-1500 ease-out"
          style={{
            transitionDelay: "300ms"
          }}
        />
        <path 
          d={createAreaPath('activities')} 
          fill="url(#activitiesGradient)" 
          opacity={isLoaded ? "1" : "0"}
          className="transition-all duration-1500 ease-out"
          style={{
            transitionDelay: "500ms"
          }}
        />
        <path 
          d={createAreaPath('events')} 
          fill="url(#eventsGradient)" 
          opacity={isLoaded ? "1" : "0"}
          className="transition-all duration-1500 ease-out"
          style={{
            transitionDelay: "700ms"
          }}
        />
        
        {/* Line paths */}
        <path 
          d={createPath('users')} 
          fill="none" 
          stroke="#10B981" 
          strokeWidth="4" 
          filter="url(#glow)"
          strokeDasharray={isLoaded ? "0" : "1000"}
          strokeDashoffset={isLoaded ? "0" : "1000"}
          className="transition-all duration-2000 ease-out"
          style={{
            transitionDelay: "400ms"
          }}
        />
        <path 
          d={createPath('activities')} 
          fill="none" 
          stroke="#3B82F6" 
          strokeWidth="4" 
          filter="url(#glow)"
          strokeDasharray={isLoaded ? "0" : "1000"}
          strokeDashoffset={isLoaded ? "0" : "1000"}
          className="transition-all duration-2000 ease-out"
          style={{
            transitionDelay: "600ms"
          }}
        />
        <path 
          d={createPath('events')} 
          fill="none" 
          stroke="#8B5CF6" 
          strokeWidth="4" 
          filter="url(#glow)"
          strokeDasharray={isLoaded ? "0" : "1000"}
          strokeDashoffset={isLoaded ? "0" : "1000"}
          className="transition-all duration-2000 ease-out"
          style={{
            transitionDelay: "800ms"
          }}
        />
        
        {/* Data points */}
        {validData.map((item, index) => {
          const x = getX(index);
          const isHovered = hoveredPoint === index;
          return (
            <g key={index}>
              <circle 
                cx={x} 
                cy={getY(item.users)} 
                r={isLoaded ? (isHovered ? "8" : "6") : "0"} 
                fill="#10B981" 
                stroke="white" 
                strokeWidth="2" 
                className="transition-all duration-500 ease-out cursor-pointer"
                style={{
                  transitionDelay: `${800 + index * 100}ms`,
                  filter: isHovered ? "drop-shadow(0 0 8px #10B981)" : "none"
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle 
                cx={x} 
                cy={getY(item.activities)} 
                r={isLoaded ? (isHovered ? "8" : "6") : "0"} 
                fill="#3B82F6" 
                stroke="white" 
                strokeWidth="2" 
                className="transition-all duration-500 ease-out cursor-pointer"
                style={{
                  transitionDelay: `${800 + index * 100}ms`,
                  filter: isHovered ? "drop-shadow(0 0 8px #3B82F6)" : "none"
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle 
                cx={x} 
                cy={getY(item.events)} 
                r={isLoaded ? (isHovered ? "8" : "6") : "0"} 
                fill="#8B5CF6" 
                stroke="white" 
                strokeWidth="2" 
                className="transition-all duration-500 ease-out cursor-pointer"
                style={{
                  transitionDelay: `${800 + index * 100}ms`,
                  filter: isHovered ? "drop-shadow(0 0 8px #8B5CF6)" : "none"
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <text 
                x={x} 
                y={chartHeight + padding + 20} 
                textAnchor="middle" 
                className="text-xs fill-gray-600 font-semibold transition-all duration-500 ease-out" 
                fontSize="12"
                opacity={isLoaded ? "1" : "0"}
                style={{
                  transitionDelay: `${1000 + index * 50}ms`
                }}
              >
                {item.day}
              </text>
              
              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={x - 40}
                    y={Math.min(getY(item.users), getY(item.activities), getY(item.events)) - 80}
                    width="80"
                    height="60"
                    fill="rgba(0, 0, 0, 0.8)"
                    rx="8"
                    className="animate-pulse"
                  />
                  <text
                    x={x}
                    y={Math.min(getY(item.users), getY(item.activities), getY(item.events)) - 65}
                    textAnchor="middle"
                    className="text-xs fill-white font-semibold"
                    fontSize="10"
                  >
                    {item.day}
                  </text>
                  <text
                    x={x}
                    y={Math.min(getY(item.users), getY(item.activities), getY(item.events)) - 50}
                    textAnchor="middle"
                    className="text-xs fill-green-300"
                    fontSize="9"
                  >
                    Users: {item.users}
                  </text>
                  <text
                    x={x}
                    y={Math.min(getY(item.users), getY(item.activities), getY(item.events)) - 40}
                    textAnchor="middle"
                    className="text-xs fill-blue-300"
                    fontSize="9"
                  >
                    Activities: {item.activities}
                  </text>
                  <text
                    x={x}
                    y={Math.min(getY(item.users), getY(item.activities), getY(item.events)) - 30}
                    textAnchor="middle"
                    className="text-xs fill-purple-300"
                    fontSize="9"
                  >
                    Events: {item.events}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Modern Legend */}
      <div className="flex justify-center space-x-8 mt-6">
        <div 
          className="flex items-center p-3 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm transition-all duration-500 ease-out hover:scale-105 hover:shadow-lg"
          style={{
            opacity: isLoaded ? "1" : "0",
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "1200ms"
          }}
        >
          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-3 shadow-sm animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-700">Users</span>
        </div>
        <div 
          className="flex items-center p-3 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm transition-all duration-500 ease-out hover:scale-105 hover:shadow-lg"
          style={{
            opacity: isLoaded ? "1" : "0",
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "1400ms"
          }}
        >
          <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mr-3 shadow-sm animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-700">Activities</span>
        </div>
        <div 
          className="flex items-center p-3 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm transition-all duration-500 ease-out hover:scale-105 hover:shadow-lg"
          style={{
            opacity: isLoaded ? "1" : "0",
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "1600ms"
          }}
        >
          <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full mr-3 shadow-sm animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-700">Events</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
