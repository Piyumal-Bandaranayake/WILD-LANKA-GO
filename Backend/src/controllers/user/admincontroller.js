// src/controllers/user/adminController.js
import Admin from '../../models/User/admin.js';

const registerAdmin = async (req, res) => {
  const { Name, Username, Email, Password } = req.body;

  if (!Name || !Username || !Email || !Password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await Admin.findOne({ $or: [{ Username }, { Email }] });
    if (existing) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // No need to hash manually — virtual + pre('save') will handle it
    const newAdmin = new Admin({
      Name,
      Username,
      Email,
      password: Password  // 👈 This will use the virtual setter, triggering hashing
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
};

export { registerAdmin };
