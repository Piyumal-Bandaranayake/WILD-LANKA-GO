import React, { useState, useMemo, useEffect } from 'react';
import { protectedApi } from '../services/authService';

const ProfileEditModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.firstname + ' ' + user?.lastname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ 
    phone: '', 
    fullName: '', 
    email: '' 
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user?.fullName || user?.firstname + ' ' + user?.lastname || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
    }
  }, [user]);

  const isValidSriLankaPhone = (value) => {
    if (!value) return false;
    const cleaned = value.replace(/\s|-/g, '');
    const slPattern = /^(\+94\d{9}|0\d{9})$/; // +94XXXXXXXXX or 0XXXXXXXXX
    const e164Pattern = /^\+?\d{7,15}$/; // fallback generic
    return slPattern.test(cleaned) || e164Pattern.test(cleaned);
  };

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  };

  const isValidPassword = (value) => {
    return value && value.length >= 6;
  };

  const isPasswordMatch = (password, confirmPassword) => {
    return password && confirmPassword && password === confirmPassword;
  };

  const isFormValid = useMemo(() => {
    return !fieldErrors.phone && 
           !fieldErrors.fullName && 
           !fieldErrors.email && 
           isValidSriLankaPhone(formData.phone) &&
           formData.fullName.trim().length > 0 &&
           isValidEmail(formData.email);
  }, [fieldErrors.phone, fieldErrors.fullName, fieldErrors.email, formData.phone, formData.fullName, formData.email]);

  const isPasswordFormValid = useMemo(() => {
    if (!showPasswordChange) return true;
    
    return !passwordFieldErrors.currentPassword &&
           !passwordFieldErrors.newPassword &&
           !passwordFieldErrors.confirmPassword &&
           isValidPassword(passwordData.newPassword) &&
           isPasswordMatch(passwordData.newPassword, passwordData.confirmPassword) &&
           passwordData.currentPassword.trim().length > 0;
  }, [showPasswordChange, passwordFieldErrors, passwordData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Field-level validation
    if (name === 'phone') {
      const isValid = isValidSriLankaPhone(value);
      setFieldErrors(prev => ({
        ...prev,
        phone: value && !isValid ? 'Enter a valid phone (e.g., +94711234567 or 0711234567).' : ''
      }));
    } else if (name === 'fullName') {
      setFieldErrors(prev => ({
        ...prev,
        fullName: value.trim().length === 0 ? 'Full name is required.' : ''
      }));
    } else if (name === 'email') {
      const isValid = isValidEmail(value);
      setFieldErrors(prev => ({
        ...prev,
        email: value && !isValid ? 'Enter a valid email address.' : ''
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Field-level validation for password fields
    if (name === 'newPassword') {
      const isValid = isValidPassword(value);
      setPasswordFieldErrors(prev => ({
        ...prev,
        newPassword: value && !isValid ? 'Password must be at least 6 characters long.' : ''
      }));
    } else if (name === 'confirmPassword') {
      const isMatch = isPasswordMatch(passwordData.newPassword, value);
      setPasswordFieldErrors(prev => ({
        ...prev,
        confirmPassword: value && !isMatch ? 'Passwords do not match.' : ''
      }));
    } else if (name === 'currentPassword') {
      setPasswordFieldErrors(prev => ({
        ...prev,
        currentPassword: value.trim().length === 0 ? 'Current password is required.' : ''
      }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    try {
      // Validate password fields
      if (!isValidPassword(passwordData.newPassword)) {
        setPasswordFieldErrors(prev => ({ 
          ...prev, 
          newPassword: 'Password must be at least 6 characters long.' 
        }));
        setPasswordLoading(false);
        return;
      }

      if (!isPasswordMatch(passwordData.newPassword, passwordData.confirmPassword)) {
        setPasswordFieldErrors(prev => ({ 
          ...prev, 
          confirmPassword: 'Passwords do not match.' 
        }));
        setPasswordLoading(false);
        return;
      }

      if (passwordData.currentPassword.trim().length === 0) {
        setPasswordFieldErrors(prev => ({ 
          ...prev, 
          currentPassword: 'Current password is required.' 
        }));
        setPasswordLoading(false);
        return;
      }

      const response = await protectedApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      console.log('✅ Password change response:', response);
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
      setPasswordError('');
      
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic client-side validation guard
      if (!isValidSriLankaPhone(formData.phone)) {
        setFieldErrors(prev => ({ ...prev, phone: 'Enter a valid phone (e.g., +94711234567 or 0711234567).' }));
        setLoading(false);
        return;
      }
      if (formData.fullName.trim().length === 0) {
        setFieldErrors(prev => ({ ...prev, fullName: 'Full name is required.' }));
        setLoading(false);
        return;
      }
      if (!isValidEmail(formData.email)) {
        setFieldErrors(prev => ({ ...prev, email: 'Enter a valid email address.' }));
        setLoading(false);
        return;
      }
      // Prepare update data
      const updateData = { ...formData };
      
      // Map fullName to name for API compatibility
      if (updateData.fullName) {
        updateData.name = updateData.fullName;
      }
      
      console.log('🔄 Sending update data to API:', updateData);

      const response = await protectedApi.updateProfile(updateData);
      console.log('✅ Profile update response:', response);
      
      // Extract user data from the response (it's nested in response.data.user)
      const userData = response.data?.user || response.data || response;
      console.log('🔄 Extracted user data for update:', userData);
      
      onUpdate(userData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your full name"
                    required
                    aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
                    aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                  />
                  {fieldErrors.fullName && (
                    <p id="fullName-error" className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your.email@example.com"
                    required
                    aria-invalid={fieldErrors.email ? 'true' : 'false'}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+94711234567 or 0711234567"
                    inputMode="tel"
                    pattern="^(\+94\d{9}|0\d{9}|\+?\d{7,15})$"
                    aria-invalid={fieldErrors.phone ? 'true' : 'false'}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  />
                  {fieldErrors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>





            {/* Password Change Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPasswordChange ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  {passwordError && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter your current password"
                      required
                      aria-invalid={passwordFieldErrors.currentPassword ? 'true' : 'false'}
                      aria-describedby={passwordFieldErrors.currentPassword ? 'currentPassword-error' : undefined}
                    />
                    {passwordFieldErrors.currentPassword && (
                      <p id="currentPassword-error" className="mt-1 text-sm text-red-600">{passwordFieldErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter your new password"
                      required
                      aria-invalid={passwordFieldErrors.newPassword ? 'true' : 'false'}
                      aria-describedby={passwordFieldErrors.newPassword ? 'newPassword-error' : undefined}
                    />
                    {passwordFieldErrors.newPassword && (
                      <p id="newPassword-error" className="mt-1 text-sm text-red-600">{passwordFieldErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Confirm your new password"
                      required
                      aria-invalid={passwordFieldErrors.confirmPassword ? 'true' : 'false'}
                      aria-describedby={passwordFieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    {passwordFieldErrors.confirmPassword && (
                      <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">{passwordFieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={passwordLoading || !isPasswordFormValid}
                    >
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>


            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading || !isFormValid}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
