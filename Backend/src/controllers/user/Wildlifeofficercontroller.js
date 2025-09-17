import WildlifeOfficer from '../../models/User/WildlifeOfficer.js';

// ✅ Register Wildlife Officer (Fixed duplicate checking)
const registerWildlifeOfficer = async (req, res) => {
  const {
    Fullname,
    Email,
    username,
    password,
    PhoneNumber,
    OfficerID,
    ExperienceYear
  } = req.body;

  if (!Fullname || !Email || !username || !password || !PhoneNumber || !OfficerID || !ExperienceYear) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    // Check for existing officer with case-insensitive matching
    const existingOfficer = await WildlifeOfficer.findOne({
      $or: [
        { Email: Email.toLowerCase() },
        { username: username.toLowerCase() },
        { OfficerID }
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
      if (existingOfficer.OfficerID === OfficerID) {
        return res.status(400).json({ message: 'Officer ID already exists' });
      }
    }

    // ✅ Schema handles hashing automatically
    const newOfficer = new WildlifeOfficer({
      Fullname,
      Email: Email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      PhoneNumber,
      OfficerID,
      ExperienceYear
    });

    await newOfficer.save();

    res.status(201).json({
      message: 'Wildlife Officer registered successfully',
      wildlifeOfficer: {
        id: newOfficer._id,
        Fullname: newOfficer.Fullname,
        Email: newOfficer.Email,
        username: newOfficer.username,
        OfficerID: newOfficer.OfficerID
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
    
    res.status(500).json({ message: 'Error registering Wildlife Officer', error: error.message });
  }
};

// ✅ Get all Wildlife Officers
const getWildlifeOfficers = async (req, res) => {
  try {
    const officers = await WildlifeOfficer.find();
    res.status(200).json(officers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Wildlife Officers', error: error.message });
  }
};

// ✅ Get Wildlife Officer by ID
const getWildlifeOfficerById = async (req, res) => {
  try {
    const officer = await WildlifeOfficer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ message: 'Wildlife Officer not found' });
    }
    res.status(200).json(officer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Wildlife Officer', error: error.message });
  }
};

// ✅ Update Wildlife Officer Profile
const updateWildlifeOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const { Fullname, Email, PhoneNumber, ExperienceYear } = req.body;

    // Check if officer exists
    const officer = await WildlifeOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Wildlife Officer not found' });
    }

    // Check if email is being changed and if it already exists
    if (Email && Email !== officer.Email) {
      const emailExists = await WildlifeOfficer.findOne({ 
        Email: Email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Update the officer
    const updatedOfficer = await WildlifeOfficer.findByIdAndUpdate(
      id,
      { 
        Fullname: Fullname || officer.Fullname,
        Email: Email ? Email.toLowerCase() : officer.Email,
        PhoneNumber: PhoneNumber || officer.PhoneNumber,
        ExperienceYear: ExperienceYear || officer.ExperienceYear
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: 'Wildlife Officer profile updated successfully', 
      wildlifeOfficer: updatedOfficer 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error updating wildlife officer profile', error: error.message });
  }
};

// ✅ Delete Wildlife Officer Profile
const deleteWildlifeOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const officer = await WildlifeOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Wildlife Officer not found' });
    }
    
    await WildlifeOfficer.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Wildlife Officer profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting wildlife officer profile', error: error.message });
  }
};

// ✅ Toggle Wildlife Officer Availability
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const officer = await WildlifeOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Wildlife Officer not found' });
    }
    
    // Toggle availability
    const updatedOfficer = await WildlifeOfficer.findByIdAndUpdate(
      id,
      { isAvailable: !officer.isAvailable },
      { new: true }
    );
    
    res.status(200).json({ 
      message: `Wildlife Officer is now ${updatedOfficer.isAvailable ? 'available' : 'unavailable'}`,
      wildlifeOfficer: updatedOfficer 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
};

// ✅ Update Officer Status (Approve/Reject)
const updateOfficerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!Status || !allowedStatuses.includes(Status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const officer = await WildlifeOfficer.findById(id);
    if (!officer) {
      return res.status(404).json({ message: 'Wildlife Officer not found' });
    }

    const updatedOfficer = await WildlifeOfficer.findByIdAndUpdate(
      id,
      { Status },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: `Officer status updated to ${Status}`, 
      wildlifeOfficer: updatedOfficer 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating officer status', error: error.message });
  }
};

// ✅ Get Available Wildlife Officers
const getAvailableOfficers = async (req, res) => {
  try {
    const availableOfficers = await WildlifeOfficer.find({ 
      isAvailable: true,
      Status: 'Approved' 
    });
    res.status(200).json(availableOfficers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available wildlife officers', error: error.message });
  }
};

export {
  registerWildlifeOfficer,
  getWildlifeOfficers,
  getWildlifeOfficerById,
  updateWildlifeOfficer,
  deleteWildlifeOfficer,
  toggleAvailability,
  updateOfficerStatus,
  getAvailableOfficers
};