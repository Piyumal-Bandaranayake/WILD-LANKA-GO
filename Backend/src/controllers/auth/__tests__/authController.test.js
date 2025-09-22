import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleLogin, getUserProfile } from '../authController.js';
import User from '../../../models/User.js';

// Mock all the user models
vi.mock('../../../models/User.js');
vi.mock('../../../models/User/EmergencyOfficer.js');
vi.mock('../../../models/User/admin.js');
vi.mock('../../../models/User/callOperator.js');
vi.mock('../../../models/User/safariDriver.js');
vi.mock('../../../models/User/tourGuide.js');
vi.mock('../../../models/User/tourist.js');
vi.mock('../../../models/User/vet.js');
vi.mock('../../../models/User/WildlifeOfficer.js');

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      auth: {
        payload: {
          sub: 'auth0|123456',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
          email_verified: true
        }
      },
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('Test User Agent')
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleLogin', () => {
    it('should respect existing user roles without overriding them', async () => {
      const existingUser = {
        _id: 'user123',
        auth0Id: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
        role: 'vet', // Existing role that should be preserved
        auth_metadata: {
          login_count: 5
        },
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
          role: 'vet'
        }),
        profileCompletionPercentage: 80,
        fullName: 'Test User'
      };

      const updatedUser = {
        ...existingUser,
        auth_metadata: {
          login_count: 6,
          last_login: expect.any(Date)
        }
      };

      User.findOne.mockResolvedValue(existingUser);
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      await handleLogin(req, res);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'auth0|123456' },
        {
          $set: expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            // Should NOT contain role update - existing role should be preserved
            'auth_metadata.last_login': expect.any(Date),
            'auth_metadata.login_count': 6
          })
        },
        { new: true, runValidators: true }
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'user123',
          email: 'test@example.com',
          role: 'vet' // Should preserve existing role
        })
      );
    });

    it('should create new user with determined role when user does not exist', async () => {
      User.findOne.mockResolvedValue(null); // User doesn't exist

      const newUser = {
        _id: 'newuser123',
        auth0Id: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
        role: 'tourist', // Default role for new users
        auth_metadata: {
          login_count: 1
        },
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: 'newuser123',
          email: 'test@example.com',
          role: 'tourist'
        }),
        profileCompletionPercentage: 60,
        fullName: 'Test User'
      };

      // Mock the User constructor
      User.mockImplementation(() => newUser);

      await handleLogin(req, res);

      expect(newUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'newuser123',
          email: 'test@example.com',
          role: 'tourist'
        })
      );
    });

    it('should handle authentication errors without creating fallback users', async () => {
      req.auth = null; // No authentication payload

      await handleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      await handleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database connection failed'
      });
    });

    it('should not override admin role with automatic determination', async () => {
      const adminUser = {
        _id: 'admin123',
        auth0Id: 'auth0|123456',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin', // Existing admin role
        auth_metadata: {
          login_count: 10
        },
        toObject: () => ({
          _id: 'admin123',
          email: 'admin@example.com',
          role: 'admin'
        }),
        profileCompletionPercentage: 100,
        fullName: 'Admin User'
      };

      const updatedAdminUser = {
        ...adminUser,
        auth_metadata: {
          login_count: 11
        }
      };

      User.findOne.mockResolvedValue(adminUser);
      User.findOneAndUpdate.mockResolvedValue(updatedAdminUser);

      req.auth.payload.email = 'admin@example.com';

      await handleLogin(req, res);

      // Verify that the role is not changed even if email suggests different role
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'auth0|123456' },
        {
          $set: expect.not.objectContaining({
            role: expect.anything() // Should not update role
          })
        },
        { new: true, runValidators: true }
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin' // Should preserve admin role
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without role overrides', async () => {
      const user = {
        _id: 'user123',
        auth0Id: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
        role: 'vet',
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
          role: 'vet'
        }),
        profileCompletionPercentage: 80,
        fullName: 'Test User'
      };

      User.findOne.mockResolvedValue(user);

      await getUserProfile(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        auth0Id: 'auth0|123456'
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'user123',
          email: 'test@example.com',
          role: 'vet' // Should return actual role without modification
        })
      );
    });

    it('should handle missing authentication', async () => {
      req.auth = null;

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
    });

    it('should handle user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });
});