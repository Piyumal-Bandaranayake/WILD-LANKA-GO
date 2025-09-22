// Legacy auth middleware - now using Auth0 UserInfo approach
import auth0UserInfoMiddleware from './auth0UserInfoMiddleware.js';

// Export the new middleware to maintain compatibility
export default auth0UserInfoMiddleware;