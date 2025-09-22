import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import all role models
import Driver from '../../models/User/safariDriver.js';
import TourGuide from '../../models/User/tourGuide.js';
import WildlifeOfficer from '../../models/User/WildlifeOfficer.js';
import Vet from '../../models/User/vet.js';
import EmergencyOfficer from '../../models/User/EmergencyOfficer.js';
import CallOperator from '../../models/User/callOperator.js';
import Admin from '../../models/User/admin.js';

const roleModels = {
  driver: Driver,
  tourGuide: TourGuide,
  wildlifeOfficer: WildlifeOfficer,
  vet: Vet,
  emergencyOfficer: EmergencyOfficer,
  callOperator: CallOperator,
  admin: Admin,
};

const systemLogin = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please provide username, password, and role' });
  }

  try {
    const Model = roleModels[role];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await Model.findOne({
      $or: [
        { username: username },
        { Username: username }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user name credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // ✅ FIXED here

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username || user.Username,
        role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { systemLogin };
