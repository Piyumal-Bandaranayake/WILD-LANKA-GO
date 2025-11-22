import React, { useState } from 'react';
import { publicApiService } from '../services/publicApi';

const ApplicationForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    role: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    Guide_Registration_No: '',
    Experience_Year: '',
    LicenceNumber: '',
    vehicleType: '',
    vehicleNumber: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateRegistrationNumber = (regNo) => {
    const regRegex = /^[A-Za-z0-9\-]{3,20}$/;
    return regRegex.test(regNo);
  };

  const validateLicenseNumber = (licenseNo) => {
    const licenseRegex = /^[A-Za-z0-9]{5,15}$/;
    return licenseRegex.test(licenseNo);
  };

  const validateVehicleNumber = (vehicleNo) => {
    const vehicleRegex = /^[A-Za-z0-9\-]{4,15}$/;
    return vehicleRegex.test(vehicleNo);
  };

  const validateExperience = (experience) => {
    const exp = parseInt(experience);
    return !isNaN(exp) && exp >= 0 && exp <= 50;
  };

  // Character count helpers
  const getCharacterCount = (value) => value ? value.length : 0;
  const getMaxLength = (fieldName) => {
    switch (fieldName) {
      case 'firstname':
      case 'lastname':
        return 50;
      case 'email':
        return 100;
      case 'phone':
        return 15;
      case 'Guide_Registration_No':
        return 20;
      case 'LicenceNumber':
        return 15;
      case 'vehicleType':
        return 30;
      case 'vehicleNumber':
        return 15;
      default:
        return 100;
    }
  };

  // Field validation status
  const getFieldStatus = (fieldName) => {
    const value = formData[fieldName];
    const error = errors[fieldName];
    const isTouched = touched[fieldName];
    
    if (!isTouched && !value) return 'default';
    if (error) return 'error';
    if (value && !error) return 'success';
    return 'default';
  };

  // Form completion progress
  const getFormProgress = () => {
    const requiredFields = ['role', 'firstname', 'lastname', 'email', 'phone'];
    const roleSpecificFields = formData.role === 'TourGuide' 
      ? ['Guide_Registration_No', 'Experience_Year']
      : ['LicenceNumber', 'vehicleType', 'vehicleNumber'];
    
    const allFields = [...requiredFields, ...roleSpecificFields];
    const completedFields = allFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((completedFields.length / allFields.length) * 100);
  };

  // Field validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'role':
        if (!value) error = 'Please select a position';
        break;
      case 'firstname':
        if (!value) error = 'First name is required';
        else if (!validateName(value)) error = 'First name must be 2-50 characters and contain only letters';
        break;
      case 'lastname':
        if (!value) error = 'Last name is required';
        else if (!validateName(value)) error = 'Last name must be 2-50 characters and contain only letters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!validateEmail(value)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!validatePhone(value)) error = 'Please enter a valid phone number (10-15 digits)';
        break;
      case 'Guide_Registration_No':
        if (formData.role === 'TourGuide' && value && !validateRegistrationNumber(value)) {
          error = 'Registration number must be 3-20 characters (letters, numbers, hyphens only)';
        }
        break;
      case 'Experience_Year':
        if (formData.role === 'TourGuide' && value && !validateExperience(value)) {
          error = 'Experience must be a number between 0 and 50 years';
        }
        break;
      case 'LicenceNumber':
        if (formData.role === 'Driver' && value && !validateLicenseNumber(value)) {
          error = 'License number must be 5-15 characters (letters and numbers only)';
        }
        break;
      case 'vehicleType':
        if (formData.role === 'Driver' && value && value.length < 2) {
          error = 'Vehicle type must be at least 2 characters';
        }
        break;
      case 'vehicleNumber':
        if (formData.role === 'Driver' && value && !validateVehicleNumber(value)) {
          error = 'Vehicle number must be 4-15 characters (letters, numbers, hyphens only)';
        }
        break;
      default:
        break;
    }

    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation as user types
    if (touched[name] || value.length > 0) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate required fields
    const requiredFields = ['role', 'firstname', 'lastname', 'email', 'phone'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Validate role-specific fields
    if (formData.role === 'TourGuide') {
      if (formData.Guide_Registration_No) {
        const error = validateField('Guide_Registration_No', formData.Guide_Registration_No);
        if (error) {
          newErrors.Guide_Registration_No = error;
          isValid = false;
        }
      }
      if (formData.Experience_Year) {
        const error = validateField('Experience_Year', formData.Experience_Year);
        if (error) {
          newErrors.Experience_Year = error;
          isValid = false;
        }
      }
    }

    if (formData.role === 'Driver') {
      if (formData.LicenceNumber) {
        const error = validateField('LicenceNumber', formData.LicenceNumber);
        if (error) {
          newErrors.LicenceNumber = error;
          isValid = false;
        }
      }
      if (formData.vehicleType) {
        const error = validateField('vehicleType', formData.vehicleType);
        if (error) {
          newErrors.vehicleType = error;
          isValid = false;
        }
      }
      if (formData.vehicleNumber) {
        const error = validateField('vehicleNumber', formData.vehicleNumber);
        if (error) {
          newErrors.vehicleNumber = error;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setSubmitStatus('validation_error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await publicApiService.submitApplication(formData);
      setSubmitStatus('success');
      setFormData({
        role: '',
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        Guide_Registration_No: '',
        Experience_Year: '',
        LicenceNumber: '',
        vehicleType: '',
        vehicleNumber: ''
      });
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error('Application submission error:', error);
      
      // Handle server-side validation errors
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          // Map server errors to field names
          if (err.includes('first name')) serverErrors.firstname = err;
          else if (err.includes('last name')) serverErrors.lastname = err;
          else if (err.includes('email')) serverErrors.email = err;
          else if (err.includes('phone')) serverErrors.phone = err;
          else if (err.includes('registration number')) serverErrors.Guide_Registration_No = err;
          else if (err.includes('experience')) serverErrors.Experience_Year = err;
          else if (err.includes('license number')) serverErrors.LicenceNumber = err;
          else if (err.includes('vehicle type')) serverErrors.vehicleType = err;
          else if (err.includes('vehicle number')) serverErrors.vehicleNumber = err;
          else if (err.includes('role')) serverErrors.role = err;
        });
        setErrors(serverErrors);
        setSubmitStatus('validation_error');
      } else if (error.response?.data?.error === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'An application with this email already exists' });
        setSubmitStatus('validation_error');
      } else {
        setSubmitStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Join Our Team</h2>
              <p className="text-emerald-100 mt-1">Apply as a Driver or Tour Guide</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-800">Application Submitted Successfully!</h3>
                  <p className="text-green-700 text-sm">We'll review your application and get back to you soon.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'validation_error' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-800">Please Fix the Following Issues</h3>
                  <p className="text-yellow-700 text-sm">Check the highlighted fields and correct any errors before submitting.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800">Submission Failed</h3>
                  <p className="text-red-700 text-sm">Please try again or contact us for assistance.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Position You're Applying For *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  formData.role === 'TourGuide' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="TourGuide"
                    checked={formData.role === 'TourGuide'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Tour Guide</h3>
                    <p className="text-sm text-gray-600">Lead wildlife tours and share knowledge</p>
                  </div>
                </label>

                <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  formData.role === 'Driver' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="Driver"
                    checked={formData.role === 'Driver'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Safari Driver</h3>
                    <p className="text-sm text-gray-600">Drive safari vehicles safely</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Form Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Form Progress</span>
                <span className="text-sm text-gray-500">{getFormProgress()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getFormProgress()}%` }}
                ></div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    maxLength={getMaxLength('firstname')}
                    required
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      getFieldStatus('firstname') === 'error'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : getFieldStatus('firstname') === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50'
                        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="Enter your first name"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {getFieldStatus('firstname') === 'success' && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {getFieldStatus('firstname') === 'error' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-xs ${
                      getCharacterCount(formData.firstname) > getMaxLength('firstname') * 0.8 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {getCharacterCount(formData.firstname)}/{getMaxLength('firstname')}
                    </span>
                  </div>
                </div>
                {errors.firstname && touched.firstname && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.firstname}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    maxLength={getMaxLength('lastname')}
                    required
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      getFieldStatus('lastname') === 'error'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : getFieldStatus('lastname') === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50'
                        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="Enter your last name"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {getFieldStatus('lastname') === 'success' && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {getFieldStatus('lastname') === 'error' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-xs ${
                      getCharacterCount(formData.lastname) > getMaxLength('lastname') * 0.8 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {getCharacterCount(formData.lastname)}/{getMaxLength('lastname')}
                    </span>
                  </div>
                </div>
                {errors.lastname && touched.lastname && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.lastname}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    maxLength={getMaxLength('email')}
                    required
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      getFieldStatus('email') === 'error'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : getFieldStatus('email') === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50'
                        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {getFieldStatus('email') === 'success' && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {getFieldStatus('email') === 'error' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-xs ${
                      getCharacterCount(formData.email) > getMaxLength('email') * 0.8 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {getCharacterCount(formData.email)}/{getMaxLength('email')}
                    </span>
                  </div>
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </p>
                )}
                {formData.email && !errors.email && touched.email && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Valid email format
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    maxLength={getMaxLength('phone')}
                    required
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      getFieldStatus('phone') === 'error'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : getFieldStatus('phone') === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50'
                        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="+94 XX XXX XXXX"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {getFieldStatus('phone') === 'success' && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {getFieldStatus('phone') === 'error' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-xs ${
                      getCharacterCount(formData.phone) > getMaxLength('phone') * 0.8 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {getCharacterCount(formData.phone)}/{getMaxLength('phone')}
                    </span>
                  </div>
                </div>
                {errors.phone && touched.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.phone}
                  </p>
                )}
                {formData.phone && !errors.phone && touched.phone && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Valid phone number format
                  </p>
                )}
              </div>
            </div>

            {/* Tour Guide Specific Fields */}
            {formData.role === 'TourGuide' && (
              <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tour Guide Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Guide Registration Number
                    </label>
                    <input
                      type="text"
                      name="Guide_Registration_No"
                      value={formData.Guide_Registration_No}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.Guide_Registration_No && touched.Guide_Registration_No 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., TG-12345"
                    />
                    {errors.Guide_Registration_No && touched.Guide_Registration_No && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.Guide_Registration_No}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="Experience_Year"
                      value={formData.Experience_Year}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      min="0"
                      max="50"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.Experience_Year && touched.Experience_Year 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., 5"
                    />
                    {errors.Experience_Year && touched.Experience_Year && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.Experience_Year}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Driver Specific Fields */}
            {formData.role === 'Driver' && (
              <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Driver Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="LicenceNumber"
                      value={formData.LicenceNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.LicenceNumber && touched.LicenceNumber 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., B1234567"
                    />
                    {errors.LicenceNumber && touched.LicenceNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.LicenceNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <input
                      type="text"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.vehicleType && touched.vehicleType 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., Safari Jeep"
                    />
                    {errors.vehicleType && touched.vehicleType && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.vehicleType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.vehicleNumber && touched.vehicleNumber 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., ABC-1234"
                    />
                    {errors.vehicleNumber && touched.vehicleNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.vehicleNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.role || !formData.firstname || !formData.lastname || !formData.email || !formData.phone || Object.keys(errors).some(key => errors[key])}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
