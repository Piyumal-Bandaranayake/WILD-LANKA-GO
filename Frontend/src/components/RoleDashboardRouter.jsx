import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Import role-specific dashboards
import AdminDashboard from '../pages/admin/AdminDashboard';
import WildlifeOfficerDashboard from '../pages/wildlife-officer/WildlifeOfficerDashboard';
import TouristDashboard from '../pages/tourist/TouristDashboard';
import TourGuideDashboard from '../pages/tour-guide/TourGuideDashboard';
import SafariDriverDashboard from '../pages/safari-driver/SafariDriverDashboard';
import VetDashboard from '../pages/vet/VetDashboard';
import CallOperatorDashboard from '../pages/call-operator/CallOperatorDashboard';
import EmergencyOfficerDashboard from '../pages/emergency-officer/EmergencyOfficerDashboard';

const RoleDashboardRouter = () => {
  const { backendUser, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (!backendUser) {
    return <Navigate to="/" replace />;
  }

  // Route to appropriate dashboard based on user role
  switch (backendUser.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'WildlifeOfficer':
      return <WildlifeOfficerDashboard />;
    case 'tourist':
      return <TouristDashboard />;
    case 'tourGuide':
      return <TourGuideDashboard />;
    case 'safariDriver':
      return <SafariDriverDashboard />;
    case 'vet':
      return <VetDashboard />;
    case 'callOperator':
      return <CallOperatorDashboard />;
    case 'EmergencyOfficer':
      return <EmergencyOfficerDashboard />;
    default:
      return (
        <div className="flex flex-col min-h-screen items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <div className="text-red-600 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Invalid Role</h3>
            <p className="text-sm text-red-600">
              Your account role "{backendUser.role}" is not recognized. Please contact the administrator.
            </p>
          </div>
        </div>
      );
  }
};

export default RoleDashboardRouter;