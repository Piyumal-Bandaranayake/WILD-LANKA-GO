import Tourist from '../../models/User/tourist.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const touristLogin = async (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Find the tourist by username
        const tourist = await Tourist.findOne({ username });
        if (!tourist) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, tourist.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: tourist._id, role: 'tourist' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Return token and basic user info
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: tourist._id,
                username: tourist.username,
                email: tourist.Email
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export { touristLogin };
