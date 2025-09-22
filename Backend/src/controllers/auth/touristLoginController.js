import Tourist from '../../models/User/tourist.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const touristLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        const tourist = await Tourist.findOne({ username }); // lowercase here

        console.log('Login attempt for:', username);
        console.log('Tourist found:', tourist);

        if (!tourist) {
            return res.status(400).json({ message: 'Invalid username' });
        }

        const isMatch = await bcrypt.compare(password, tourist.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: tourist._id, role: 'tourist' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: tourist._id,
                username: tourist.username,
                email: tourist.Email
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export { touristLogin };
