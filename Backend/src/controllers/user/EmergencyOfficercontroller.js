import EmergencyOfficer from '../../models/User/EmergencyOfficer.js';

// ✅ Register Emergency Officer
const registerEmergencyOfficer = async (req, res) => {
  const {
    Fullname,
    Email,
    username,  // ✅ lowercase
    password,  // ✅ lowercase
    PhoneNumber,
    EmergencyOfficerRegistartionNumber
  } = req.body;

  // ✅ Validation
  if (!Fullname || !Email || !username || !password || !PhoneNumber || !EmergencyOfficerRegistartionNumber) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const existingOfficer = await EmergencyOfficer.findOne({
      $or: [{ Email }, { username }, { EmergencyOfficerRegistartionNumber }]
    });

    if (existingOfficer) {
      return res.status(400).json({ message: 'Email, Username, or Registration Number already exists' });
    }

    // ✅ Schema auto-hashes password
    const newOfficer = new EmergencyOfficer({
      Fullname,
      Email,
      username,
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
    res.status(500).json({ message: 'Error registering Emergency Officer', error: error.message });
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

export {
  registerEmergencyOfficer,
  getEmergencyOfficers,
  getEmergencyOfficerById
};
