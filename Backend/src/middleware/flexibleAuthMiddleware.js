import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

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

const flexibleAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // First, decode the token to see what we're working with
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token format' });
    }

    console.log('Token payload:', decoded.payload);

    // Verify the token
    jwt.verify(token, getKey, {
        issuer: 'https://sanuka.us.auth0.com/',
        algorithms: ['RS256'],
        // Don't specify audience - let it work with both ID tokens and access tokens
    }, (err, verifiedPayload) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(401).json({ message: 'Token verification failed', error: err.message });
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
        next();
    });
};

export default flexibleAuthMiddleware;