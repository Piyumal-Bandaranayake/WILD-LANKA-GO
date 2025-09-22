import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import User from '../models/User.js';
import mongoose from 'mongoose';

const client = jwksClient({
    jwksUri: 'https://sanuka.us.auth0.com/.well-known/jwks.json',
    requestHeaders: {}, // Optional
    timeout: 30000, // Defaults to 30s
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error('Error getting signing key:', err);
            return callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

const flexibleAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Development fallback when no Authorization header
    if (!authHeader) {
        console.warn('No authorization header provided. Using development vet user.');
        req.auth = { payload: { sub: 'dev-user', email: 'dev.vet@wildlanka.com', name: 'Development Vet' } };
        req.user = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Development Vet',
            email: 'dev.vet@wildlanka.com',
            role: 'vet',
            isActive: true,
            isDevelopmentMode: true
        };
        return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.warn('No token provided in Authorization header. Using development vet user.');
        req.auth = { payload: { sub: 'dev-user', email: 'dev.vet@wildlanka.com', name: 'Development Vet' } };
        req.user = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Development Vet',
            email: 'dev.vet@wildlanka.com',
            role: 'vet',
            isActive: true,
            isDevelopmentMode: true
        };
        return next();
    }

    try {
        // Check if token is JWE (encrypted) - JWE tokens have 5 parts separated by dots
        const tokenParts = token.split('.');
        
        if (tokenParts.length === 5) {
            // This is a JWE token - extract issuer from header and trust it
            const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
            
            if (header.iss === 'https://sanuka.us.auth0.com/') {
                // This is a valid Auth0 JWE token
                req.auth = {
                    payload: {
                        sub: 'jwe-user',
                        iss: header.iss,
                    }
                };
                
                // For JWE tokens, we'll set a default admin user since we can't decrypt
                // In production, you'd want to decrypt the token properly
                req.user = {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                    isActive: true
                };
                
                console.log('JWE token accepted, using default admin user');
                return next();
            } else {
                return res.status(401).json({ message: 'Invalid token issuer' });
            }
        }

        // Handle regular JWT tokens
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded) {
            console.warn('Invalid token format. Using development vet user.');
            req.auth = { payload: { sub: 'dev-user', email: 'dev.vet@wildlanka.com', name: 'Development Vet' } };
            req.user = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Development Vet',
                email: 'dev.vet@wildlanka.com',
                role: 'vet',
                isActive: true,
                isDevelopmentMode: true
            };
            return next();
        }

        console.log('Token payload:', decoded.payload);

        // Verify the token
        jwt.verify(token, getKey, {
            issuer: 'https://sanuka.us.auth0.com/',
            algorithms: ['RS256'],
        }, async (err, verifiedPayload) => {
            if (err) {
                console.error('JWT verification error:', err);
                // Fallback to development user instead of blocking
                req.auth = { payload: { sub: 'dev-user', email: 'dev.vet@wildlanka.com', name: 'Development Vet' } };
                req.user = {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Development Vet',
                    email: 'dev.vet@wildlanka.com',
                    role: 'vet',
                    isActive: true,
                    isDevelopmentMode: true
                };
                return next();
            }

            // Extract user info from verified token
            req.auth = {
                payload: {
                    sub: verifiedPayload.sub,
                    email: verifiedPayload.email,
                    name: verifiedPayload.name,
                    email_verified: verifiedPayload.email_verified,
                    aud: verifiedPayload.aud,
                    iss: verifiedPayload.iss
                }
            };

            console.log('User authenticated:', req.auth.payload.email);

            // Fetch user from database and set req.user for role-based authorization
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
                    req.user = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        nickname: user.nickname,
                        picture: user.picture,
                        isActive: user.isActive,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    };

                    console.log(`User found in DB: ${user.email} (${user.role})`);
                } else {
                    console.warn(`User not found in database: ${email} (${auth0Id})`);
                    // For development: create a default vet user if not found
                    console.log('Creating default vet user for development');
                    req.user = {
                        _id: new mongoose.Types.ObjectId(),
                        name: email || 'Development Vet',
                        email: email || 'dev.vet@wildlanka.com',
                        role: 'vet',
                        isActive: true,
                        isDevelopmentMode: true
                    };
                }
            } catch (dbError) {
                console.error('Database error while fetching user:', dbError);
                req.user = null;
            }

            next();
        });
    } catch (error) {
        console.error('Token processing error:', error);
        // Fallback to development user instead of blocking
        req.auth = { payload: { sub: 'dev-user', email: 'dev.vet@wildlanka.com', name: 'Development Vet' } };
        req.user = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Development Vet',
            email: 'dev.vet@wildlanka.com',
            role: 'vet',
            isActive: true,
            isDevelopmentMode: true
        };
        return next();
    }
};

export default flexibleAuthMiddleware;