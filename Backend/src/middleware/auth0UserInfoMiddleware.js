import fetch from 'node-fetch';

const auth0UserInfoMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('❌ No authorization header provided');
        return res.status(401).json({ 
            message: 'Authorization required', 
            error: 'NO_AUTH_HEADER' 
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.log('❌ No token in authorization header');
        return res.status(401).json({ 
            message: 'Token required', 
            error: 'NO_TOKEN' 
        });
    }

    // Log token info for debugging
    console.log('🔍 Processing token:', {
        length: token.length,
        type: token.split('.').length === 3 ? 'JWT' : 'Opaque',
        prefix: token.substring(0, 20) + '...'
    });

    try {
        // Call Auth0's userinfo endpoint with the token
        const response = await fetch('https://sanuka.us.auth0.com/userinfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Auth0 userinfo error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            return res.status(401).json({ 
                message: 'Token validation failed', 
                error: 'INVALID_TOKEN',
                details: `Auth0 returned ${response.status}: ${errorText}`
            });
        }

        const userInfo = await response.json();
        
        // Validate required user info
        if (!userInfo.sub || !userInfo.email) {
            console.error('❌ Invalid user info from Auth0:', userInfo);
            return res.status(401).json({ 
                message: 'Invalid user information', 
                error: 'INCOMPLETE_USER_INFO' 
            });
        }

        console.log('✅ User authenticated:', {
            sub: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            email_verified: userInfo.email_verified
        });

        // Set the user info in the request
        req.auth = {
            payload: {
                sub: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                email_verified: userInfo.email_verified,
                picture: userInfo.picture,
                // Add timestamp for debugging
                authenticated_at: new Date().toISOString()
            }
        };

        next();
    } catch (error) {
        console.error('❌ Auth0 userinfo request failed:', {
            message: error.message,
            stack: error.stack
        });
        
        return res.status(401).json({ 
            message: 'Authentication service unavailable', 
            error: 'AUTH_SERVICE_ERROR',
            details: error.message 
        });
    }
};

export default auth0UserInfoMiddleware;