import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import flexibleAuthMiddleware from '../flexibleAuthMiddleware.js';
import User from '../../models/User.js';

// Mock dependencies
vi.mock('../../models/User.js');
vi.mock('jsonwebtoken');
vi.mock('jwks-rsa');

describe('flexibleAuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      auth: null,
      user: null
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token validation', () => {
    it('should reject requests without authorization header', async () => {
      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No authorization header'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests without token', async () => {
      req.headers.authorization = 'Bearer ';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject JWE tokens (5 parts)', async () => {
      req.headers.authorization = 'Bearer part1.part2.part3.part4.part5';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token format not supported',
        error: 'JWE_NOT_SUPPORTED',
        details: 'This endpoint only supports JWT tokens'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token formats', async () => {
      req.headers.authorization = 'Bearer invalid.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token format',
        error: 'INVALID_TOKEN_FORMAT',
        details: 'Expected JWT token with 3 parts'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Database user lookup', () => {
    it('should respect existing user roles without overrides', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'vet', // Existing role should be respected
        nickname: 'testuser',
        picture: 'https://example.com/pic.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      User.findOne.mockResolvedValue(mockUser);

      // Mock JWT verification to simulate successful token verification
      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        callback(null, {
          sub: 'auth0|123',
          email: 'test@example.com',
          name: 'Test User'
        });
      });

      req.headers.authorization = 'Bearer valid.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { email: 'test@example.com' },
          { auth0Id: 'auth0|123' }
        ]
      });

      expect(req.user).toEqual({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'vet', // Should preserve the original role
        nickname: 'testuser',
        picture: 'https://example.com/pic.jpg',
        isActive: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });

      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors gracefully without failing authentication', async () => {
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        callback(null, {
          sub: 'auth0|123',
          email: 'test@example.com',
          name: 'Test User'
        });
      });

      req.headers.authorization = 'Bearer valid.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(req.user).toBeNull(); // Should not create fallback user
      expect(next).toHaveBeenCalled(); // Should continue despite DB error
    });

    it('should not create fallback users when user not found in database', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        callback(null, {
          sub: 'auth0|123',
          email: 'test@example.com',
          name: 'Test User'
        });
      });

      req.headers.authorization = 'Bearer valid.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(req.user).toBeNull(); // Should not create fallback user
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle JWT verification errors appropriately', async () => {
      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        const error = new Error('Token verification failed');
        error.name = 'JsonWebTokenError';
        callback(error);
      });

      req.headers.authorization = 'Bearer invalid.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token signature',
        error: 'INVALID_SIGNATURE',
        details: 'Token verification failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired tokens appropriately', async () => {
      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        callback(error);
      });

      req.headers.authorization = 'Bearer expired.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED',
        details: 'Token expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing required claims', async () => {
      const jwt = await import('jsonwebtoken');
      jwt.decode.mockReturnValue({
        payload: {
          sub: 'auth0|123',
          email: 'test@example.com',
          iss: 'https://sanuka.us.auth0.com/'
        }
      });

      jwt.verify.mockImplementation((token, getKey, options, callback) => {
        // Missing required claims
        callback(null, {
          sub: 'auth0|123'
          // Missing email claim
        });
      });

      req.headers.authorization = 'Bearer incomplete.jwt.token';

      await flexibleAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token missing required claims',
        error: 'INCOMPLETE_TOKEN_CLAIMS',
        details: 'Token must contain sub and email claims'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});