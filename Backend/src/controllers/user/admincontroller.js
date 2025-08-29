import Admin from '../../models/User/admin.js';  // Correct path to model
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';  // For generating JWT tokens for authentication

// Admin Login
const adminLogin = async (req, res) => {
    const { UserName, Password } = req.body;

    // Validate input
    if (!UserName || !Password) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ UserName });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(Password, admin.Password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token for authentication
        const token = jwt.sign({ id: admin._id, UserName: admin.UserName }, process.env.JWT_SECRET, {
            expiresIn: '1h',  // Token expires in 1 hour
        });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
};

export { adminLogin };
