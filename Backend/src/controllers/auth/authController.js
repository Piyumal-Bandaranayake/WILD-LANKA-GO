import User from '../../models/User.js';
import EmergencyOfficer from '../../models/User/EmergencyOfficer.js';
import Admin from '../../models/User/admin.js';
import CallOperator from '../../models/User/callOperator.js';
import SafariDriver from '../../models/User/safariDriver.js';
import TourGuide from '../../models/User/tourGuide.js';
import Tourist from '../../models/User/tourist.js';
import Vet from '../../models/User/vet.js';
import WildlifeOfficer from '../../models/User/WildlifeOfficer.js';
import logger from '../../utils/logger.js';

/**
 * Comprehensive role determination algorithm
 * Priority-based role assignment: specialized models > existing users > Auth0 metadata > business rules > default
 */
const determineUserRole = async (userInfo, email, auth0Id) => {
  logger.authAttempt('Starting role determination', { 
    email, 
    auth0Id,
    hasAppMetadata: !!userInfo.app_metadata 
  });

  // Priority 1: Check if user exists in specialized models (highest priority)
  const specializedModels = [
    { model: Admin, role: 'admin', emailField: 'Email' },
    { model: EmergencyOfficer, role: 'EmergencyOfficer', emailField: 'Email' },
    { model: CallOperator, role: 'callOperator', emailField: 'email' },
    { model: SafariDriver, role: 'safariDriver', emailField: 'Email' },
    { model: TourGuide, role: 'tourGuide', emailField: 'email' },
    { model: Vet, role: 'vet', emailField: 'Email' },
    { model: WildlifeOfficer, role: 'WildlifeOfficer', emailField: 'Email' },
    { model: Tourist, role: 'tourist', emailField: 'Email' }
  ];

  for (const { model, role, emailField } of specializedModels) {
    try {
      const query = { [emailField]: email };
      const specializedUser = await model.findOne(query);
      if (specializedUser) {
        logger.roleAssignment('Role found in specialized model', {
          email,
          role,
          model: model.modelName,
          priority: 1
        });
        return role;
      }
    } catch (error) {
      logger.authFailure(`Error checking ${model.modelName} model`, {
        email,
        model: model.modelName,
        error: error.message
      });
    }
  }

  // Priority 2: Check existing user record in main User model
  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { auth0Id }]
    });
    if (existingUser && existingUser.role && existingUser.role !== 'tourist') {
      logger.roleAssignment('Role found in existing user record', {
        email,
        role: existingUser.role,
        userId: existingUser._id,
        priority: 2
      });
      return existingUser.role;
    }
  } catch (error) {
    logger.authFailure('Error checking existing user', {
      email,
      auth0Id,
      error: error.message
    });
  }

  // Priority 3: Check Auth0 profile metadata
  if (userInfo.app_metadata?.role) {
    const auth0Role = userInfo.app_metadata.role;
    // Validate that the role is in our enum
    const validRoles = ['admin', 'callOperator', 'EmergencyOfficer', 'safariDriver', 'tourGuide', 'tourist', 'vet', 'WildlifeOfficer'];
    if (validRoles.includes(auth0Role)) {
      logger.roleAssignment('Role found in Auth0 metadata', {
        email,
        role: auth0Role,
        priority: 3
      });
      return auth0Role;
    } else {
      logger.authFailure('Invalid role in Auth0 metadata', {
        email,
        invalidRole: auth0Role,
        validRoles
      });
    }
  }

  // Priority 4: Business logic based on email domain patterns
  const emailLower = email.toLowerCase();

  // Domain-based role assignment rules
  const domainRules = [
    { pattern: /@wildlanka\.admin/i, role: 'admin' },
    { pattern: /@wildlanka\.vet/i, role: 'vet' },
    { pattern: /@wildlanka\.guide/i, role: 'tourGuide' },
    { pattern: /@wildlanka\.driver/i, role: 'safariDriver' },
    { pattern: /@wildlanka\.wildlife/i, role: 'WildlifeOfficer' },
    { pattern: /@wildlanka\.emergency/i, role: 'EmergencyOfficer' },
    { pattern: /@wildlanka\.call/i, role: 'callOperator' },
    { pattern: /@wildlanka\.gov/i, role: 'admin' },
    { pattern: /@gov\.lk/i, role: 'WildlifeOfficer' }
  ];

  for (const { pattern, role } of domainRules) {
    if (pattern.test(emailLower)) {
      logger.roleAssignment('Role assigned by domain rule', {
        email,
        role,
        pattern: pattern.toString(),
        priority: 4
      });
      return role;
    }
  }

  // Priority 5: Additional business rules based on email patterns
  const patternRules = [
    { pattern: 'admin', role: 'admin' },
    { pattern: 'vet', role: 'vet' },
    { pattern: 'veterinar', role: 'vet' },
    { pattern: 'guide', role: 'tourGuide' },
    { pattern: 'driver', role: 'safariDriver' },
    { pattern: 'wildlife', role: 'WildlifeOfficer' },
    { pattern: 'officer', role: 'WildlifeOfficer' },
    { pattern: 'emergency', role: 'EmergencyOfficer' },
    { pattern: 'call', role: 'callOperator' },
    { pattern: 'operator', role: 'callOperator' }
  ];

  for (const { pattern, role } of patternRules) {
    if (emailLower.includes(pattern)) {
      logger.roleAssignment('Role assigned by email pattern rule', {
        email,
        role,
        pattern,
        priority: 5
      });
      return role;
    }
  }

  // Default: tourist (for public users)
  logger.roleAssignment('Role defaulted to tourist', {
    email,
    role: 'tourist',
    reason: 'No specific role rules matched',
    priority: 6
  });
  return 'tourist';
};

export const handleLogin = async (req, res) => {
  if (!req.auth?.payload) {
    logger.authFailure('Authentication required - no payload', {
      hasAuth: !!req.auth,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const userInfo = req.auth.payload;
  const {
    sub: auth0Id,
    email,
    name,
    picture,
    nickname,
    given_name,
    family_name,
    locale,
    email_verified
  } = userInfo;

  // Get client IP and User Agent for metadata
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  const userAgent = req.get('User-Agent') || 'Unknown';

  logger.authAttempt('Login attempt started', {
    email,
    auth0Id,
    clientIP,
    userAgent,
    emailVerified: email_verified
  });

  try {
    let user = await User.findOne({ auth0Id });

    if (!user) {
      // Use comprehensive role determination algorithm
      const userRole = await determineUserRole(userInfo, email, auth0Id);

      // Create new user with comprehensive data
      user = new User({
        // Basic Auth0 Information
        auth0Id,
        email,
        name,

        // Extended Auth0 Profile Data
        picture: picture || null,
        nickname: nickname || null,
        given_name: given_name || null,
        family_name: family_name || null,
        locale: locale || null,
        email_verified: email_verified || false,

        // System Role (determined above)
        role: userRole,

        // Authentication Metadata
        auth_metadata: {
          last_login: new Date(),
          login_count: 1,
          last_ip: clientIP,
          user_agent: userAgent,
          auth_provider: 'auth0',
        },

        // Account Status
        status: 'active',

        // Default Preferences
        preferences: {
          language: locale || 'en',
          timezone: null,
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      });

      await user.save();
      
      logger.authSuccess('New user created successfully', {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompletion: user.profileCompletionPercentage
      });
    } else {
      // Respect existing user roles - only update basic profile information
      // Role changes should be handled through admin interface, not automatic updates
      const updateData = {
        // Update basic info in case it changed in Auth0
        name,
        email,
        picture: picture || user.picture,
        nickname: nickname || user.nickname,
        given_name: given_name || user.given_name,
        family_name: family_name || user.family_name,
        locale: locale || user.locale,
        email_verified: email_verified !== undefined ? email_verified : user.email_verified,

        // Keep existing role - don't override with automatic determination
        // Role changes should be explicit admin actions, not automatic updates

        // Update authentication metadata
        'auth_metadata.last_login': new Date(),
        'auth_metadata.login_count': user.auth_metadata.login_count + 1,
        'auth_metadata.last_ip': clientIP,
        'auth_metadata.user_agent': userAgent,
      };

      logger.authSuccess('Updating existing user profile', {
        userId: user._id,
        email: user.email,
        existingRole: user.role,
        loginCount: user.auth_metadata.login_count + 1
      });

      user = await User.findOneAndUpdate(
        { auth0Id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      logger.authSuccess('Existing user updated successfully', {
        userId: user._id,
        email: user.email,
        role: user.role,
        loginCount: user.auth_metadata.login_count,
        profileCompletion: user.profileCompletionPercentage
      });
    }

    // Return user data with additional computed fields
    const responseData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
      isNewUser: user.auth_metadata.login_count === 1,
    };

    logger.authSuccess('Login completed successfully', {
      userId: responseData._id,
      email: responseData.email,
      role: responseData.role,
      isNewUser: responseData.isNewUser
    });

    res.json(responseData);
  } catch (error) {
    logger.authFailure('Login process failed', {
      email,
      auth0Id,
      error: error.message,
      stack: error.stack,
      clientIP,
      userAgent
    });

    // Don't create fallback users - respect authentication failures
    res.status(500).json({
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getUserProfile = async (req, res) => {
  if (!req.auth?.payload?.sub) {
    logger.authFailure('Profile fetch failed - no authentication', {
      hasAuth: !!req.auth,
      hasPayload: !!req.auth?.payload,
      ip: req.ip
    });
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const { sub: auth0Id } = req.auth.payload;

  logger.authAttempt('Profile fetch requested', {
    auth0Id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const user = await User.findOne({ auth0Id });

    if (!user) {
      logger.authFailure('Profile fetch failed - user not found', {
        auth0Id,
        ip: req.ip
      });
      return res.status(404).json({ message: 'User not found' });
    }

    // Return comprehensive user profile
    const profileData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
    };

    logger.authSuccess('Profile fetched successfully', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json(profileData);
  } catch (error) {
    logger.authFailure('Profile fetch failed with error', {
      auth0Id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// New endpoint to update user profile
export const updateUserProfile = async (req, res) => {
  if (!req.auth?.payload?.sub) {
    logger.authFailure('Profile update failed - no authentication', {
      hasAuth: !!req.auth,
      ip: req.ip
    });
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const { sub: auth0Id } = req.auth.payload;
  const updateData = req.body;

  logger.authAttempt('Profile update requested', {
    auth0Id,
    updateFields: Object.keys(updateData),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    // Remove fields that shouldn't be updated directly
    const restrictedFields = ['auth0Id', 'email', 'auth_metadata', 'createdAt', 'updatedAt'];
    const originalFieldCount = Object.keys(updateData).length;
    restrictedFields.forEach(field => delete updateData[field]);
    const filteredFieldCount = Object.keys(updateData).length;

    if (originalFieldCount !== filteredFieldCount) {
      logger.authAttempt('Restricted fields filtered from update', {
        auth0Id,
        originalFields: originalFieldCount,
        filteredFields: filteredFieldCount,
        restrictedFields
      });
    }

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.authFailure('Profile update failed - user not found', {
        auth0Id,
        ip: req.ip
      });
      return res.status(404).json({ message: 'User not found' });
    }

    logger.authSuccess('Profile updated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      updatedFields: Object.keys(updateData),
      profileCompletion: user.profileCompletionPercentage
    });

    const responseData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
    };

    res.json(responseData);
  } catch (error) {
    logger.authFailure('Profile update failed with error', {
      auth0Id,
      updateFields: Object.keys(updateData),
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
