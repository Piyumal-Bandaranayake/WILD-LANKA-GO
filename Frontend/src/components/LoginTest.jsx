import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginTest = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Auth0 Test Component</h3>
      
      {!isAuthenticated ? (
        <div>
          <p className="mb-2">Not logged in</p>
          <button 
            onClick={() => loginWithRedirect()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login with Auth0
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-2">Logged in as: {user.name}</p>
          <p className="mb-2">Email: {user.email}</p>
          <button 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginTest;