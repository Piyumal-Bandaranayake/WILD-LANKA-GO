import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfileEditModal from '../components/ProfileEditModal';
import ProfileImage from '../components/ProfileImage';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

const Profile = () => {
  const { user, backendUser, isLoading } = useAuthContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBackendUser, setCurrentBackendUser] = useState(backendUser);

  const handleProfileUpdate = (updatedUser) => {
    setCurrentBackendUser(updatedUser);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <ProfileImage
                    src={user.picture}
                    alt={user.name}
                    fallbackText={user.name}
                    className="w-24 h-24 rounded-full border-4 border-green-600"
                  />
                  <div className="ml-6">
                    <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
                    <p className="text-gray-600 text-lg">{user.email}</p>
                    {currentBackendUser && (
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                        currentBackendUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        currentBackendUser.role === 'tourGuide' ? 'bg-blue-100 text-blue-800' :
                        currentBackendUser.role === 'safariDriver' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {currentBackendUser.role}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Auth0 Profile</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {user.name}</p>
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Email Verified:</span> {user.email_verified ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Nickname:</span> {user.nickname || 'Not set'}</p>
                    <p><span className="font-medium">Locale:</span> {user.locale || 'Not set'}</p>
                    <p><span className="font-medium">Last Updated:</span> {new Date(user.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {currentBackendUser && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">System Profile</h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">User ID:</span> {currentBackendUser._id}</p>
                      <p><span className="font-medium">Role:</span> {currentBackendUser.role}</p>
                      <p><span className="font-medium">Full Name:</span> {currentBackendUser.fullName || 'Not set'}</p>
                      <p><span className="font-medium">Phone:</span> {currentBackendUser.phone || 'Not set'}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          currentBackendUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {currentBackendUser.status}
                        </span>
                      </p>
                      <p><span className="font-medium">Joined:</span> {new Date(currentBackendUser.createdAt).toLocaleDateString()}</p>
                      <p><span className="font-medium">Last Login:</span> {new Date(currentBackendUser.auth_metadata?.last_login).toLocaleString()}</p>
                      <p><span className="font-medium">Login Count:</span> {currentBackendUser.auth_metadata?.login_count}</p>
                    </div>
                  </div>
                )}

                {currentBackendUser && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Completion</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Profile Completion</span>
                          <span>{currentBackendUser.profileCompletionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${currentBackendUser.profileCompletionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentBackendUser.profile_complete ? (
                          <span className="text-green-600">✅ Profile is complete!</span>
                        ) : (
                          <span className="text-orange-600">⚠️ Complete your profile to unlock all features</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentBackendUser && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">Language:</span> {currentBackendUser.preferences?.language || 'en'}</p>
                      <p><span className="font-medium">Timezone:</span> {currentBackendUser.preferences?.timezone || 'Not set'}</p>
                      <p><span className="font-medium">Email Notifications:</span> {currentBackendUser.preferences?.notifications?.email ? 'Enabled' : 'Disabled'}</p>
                      <p><span className="font-medium">SMS Notifications:</span> {currentBackendUser.preferences?.notifications?.sms ? 'Enabled' : 'Disabled'}</p>
                      <p><span className="font-medium">Push Notifications:</span> {currentBackendUser.preferences?.notifications?.push ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Details</h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">Auth Provider:</span> {currentBackendUser.auth_metadata?.auth_provider || 'auth0'}</p>
                      <p><span className="font-medium">Last IP:</span> {currentBackendUser.auth_metadata?.last_ip || 'Unknown'}</p>
                      <p><span className="font-medium">User Agent:</span> 
                        <span className="text-xs text-gray-500 block mt-1">
                          {currentBackendUser.auth_metadata?.user_agent ? 
                            currentBackendUser.auth_metadata.user_agent.substring(0, 50) + '...' : 
                            'Unknown'
                          }
                        </span>
                      </p>
                      <p><span className="font-medium">Terms Accepted:</span> {currentBackendUser.terms_accepted ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Privacy Accepted:</span> {currentBackendUser.privacy_accepted ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Edit Modal */}
              <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={currentBackendUser}
                onUpdate={handleProfileUpdate}
              />

              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Account Status</h3>
                <p className="text-green-700">
                  ✅ Your account is successfully connected to our system and your data is saved in our database.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
