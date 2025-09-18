import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://sanuka.us.auth0.com/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const simpleAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify the token properly
  jwt.verify(token, getKey, {
    audience: 'https://sanuka.us.auth0.com/api/v2/',
    issuer: 'https://sanuka.us.auth0.com/',
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Extract user info from token
    req.auth = {
      payload: {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        email_verified: decoded.email_verified
      }
    };

    next();
  });
};

export default simpleAuthMiddleware;