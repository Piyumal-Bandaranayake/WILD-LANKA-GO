import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfileEditModal from '../components/ProfileEditModal';
import ProfileImage from '../components/ProfileImage';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import { protectedApi } from '../services/authService';

const Profile = () => {
  const { user, backendUser, token, updateUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBackendUser, setCurrentBackendUser] = useState(backendUser || user);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Only try to fetch from API if we have a valid token
      if (!token) {
        console.log('⚠️ No token available, using cached user data');
        setCurrentBackendUser(backendUser || user);
        return;
      }

      try {
        console.log('🔄 Fetching user profile from database...');
        console.log('🔄 Current user ID:', user?._id);
        console.log('🔄 Current user email:', user?.email);
        console.log('🔄 Has token:', !!token);
        console.log('🔄 Token preview:', token.substring(0, 20) + '...');
        
        const response = await protectedApi.getProfile();
        console.log('✅ Profile data received:', response);
        
        // Extract user data from the response (it's nested in response.data.user)
        const userData = response.data?.user || response.data || response;
        console.log('🔄 Extracted user data:', userData);
        console.log('🔄 Extracted user ID:', userData._id);
        console.log('🔄 Extracted user email:', userData.email);
        
        // Validate that the fetched user matches the current user
        if (userData._id && user?._id && userData._id !== user._id) {
          console.error('❌ User ID mismatch! Fetched user ID:', userData._id, 'Current user ID:', user._id);
          console.error('❌ This indicates a serious authentication issue');
          // Don't update the profile with wrong user data
          setCurrentBackendUser(backendUser || user);
          return;
        }
        
        // Use fresh data from API, don't merge with potentially corrupted cached data
        console.log('✅ Using fresh profile data from API');
        setCurrentBackendUser(userData);
        
        // Update the AuthContext with fresh data - extract user object from response
        const userObject = userData.data?.user || userData.user || userData;
        console.log('🔄 Extracted user object for AuthContext:', userObject);
        console.log('🔄 User object role:', userObject.role);
        console.log('🔄 User object userType:', userObject.userType);
        updateUser(userObject);
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        console.log('🔄 Falling back to cached user data:', backendUser || user);
        // Fallback to cached user data if API fails
        setCurrentBackendUser(backendUser || user);
      }
    };

    const userData = backendUser || user;
    if (userData) {
      console.log('🔄 Initial user data:', userData);
      console.log('🔄 User ID:', userData._id);
      console.log('🔄 User email:', userData.email);
      
      // Set the cached data immediately for quick display
      setCurrentBackendUser(userData);
      
      // Then try to fetch fresh data if we have a token
      if (token) {
        fetchUserProfile();
      } else {
        console.log('⚠️ No token available, using cached data only');
      }
    } else {
      console.log('⚠️ No user data available');
    }
  }, [backendUser, user, token]);

  const handleProfileUpdate = (updatedUser) => {
    console.log('🔄 Profile updated, updating AuthContext and local state:', updatedUser);
    console.log('🔄 Updated user keys:', Object.keys(updatedUser || {}));
    console.log('🔄 Updated user name:', updatedUser?.name);
    console.log('🔄 Updated user email:', updatedUser?.email);
    
    // Update AuthContext (this will persist the changes)
    updateUser(updatedUser);
    
    // Update local state
    setCurrentBackendUser(updatedUser);
    
    // Show success message
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000); // Clear after 3 seconds
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'tourGuide': 'Tour Guide',
      'safariDriver': 'Safari Driver',
      'wildlifeOfficer': 'Wildlife Officer',
      'vet': 'Veterinarian',
      'tourist': 'Tourist',
      'callOperator': 'Call Operator',
      'emergencyOfficer': 'Emergency Officer'
    };
    return roleMap[role] || role;
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}

            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <ProfileImage
                  src={currentBackendUser?.profileImage}
                  alt={currentBackendUser?.fullName}
                  fallbackText={currentBackendUser?.fullName}
                  className="w-24 h-24 rounded-full border-4 border-green-600"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {currentBackendUser?.fullName || currentBackendUser?.name} 👋
                  </h1>
                  <p className="text-gray-600 text-lg">{currentBackendUser?.email}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                      currentBackendUser?.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : currentBackendUser?.role === 'tourGuide'
                        ? 'bg-blue-100 text-blue-800'
                        : currentBackendUser?.role === 'safariDriver'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {currentBackendUser?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile
              </button>
            </div>



            {/* Simple Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Profile Info */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Information</h2>
                    <p className="text-gray-600">Your account details and personal information</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-semibold text-gray-800">{currentBackendUser?.fullName || currentBackendUser?.name || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold text-gray-800">{currentBackendUser?.email || 'Not provided'}</p>
              </div>
              </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
              </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-semibold text-gray-800">{currentBackendUser?.phone || 'Not provided'}</p>
              </div>
            </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          currentBackendUser?.role === 'admin' ? 'bg-red-100 text-red-800' :
                          currentBackendUser?.role === 'tourGuide' ? 'bg-blue-100 text-blue-800' :
                          currentBackendUser?.role === 'safariDriver' ? 'bg-yellow-100 text-yellow-800' :
                          currentBackendUser?.role === 'wildlifeOfficer' ? 'bg-green-100 text-green-800' :
                          currentBackendUser?.role === 'vet' ? 'bg-purple-100 text-purple-800' :
                          currentBackendUser?.role === 'tourist' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleDisplayName(currentBackendUser?.role) || 'Unknown'}
                    </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Account Status */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Status</h2>
                    <p className="text-gray-600">Your account information and activity</p>
              </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          currentBackendUser?.status === 'active' ? 'bg-green-100 text-green-800' : 
                          currentBackendUser?.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {currentBackendUser?.status === 'active' ? 'Active' : currentBackendUser?.status || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="font-semibold text-gray-800">{formatDate(currentBackendUser?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-semibold text-gray-800">{formatDate(currentBackendUser?.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Login Count</p>
                        <p className="font-semibold text-gray-800">{currentBackendUser?.loginCount || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Edit Modal */}
            <ProfileEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              user={currentBackendUser}
              onUpdate={handleProfileUpdate}
            />
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
