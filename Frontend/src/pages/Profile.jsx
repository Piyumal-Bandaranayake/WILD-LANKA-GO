import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfileEditModal from '../components/ProfileEditModal';
import ProfileImage from '../components/ProfileImage';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

const Profile = () => {
  const { backendUser } = useAuthContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBackendUser, setCurrentBackendUser] = useState(backendUser);

  const handleProfileUpdate = (updatedUser) => {
    setCurrentBackendUser(updatedUser);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
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
                    Welcome back, {currentBackendUser?.fullName} 👋
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  {currentBackendUser?.activeBookings || 0}
                </p>
                <p className="text-gray-600">Active Bookings</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  {currentBackendUser?.completedTours || 0}
                </p>
                <p className="text-gray-600">Completed Tours</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  {currentBackendUser?.photosUploaded || 0}
                </p>
                <p className="text-gray-600">Photos Uploaded</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  LKR {currentBackendUser?.totalDonations || 0}
                </p>
                <p className="text-gray-600">Total Donations</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">System Profile</h2>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">User ID:</span> {currentBackendUser?._id}</p>
                  <p><span className="font-medium">Full Name:</span> {currentBackendUser?.fullName}</p>
                  <p><span className="font-medium">Phone:</span> {currentBackendUser?.phone}</p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        currentBackendUser?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentBackendUser?.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Joined:</span> {new Date(currentBackendUser?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Language:</span> {currentBackendUser?.preferences?.language || 'en'}</p>
                  <p><span className="font-medium">Timezone:</span> {currentBackendUser?.preferences?.timezone || 'Not set'}</p>
                  <p><span className="font-medium">Email Notifications:</span> {currentBackendUser?.preferences?.notifications?.email ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Account Status</h3>
              <p className="text-green-700">
                ✅ Your account is successfully connected to our system and your data is saved in our database.
              </p>
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
