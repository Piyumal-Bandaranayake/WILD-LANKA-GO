import React, { createContext, useContext, useState, useEffect } from 'react';
import { setTokenProvider, protectedApi } from '../services/authService';
import { safeLocalStorage } from '../utils/localStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token provider function for authService
  const getToken = () => token;

  useEffect(() => {
    // Set up token provider for authService whenever token changes
    setTokenProvider(getToken);
    console.log('🔑 Token provider updated. Has token:', !!token);
  }, [token]);

  // Prevent multiple token provider updates during initialization
  useEffect(() => {
    // Only set token provider once when component mounts
    if (!loading) {
      setTokenProvider(getToken);
      console.log('🔑 Initial token provider set. Has token:', !!token);
    }
  }, [loading]);

  useEffect(() => {
    // Check for existing token and user data on app load
    const storedToken = safeLocalStorage.getItem('token');
    const storedUser = safeLocalStorage.getJSON('user');
    const storedBackendUser = safeLocalStorage.getJSON('backendUser');

    console.log('🔍 Loading auth data from localStorage:', {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      hasBackendUser: !!storedBackendUser,
      userRole: storedUser?.role,
      userEmail: storedUser?.email,
      userKeys: storedUser ? Object.keys(storedUser) : 'No user',
      fullStoredUser: storedUser // Log full stored user for debugging
    });

    if (storedToken && storedUser) {
      // Validate that user has required properties
      if (!storedUser.role || storedUser.role === '') {
        console.warn('⚠️ User data missing role, clearing auth data');
        safeLocalStorage.clearAuthData();
        setLoading(false);
        return;
      }
      
      setToken(storedToken);
      setUser(storedUser);
      if (storedBackendUser) {
        setBackendUser(storedBackendUser);
      }
      console.log('🔑 Token and user loaded from localStorage');
    } else {
      // Clear any invalid data
      safeLocalStorage.clearAuthData();
    }
    setLoading(false);
  }, []);

  // Global authentication error handler
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log('🔒 Global authentication error detected:', event.detail);
      
      // Only handle 401 errors for protected endpoints
      if (event.detail.status === 401) {
        console.log('🔄 Handling global 401 error - clearing auth data');
        
        // Clear authentication data
        setUser(null);
        setBackendUser(null);
        setToken(null);
        safeLocalStorage.clearAuthData();
        
        // Show user-friendly message
        alert('🔐 Session Expired\n\n' +
              '💡 Your session has expired. Please log in again to continue.\n' +
              '🔄 You will be redirected to the login page.');
        
        // Redirect to login page
        window.location.href = '/login';
      }
    };

    // Add event listener for global authentication errors
    window.addEventListener('authError', handleAuthError);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  // Handle browser close/refresh - set user as unavailable
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (token && user) {
        try {
          // Use sendBeacon for reliable delivery even when page is closing
          const logoutData = JSON.stringify({});
          navigator.sendBeacon(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/logout`,
            logoutData
          );
          console.log('🔄 User status set to unavailable via sendBeacon');
        } catch (error) {
          console.error('❌ Failed to set user as unavailable on page unload:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && token && user) {
        try {
          await protectedApi.logout();
          console.log('🔄 User status set to unavailable on page hidden');
        } catch (error) {
          console.error('❌ Failed to set user as unavailable on visibility change:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user]);

  const login = (userData, tokenData, backendUserData = null) => {
    console.log('🔑 AuthContext login called:', {
      hasUserData: !!userData,
      hasTokenData: !!tokenData,
      hasBackendUserData: !!backendUserData,
      userRole: userData?.role,
      userId: userData?._id,
      userEmail: userData?.email,
      tokenPreview: tokenData ? tokenData.substring(0, 50) + '...' : 'No token',
      userDataKeys: userData ? Object.keys(userData) : 'No userData',
      tokenType: typeof tokenData,
      fullUserData: userData // Log full user data for debugging
    });
    
    // Validate data before storing
    if (!userData || !tokenData) {
      console.error('❌ Invalid login data provided:', {
        userData: userData,
        tokenData: tokenData,
        userDataType: typeof userData,
        tokenDataType: typeof tokenData
      });
      return;
    }

    // Clear any existing auth data first to prevent conflicts
    console.log('🧹 Clearing existing auth data before login');
    safeLocalStorage.clearAuthData();
    
    // Set state with fresh data
    setUser(userData);
    setToken(tokenData);
    if (backendUserData) {
      setBackendUser(backendUserData);
    } else {
      // Use the same userData for backendUser if not provided separately
      setBackendUser(userData);
    }
    
    // Use safe localStorage utilities
    const userStored = safeLocalStorage.setItem('user', userData);
    const tokenStored = safeLocalStorage.setItem('token', tokenData);
    const backendUserStored = safeLocalStorage.setItem('backendUser', backendUserData || userData);
    
    if (userStored && tokenStored && backendUserStored) {
      console.log('🔑 Token and user stored in localStorage');
      console.log('🔑 Stored user ID:', userData._id);
      console.log('🔑 Stored user email:', userData.email);
      
      // Log role-based navigation info
      console.log('🎯 User role detected:', userData?.role);
      console.log('🎯 Will navigate to role-based dashboard');
    } else {
      console.error('❌ Failed to store auth data in localStorage');
    }
  };

  const updateUser = (updatedUserData) => {
    console.log('🔄 Updating user data in AuthContext:', updatedUserData);
    
    // Validate that the updated data exists
    if (!updatedUserData) {
      console.error('❌ Attempted to update user with null/undefined data:', updatedUserData);
      return;
    }
    
    // If role is missing, try to determine it from userType or default to 'tourist'
    let userRole = updatedUserData.role;
    if (!userRole || userRole === '') {
      // Try to get role from userType or default to 'tourist'
      userRole = updatedUserData.userType === 'systemUser' ? 'admin' : 'tourist';
      console.log('⚠️ Role missing, determined role as:', userRole);
    }
    
    // Add the determined role to the updated data
    const dataWithRole = {
      ...updatedUserData,
      role: userRole
    };
    
    // Ensure we preserve critical fields if they're missing in the update
    const safeUpdatedData = {
      ...user, // Start with current user data
      ...dataWithRole, // Override with new data (with role)
      // Ensure these critical fields are never lost
      role: userRole, // Use the determined role
      email: updatedUserData.email || user?.email,
      _id: updatedUserData._id || user?._id
    };
    
    console.log('🔄 Safe updated user data:', safeUpdatedData);
    
    setUser(safeUpdatedData);
    setBackendUser(safeUpdatedData);
    
    // Update localStorage
    safeLocalStorage.setItem('user', safeUpdatedData);
    safeLocalStorage.setItem('backendUser', safeUpdatedData);
  };

  const logout = async () => {
    try {
      // Call backend logout API to update user status
      if (token) {
        console.log('🔄 Calling backend logout API...');
        await protectedApi.logout();
        console.log('✅ Backend logout successful');
      }
    } catch (error) {
      console.error('❌ Backend logout failed:', error);
      // Continue with local logout even if backend call fails
    }
    
    // Clear local state and storage
    setUser(null);
    setBackendUser(null);
    setToken(null);
    safeLocalStorage.clearAuthData();
    console.log('✅ Local logout completed');
  };

  // Automatic token refresh function
  const refreshToken = async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      const response = await protectedApi.refreshToken();
      
      if (response.data.success) {
        const newToken = response.data.token;
        const updatedUser = response.data.user;
        
        console.log('✅ Token refreshed successfully');
        
        // Validate updated user data before setting
        if (!updatedUser.role || updatedUser.role === '') {
          console.error('❌ Token refresh returned user data without role:', updatedUser);
          console.error('❌ Preserving current user data to prevent role corruption');
          // Update only the token, keep existing user data
          setToken(newToken);
          safeLocalStorage.setItem('token', newToken);
        } else {
          // Update token and user data
          setToken(newToken);
          setUser(updatedUser);
          setBackendUser(updatedUser);
          
          // Update localStorage
          safeLocalStorage.setItem('token', newToken);
          safeLocalStorage.setItem('user', updatedUser);
          safeLocalStorage.setItem('backendUser', updatedUser);
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // If it's a 401 error, the refresh token is also invalid
      if (error.response?.status === 401 || error.status === 401) {
        console.log('❌ Refresh token is also invalid (401), clearing auth data');
        logout();
        return false;
      }
      
      // Don't immediately logout for other errors - let the calling function decide
      return false;
    }
  };

  // Check token validity and refresh if needed
  const checkTokenValidity = async () => {
    if (!token) return false;
    
    try {
      await protectedApi.validateToken();
      return true;
    } catch (error) {
      console.log('🔄 Token invalid, attempting refresh...');
      
      // If it's a 401 error, the token is completely invalid
      if (error.response?.status === 401 || error.status === 401) {
        console.log('❌ Token is completely invalid (401), clearing auth data');
        logout();
        return false;
      }
      
      const refreshResult = await refreshToken();
      
      // If refresh fails, check if we still have valid local auth data
      if (!refreshResult && user && backendUser) {
        console.log('🔄 Token refresh failed, but user data exists locally. Checking if user is still valid...');
        
        // Try to validate the user data by making a simple API call
        try {
          // Use a simple endpoint that doesn't require token validation
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/health`);
          if (response.ok) {
            console.log('✅ Backend is accessible, keeping user logged in');
            return true; // Keep user logged in if backend is accessible
          }
        } catch (healthError) {
          console.log('❌ Backend health check failed, user will be logged out');
        }
      }
      
      return refreshResult;
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const value = {
    user,
    backendUser,
    token,
    loading,
    login,
    updateUser,
    logout,
    isAuthenticated,
    getAuthHeaders,
    refreshToken,
    checkTokenValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
