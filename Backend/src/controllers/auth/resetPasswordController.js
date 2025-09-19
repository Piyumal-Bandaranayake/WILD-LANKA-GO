// Alternative controllers/user/resetPasswordController.js
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';

const resetPassword = async (req, res) => {
    const { username, newPassword } = req.body;

    try {
        if (!username || !newPassword) {
            return res.status(400).json({ message: 'Username and new password are required' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.Password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

export { resetPassword };