import EmergencyOfficer from '../../models/User/EmergencyOfficer.js';

// ✅ Register Emergency Officer
const registerEmergencyOfficer = async (req, res) => {
  const {
    Fullname,
    Email,
    username,
    password,
    PhoneNumber,
    EmergencyOfficerRegistartionNumber
  } = req.body;

  // ✅ Validation
  if (!Fullname || !Email || !username || !password || !PhoneNumber || !EmergencyOfficerRegistartionNumber) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    // Check for existing officer with case-insensitive matching
    const existingOfficer = await EmergencyOfficer.findOne({
      $or: [
        { Email: Email.toLowerCase() },
        { username: username.toLowerCase() },
        { EmergencyOfficerRegistartionNumber }
      ]
    });

    if (existingOfficer) {
      // Provide specific error messages
      if (existingOfficer.Email.toLowerCase() === Email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (existingOfficer.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingOfficer.EmergencyOfficerRegistartionNumber === EmergencyOfficerRegistartionNumber) {
        return res.status(400).json({ message: 'Registration Number already exists' });
      }
    }

    // ✅ Schema auto-hashes password
    const newOfficer = new EmergencyOfficer({
      Fullname,
      Email: Email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      PhoneNumber,
      EmergencyOfficerRegistartionNumber
    });

    await newOfficer.save();

    res.status(201).json({
      message: 'Emergency Officer registered successfully',
      emergencyOfficer: {
        id: newOfficer._id,
        username: newOfficer.username,
        Email: newOfficer.Email,
        RegistrationNumber: newOfficer.EmergencyOfficerRegistartionNumber
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error registering Emergency Officer', 
      error: error.message 
    });
  }
};

// ✅ Get all Emergency Officers
const getEmergencyOfficers = async (req, res) => {
  try {
    const officers = await EmergencyOfficer.find();
    res.status(200).json(officers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Emergency Officers', error: error.message });
  }
};

// ✅ Get Emergency Officer by ID
const getEmergencyOfficerById = async (req, res) => {
  try {
    const officer = await EmergencyOfficer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ message: 'Emergency Officer not found' });
    }
    res.status(200).json(officer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Emergency Officer', error: error.message });
  }
};

// ✅ Update Emergency Officer Profile
const updateEmergencyOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const { Fullname, Email, PhoneNumber } = req.body;

    // Check if officer exists
    const officer = await EmergencyOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Emergency Officer not found' });
    }

    // Check if email is being changed and if it already exists
    if (Email && Email !== officer.Email) {
      const emailExists = await EmergencyOfficer.findOne({ 
        Email: Email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Update the officer
    const updatedOfficer = await EmergencyOfficer.findByIdAndUpdate(
      id,
      { 
        Fullname: Fullname || officer.Fullname,
        Email: Email ? Email.toLowerCase() : officer.Email,
        PhoneNumber: PhoneNumber || officer.PhoneNumber
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: 'Emergency Officer profile updated successfully', 
      emergencyOfficer: updatedOfficer 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error updating emergency officer profile', error: error.message });
  }
};

// ✅ Delete Emergency Officer Profile
const deleteEmergencyOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const officer = await EmergencyOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Emergency Officer not found' });
    }
    
    await EmergencyOfficer.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Emergency Officer profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting emergency officer profile', error: error.message });
  }
};

// ✅ Toggle Emergency Officer Availability
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const officer = await EmergencyOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Emergency Officer not found' });
    }
    
    // Toggle availability
    const updatedOfficer = await EmergencyOfficer.findByIdAndUpdate(
      id,
      { isAvailable: !officer.isAvailable },
      { new: true }
    );
    
    res.status(200).json({ 
      message: `Emergency Officer is now ${updatedOfficer.isAvailable ? 'available' : 'unavailable'}`,
      emergencyOfficer: updatedOfficer 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
};

// ✅ Get Available Emergency Officers
const getAvailableOfficers = async (req, res) => {
  try {
    const availableOfficers = await EmergencyOfficer.find({ isAvailable: true });
    res.status(200).json(availableOfficers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available emergency officers', error: error.message });
  }
};

export {
  registerEmergencyOfficer,
  getEmergencyOfficers,
  getEmergencyOfficerById,
  updateEmergencyOfficer,
  deleteEmergencyOfficer,
  toggleAvailability,
  getAvailableOfficers
};