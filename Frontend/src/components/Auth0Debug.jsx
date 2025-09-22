import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthContext } from '../contexts/AuthContext';

const Auth0Debug = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error,
    loginWithRedirect, 
    logout 
  } = useAuth0();
  
  const { 
    backendUser, 
    accessToken, 
    authError,
    isFullyAuthenticated,
    retryAuthentication 
  } = useAuthContext();

  if (isLoading) {
    return <div className="p-4 bg-blue-100 rounded">🔄 Loading Auth0...</div>;
  }

  return (
    <div className="p-4 space-y-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold">🔧 Auth0 Debug Info</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auth0 Status */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold text-blue-600">Auth0 Status</h4>
          <div className="text-sm space-y-1">
            <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            <div>Loading: {isLoading ? '🔄' : '✅'}</div>
            <div>Error: {error ? `❌ ${error.message}` : '✅'}</div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold text-green-600">Backend Status</h4>
          <div className="text-sm space-y-1">
            <div>Backend User: {backendUser ? '✅' : '❌'}</div>
            <div>Access Token: {accessToken ? '✅' : '❌'}</div>
            <div>Fully Auth: {isFullyAuthenticated ? '✅' : '❌'}</div>
            <div>Error: {authError ? `❌ ${authError.message}` : '✅'}</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold text-purple-600">Auth0 User Info</h4>
          <div className="text-sm space-y-1">
            <div>Email: {user.email}</div>
            <div>Name: {user.name}</div>
            <div>Sub: {user.sub}</div>
            <div>Email Verified: {user.email_verified ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      {/* Backend User Info */}
      {backendUser && (
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold text-orange-600">Backend User Info</h4>
          <div className="text-sm space-y-1">
            <div>ID: {backendUser._id}</div>
            <div>Email: {backendUser.email}</div>
            <div>Role: {backendUser.role}</div>
            <div>Name: {backendUser.name}</div>
          </div>
        </div>
      )}

      {/* Token Info */}
      {accessToken && (
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold text-red-600">Token Info</h4>
          <div className="text-sm space-y-1">
            <div>Length: {accessToken.length}</div>
            <div>Type: {accessToken.split('.').length === 3 ? 'JWT' : 'Opaque'}</div>
            <div>Preview: {accessToken.substring(0, 50)}...</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!isAuthenticated && (
          <button 
            onClick={() => loginWithRedirect()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔑 Login with Auth0
          </button>
        )}
        
        {isAuthenticated && (
          <button 
            onClick={() => logout({ returnTo: window.location.origin })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🚪 Logout
          </button>
        )}
        
        {authError && (
          <button 
            onClick={retryAuthentication}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            🔄 Retry Backend Auth
          </button>
        )}
      </div>

      {/* Error Details */}
      {(error || authError) && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-semibold text-red-600">Error Details</h4>
          {error && (
            <div className="text-sm text-red-700">
              <strong>Auth0 Error:</strong> {error.message}
            </div>
          )}
          {authError && (
            <div className="text-sm text-red-700">
              <strong>Backend Error:</strong> {authError.message}
              {authError.details && <div>Details: {authError.details}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Auth0Debug;