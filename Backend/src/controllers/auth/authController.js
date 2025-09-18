import User from '../../models/User.js';

export const handleLogin = async (req, res) => {
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

  try {
    // Get client IP and User Agent for metadata
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent') || 'Unknown';

    let user = await User.findOne({ auth0Id });

    if (!user) {
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
        
        // System Role
        role: 'tourist',
        
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
      console.log('✅ New user created with comprehensive data:', {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        profileCompletion: user.profileCompletionPercentage + '%'
      });
    } else {
      // Update existing user with latest Auth0 data
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
        
        // Update authentication metadata
        'auth_metadata.last_login': new Date(),
        'auth_metadata.login_count': user.auth_metadata.login_count + 1,
        'auth_metadata.last_ip': clientIP,
        'auth_metadata.user_agent': userAgent,
      };

      user = await User.findOneAndUpdate(
        { auth0Id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log('✅ Existing user updated:', {
        id: user._id,
        email: user.email,
        loginCount: user.auth_metadata.login_count,
        lastLogin: user.auth_metadata.last_login,
        profileCompletion: user.profileCompletionPercentage + '%'
      });
    }

    // Return user data with additional computed fields
    const responseData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
      isNewUser: user.auth_metadata.login_count === 1,
    };

    res.json(responseData);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

export const getUserProfile = async (req, res) => {
  const { sub: auth0Id } = req.auth.payload;

  try {
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return comprehensive user profile
    const profileData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
    };

    res.json(profileData);
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New endpoint to update user profile
export const updateUserProfile = async (req, res) => {
  const { sub: auth0Id } = req.auth.payload;
  const updateData = req.body;

  try {
    // Remove fields that shouldn't be updated directly
    const restrictedFields = ['auth0Id', 'email', 'auth_metadata', 'createdAt', 'updatedAt'];
    restrictedFields.forEach(field => delete updateData[field]);

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User profile updated:', {
      id: user._id,
      email: user.email,
      updatedFields: Object.keys(updateData),
      profileCompletion: user.profileCompletionPercentage + '%'
    });

    const responseData = {
      ...user.toObject(),
      fullName: user.fullName,
      profileCompletionPercentage: user.profileCompletionPercentage,
    };

    res.json(responseData);
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
};
