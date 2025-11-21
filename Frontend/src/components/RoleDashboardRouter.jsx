import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardErrorBoundary from './DashboardErrorBoundary';

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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on user role with error boundaries
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return (
          <DashboardErrorBoundary dashboardType="admin">
            <AdminDashboard />
          </DashboardErrorBoundary>
        );
      case 'wildlifeOfficer':
        return (
          <DashboardErrorBoundary dashboardType="wildlife-officer">
            <WildlifeOfficerDashboard />
          </DashboardErrorBoundary>
        );
      case 'tourist':
        return (
          <DashboardErrorBoundary dashboardType="tourist">
            <TouristDashboard />
          </DashboardErrorBoundary>
        );
      case 'tourGuide':
        return (
          <DashboardErrorBoundary dashboardType="tour-guide">
            <TourGuideDashboard />
          </DashboardErrorBoundary>
        );
      case 'safariDriver':
        return (
          <DashboardErrorBoundary dashboardType="safari-driver">
            <SafariDriverDashboard />
          </DashboardErrorBoundary>
        );
      case 'vet':
        return (
          <DashboardErrorBoundary dashboardType="vet">
            <VetDashboard />
          </DashboardErrorBoundary>
        );
      case 'callOperator':
        return (
          <DashboardErrorBoundary dashboardType="call-operator">
            <CallOperatorDashboard />
          </DashboardErrorBoundary>
        );
      case 'emergencyOfficer':
        return (
          <DashboardErrorBoundary dashboardType="emergency-officer">
            <EmergencyOfficerDashboard />
          </DashboardErrorBoundary>
        );
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
              <p className="text-sm text-red-600 mb-4">
                Your account role "{user.role}" is not recognized. Please contact the administrator.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default RoleDashboardRouter;
