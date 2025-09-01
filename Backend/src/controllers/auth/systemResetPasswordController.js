import bcrypt from 'bcryptjs';
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

export const systemResetPassword = async (req, res) => {
  const { username, role, currentPassword, newPassword } = req.body;

  if (!username || !role || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide username, role, current password, and new password' });
  }

  const Model = roleModels[role.toLowerCase()];
  if (!Model) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await Model.findOne({
      $or: [
        { username: username },
        { Username: username }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default systemResetPassword;
