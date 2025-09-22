import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

const onRedirectCallback = (appState) => {
  // You can handle the redirect here if needed
};

// Use environment variables for Auth0 configuration
const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'sanuka.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'tkJJzksIzwt2CdR6g7pQjVGZ9GlfVpZR',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin
};

console.log('🔧 Auth0 Configuration:', {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  audience: auth0Config.audience,
  redirectUri: auth0Config.redirectUri
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        ...(auth0Config.audience && { audience: auth0Config.audience }),
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>,
);