import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Dashboard-specific error boundary with role-aware error handling
 * Provides contextual error messages and recovery options for dashboard components
 */
const DashboardErrorBoundary = ({ children, dashboardType }) => {
  const { backendUser } = useAuthContext();

  const handleError = (error, errorInfo) => {
    // Log dashboard-specific error information
    console.error(`Dashboard Error [${dashboardType}]:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userRole: backendUser?.role,
      userId: backendUser?._id,
      dashboardType,
      timestamp: new Date().toISOString()
    });
  };

  const handleRetry = () => {
    // Dashboard-specific retry logic
    console.log(`Retrying ${dashboardType} dashboard...`);
  };

  const customFallback = (error, retry) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation placeholder */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="ml-3 h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Error content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-16 w-16 text-red-500 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard Error
            </h2>
            <p className="mt-2 text-gray-600">
              There was an issue loading your {dashboardType} dashboard. This might be a temporary problem.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What you can try:
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Refresh the page to reload the dashboard</li>
                    <li>Check your internet connection</li>
                    <li>Try logging out and logging back in</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload Page
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
              </svg>
              Go to Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-red-50 border border-red-200 rounded-lg p-4">
              <summary className="text-sm font-medium text-red-800 cursor-pointer">
                Error Details (Development)
              </summary>
              <div className="mt-2 text-xs text-red-700">
                <p><strong>Error:</strong> {error?.message}</p>
                <p><strong>Dashboard:</strong> {dashboardType}</p>
                <p><strong>User Role:</strong> {backendUser?.role}</p>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32 text-xs">
                  {error?.stack}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      onError={handleError}
      onRetry={handleRetry}
      fallback={customFallback}
      userId={backendUser?._id}
      userRole={backendUser?.role}
    >
      {children}
    </ErrorBoundary>
  );
};

export default DashboardErrorBoundary;