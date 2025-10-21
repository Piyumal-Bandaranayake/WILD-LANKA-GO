import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { handleUserLogin, setTokenProvider, setDevelopmentMode } from '../services/authService';
import apiErrorHandler from '../utils/apiErrorHandler';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect, 
    logout, 
    getAccessTokenSilently 
  } = useAuth0();
  
  const [backendUser, setBackendUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Get access token and register user with backend
  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated && user && !backendUser) {
        try {
          setAuthLoading(true);
          
          // Get access token from Auth0
          const token = await getAccessTokenSilently();
          setAccessToken(token);
          
          console.log('🔑 Token received:', token.substring(0, 50) + '...');
          console.log('📏 Token length:', token.length);
          console.log('🔍 Token type:', token.split('.').length === 3 ? 'JWT' : 'Opaque');
          
          // Set up token provider for API calls
          setTokenProvider(async () => {
            try {
              return await getAccessTokenSilently();
            } catch (error) {
              console.error('Failed to get token:', error);
              return null;
            }
          });
          
          // Register/login user with backend
          const userData = await handleUserLogin(token);
          setBackendUser(userData);
          setAuthError(null); // Clear any previous errors
          
          console.log('✅ User authenticated with backend:', userData);
        } catch (error) {
          console.error('❌ Backend authentication failed:', error);
          
          // Create comprehensive error notification
          const errorNotification = apiErrorHandler.createErrorNotification(error, {
            operation: 'backend_authentication',
            userEmail: user?.email,
            auth0Id: user?.sub
          });
          
          // Set error state for user feedback
          setAuthError({
            message: errorNotification.message,
            details: errorNotification.details || error.message,
            canRetry: errorNotification.canRetry,
            timestamp: errorNotification.timestamp,
            id: errorNotification.id
          });
          
          // Don't create fallback users with hardcoded roles
          setBackendUser(null);
          setAccessToken(null);
          
          // Set development mode if it's a rate limit error for debugging purposes
          if (error.status === 429 || (error.message && error.message.includes('429'))) {
            console.log('🚨 Auth0 rate limit hit - authentication failed');
            setDevelopmentMode(true);
            setAuthError({
              message: 'Authentication rate limit exceeded',
              details: 'Please wait a moment and try again',
              canRetry: true,
              timestamp: new Date().toISOString(),
              id: Date.now().toString()
            });
          }
        } finally {
          setAuthLoading(false);
        }
      } else if (!isAuthenticated) {
        // Clear state when not authenticated
        setBackendUser(null);
        setAccessToken(null);
        setAuthError(null);
        setTokenProvider(null);
        setAuthLoading(false);
      }
    };

    if (!isLoading) {
      initializeAuth();
    }
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently, backendUser, logout]);

  // Function to get fresh access token
  const getToken = async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      const token = await getAccessTokenSilently();
      setAccessToken(token);
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  };

  // Check if user is fully authenticated (both Auth0 and backend)
  const isFullyAuthenticated = isAuthenticated && backendUser && accessToken;

  // Retry authentication function
  const retryAuthentication = async () => {
    if (isAuthenticated && user) {
      setAuthLoading(true);
      setBackendUser(null);
      setAuthError(null);
      try {
        const token = await getAccessTokenSilently();
        const userData = await handleUserLogin(token);
        setBackendUser(userData);
        setAccessToken(token);
        setAuthError(null); // Clear error on successful retry
      } catch (error) {
        console.error('Retry authentication failed:', error);
        
        // Create comprehensive error notification for retry failure
        const errorNotification = apiErrorHandler.createErrorNotification(error, {
          operation: 'retry_authentication',
          userEmail: user?.email,
          auth0Id: user?.sub,
          isRetry: true
        });
        
        setAuthError({
          message: errorNotification.message,
          details: errorNotification.details || error.message,
          canRetry: errorNotification.canRetry,
          timestamp: errorNotification.timestamp,
          id: errorNotification.id
        });
        
        // Don't create fallback users - respect authentication failures
        setBackendUser(null);
        setAccessToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const value = {
    // Auth0 state
    isAuthenticated,
    isLoading: isLoading || authLoading,
    user,
    loginWithRedirect,
    logout,
    
    // Backend state
    backendUser,
    accessToken,
    isFullyAuthenticated,
    authError,
    
    // Functions
    getToken,
    retryAuthentication,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};