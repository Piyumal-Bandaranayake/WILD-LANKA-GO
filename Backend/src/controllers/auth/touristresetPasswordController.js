// Alternative controllers/user/resetPasswordController.js
import Tourist from '../../models/User/tourist.js';
import bcrypt from 'bcryptjs';

const resetTouristPassword = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    try {
        const user = await Tourist.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        user.Password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
};

export { resetTouristPassword };