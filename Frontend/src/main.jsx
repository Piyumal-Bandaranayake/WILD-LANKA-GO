import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';
import App from './App.jsx';
import config from './auth_config.json';

const onRedirectCallback = (appState) => {
  // You can handle the redirect here if needed
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(config.audience && { audience: config.audience }),
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>,
);