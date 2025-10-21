import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import User from '../models/User.js';

const client = jwksClient({
    jwksUri: 'https://sanuka.us.auth0.com/.well-known/jwks.json',
    requestHeaders: {}, // Optional
    timeout: 30000, // Defaults to 30s
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error('Error getting signing key:', {
                kid: header.kid,
                error: err.message
            });
            return callback(err);
        }
        
        // Extract the public key properly
        let signingKey;
        if (key.getPublicKey) {
            signingKey = key.getPublicKey();
        } else if (key.publicKey) {
            signingKey = key.publicKey;
        } else if (key.rsaPublicKey) {
            signingKey = key.rsaPublicKey;
        } else {
            console.error('Unable to extract public key from signing key');
            return callback(new Error('Unable to extract public key'));
        }
        
        callback(null, signingKey);
    });
}

const flexibleAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Only handle JWT tokens (3 parts) - reject JWE tokens (5 parts)
        const tokenParts = token.split('.');
        
        if (tokenParts.length === 5) {
            // This is a JWE token - we don't support JWE tokens in this middleware
            console.error('JWE tokens are not supported in this middleware');
            return res.status(401).json({ 
                message: 'Token format not supported', 
                error: 'JWE_NOT_SUPPORTED',
                details: 'This endpoint only supports JWT tokens'
            });
        }
        
        if (tokenParts.length !== 3) {
            console.error('Invalid token format - expected JWT with 3 parts, got:', tokenParts.length);
            return res.status(401).json({ 
                message: 'Invalid token format', 
                error: 'INVALID_TOKEN_FORMAT',
                details: 'Expected JWT token with 3 parts'
            });
        }

        // Decode and verify JWT token
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded) {
            console.error('Failed to decode JWT token');
            return res.status(401).json({ 
                message: 'Invalid token format', 
                error: 'TOKEN_DECODE_FAILED',
                details: 'Unable to decode JWT token'
            });
        }

        console.log('Token decoded successfully:', {
            sub: decoded.payload.sub,
            email: decoded.payload.email,
            iss: decoded.payload.iss,
            exp: decoded.payload.exp
        });

        // Verify the token signature and claims
        jwt.verify(token, getKey, {
            issuer: 'https://sanuka.us.auth0.com/',
            algorithms: ['RS256'],
        }, async (err, verifiedPayload) => {
            if (err) {
                console.error('JWT verification failed:', {
                    name: err.name,
                    message: err.message,
                    expiredAt: err.expiredAt
                });
                
                // Provide specific error messages for different failure types
                let errorMessage = 'Token verification failed';
                let errorCode = 'TOKEN_VERIFICATION_FAILED';
                
                if (err.name === 'TokenExpiredError') {
                    errorMessage = 'Token has expired';
                    errorCode = 'TOKEN_EXPIRED';
                } else if (err.name === 'JsonWebTokenError') {
                    errorMessage = 'Invalid token signature';
                    errorCode = 'INVALID_SIGNATURE';
                } else if (err.name === 'NotBeforeError') {
                    errorMessage = 'Token not active yet';
                    errorCode = 'TOKEN_NOT_ACTIVE';
                }
                
                return res.status(401).json({ 
                    message: errorMessage, 
                    error: errorCode,
                    details: err.message 
                });
            }

            // Validate required claims
            if (!verifiedPayload.sub || !verifiedPayload.email) {
                console.error('Token missing required claims:', verifiedPayload);
                return res.status(401).json({ 
                    message: 'Token missing required claims', 
                    error: 'INCOMPLETE_TOKEN_CLAIMS',
                    details: 'Token must contain sub and email claims'
                });
            }

            // Extract user info from verified token
            req.auth = {
                payload: {
                    sub: verifiedPayload.sub,
                    email: verifiedPayload.email,
                    name: verifiedPayload.name,
                    email_verified: verifiedPayload.email_verified,
                    aud: verifiedPayload.aud,
                    iss: verifiedPayload.iss,
                    verified_at: new Date().toISOString()
                }
            };

            console.log('✅ JWT verified successfully:', {
                sub: req.auth.payload.sub,
                email: req.auth.payload.email
            });

            // Fetch user from database - respect existing roles without overrides
            try {
                const email = req.auth.payload.email;
                const auth0Id = req.auth.payload.sub;

                const user = await User.findOne({
                    $or: [
                        { email: email },
                        { auth0Id: auth0Id }
                    ]
                });

                if (user) {
                    // Use the user's actual role from database without any overrides
                    req.user = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role, // Respect the actual role from database
                        nickname: user.nickname,
                        picture: user.picture,
                        isActive: user.isActive,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    };

                    console.log(`✅ User found in database: ${user.email} (role: ${user.role})`);
                } else {
                    console.warn(`⚠️ User not found in database: ${email} (${auth0Id})`);
                    // Don't create fallback users - let the application handle this appropriately
                    req.user = null;
                }
            } catch (dbError) {
                console.error('❌ Database error while fetching user:', {
                    message: dbError.message,
                    email: req.auth.payload.email
                });
                // Don't fail the request due to database errors, but log them
                req.user = null;
            }

            next();
        });
    } catch (error) {
        console.error('❌ Token processing error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Provide appropriate error response based on error type
        let statusCode = 401;
        let errorMessage = 'Token processing failed';
        let errorCode = 'TOKEN_PROCESSING_ERROR';
        
        if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
            statusCode = 503;
            errorMessage = 'Authentication service unavailable';
            errorCode = 'AUTH_SERVICE_UNAVAILABLE';
        } else if (error.message.includes('timeout')) {
            statusCode = 408;
            errorMessage = 'Authentication timeout';
            errorCode = 'AUTH_TIMEOUT';
        }
        
        return res.status(statusCode).json({ 
            message: errorMessage, 
            error: errorCode,
            details: error.message 
        });
    }
};

export default flexibleAuthMiddleware;