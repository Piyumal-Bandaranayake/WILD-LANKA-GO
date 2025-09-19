import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/debug-token', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(400).json({ message: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  try {
    // Decode without verification to see the token structure
    const decoded = jwt.decode(token, { complete: true });
    
    res.json({
      header: decoded.header,
      payload: decoded.payload,
      tokenLength: token.length,
      tokenStart: token.substring(0, 50) + '...'
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to decode token', error: error.message });
  }
});

export default router;