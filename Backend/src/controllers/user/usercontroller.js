import User from '../../models/User.js';

// Register user
const registerUser = async (req, res) => {
    try {
        const { Email, username, Password, name, address, contact_no, NIC, gender, role } = req.body;

        const existingUser = await User.findOne({ $or: [{ Email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        const newUser = new User({
            Email, username, Password, name, address, contact_no, NIC, gender, role
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Update user profile
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { Email, username, name, address, contact_no, NIC, gender, role } = req.body;

    try {
        // Check if the user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for email and username conflicts
        if (Email && Email !== user.Email) {
            const emailExists = await User.findOne({ Email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }
        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username, _id: { $ne: id } });
            if (usernameExists) {
                return res.status(400).json({ message: 'Username already in use' });
            }
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { Email, username, name, address, contact_no, NIC, gender, role },
            { new: true }
        );

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Delete user profile
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

export { registerUser, getUsers, getUserById, updateUser, deleteUser };