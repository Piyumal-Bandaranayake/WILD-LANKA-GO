import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { handleUserLogin, setTokenProvider, setDevelopmentMode } from '../services/authService';

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
          
          console.log('✅ User authenticated with backend:', userData);
        } catch (error) {
          console.error('❌ Backend authentication failed:', error);
          
          // Check if it's a rate limit error (429) or Auth0 access denied
          if (error.message && error.message.includes('429')) {
            console.log('🚨 Auth0 rate limit hit - using development fallback');
            setDevelopmentMode(true);
            
            // Create a fallback user for development when rate limited
            const fallbackUser = {
              id: 'dev_vet_' + Date.now(),
              name: user.name || 'Dr. Development Vet',
              email: user.email || 'dev.vet@wildlanka.com',
              role: 'vet',
              permissions: ['vet:read', 'vet:write', 'vet:manage'],
              isAuthenticated: true,
              isDevelopmentMode: true
            };
            
            setBackendUser(fallbackUser);
            console.log('✅ Development fallback user created:', fallbackUser);
          } else {
            setDevelopmentMode(true);
            // For other errors, still try to create a basic user
            const basicUser = {
              id: user.sub,
              name: user.name,
              email: user.email,
              role: 'vet', // Default to vet for testing
              permissions: ['vet:read', 'vet:write'],
              isAuthenticated: true,
              hasError: true,
              isDevelopmentMode: true
            };
            setBackendUser(basicUser);
          }
        } finally {
          setAuthLoading(false);
        }
      } else if (!isAuthenticated) {
        // Clear state when not authenticated
        setBackendUser(null);
        setAccessToken(null);
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
      try {
        const token = await getAccessTokenSilently();
        const userData = await handleUserLogin(token);
        setBackendUser(userData);
        setAccessToken(token);
      } catch (error) {
        console.error('Retry authentication failed:', error);
        // Create fallback user again
        const fallbackUser = {
          id: 'retry_vet_' + Date.now(),
          name: user.name || 'Dr. Retry Vet',
          email: user.email,
          role: 'vet',
          permissions: ['vet:read', 'vet:write'],
          isAuthenticated: true,
          isDevelopmentMode: true
        };
        setBackendUser(fallbackUser);
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