import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { handleUserLogin, setTokenProvider } from '../services/authService';

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
          // If backend auth fails, logout from Auth0
          logout({ logoutParams: { returnTo: window.location.origin } });
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};