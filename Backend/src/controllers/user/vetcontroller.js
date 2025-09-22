import Vet from "../../models/User/vet.js";

// Register Vet
const registerVet = async (req, res) => {
  const {
    Fullname,
    Email,
    username,
    password,
    PhoneNumber,
    VetRegistrationNumber,
    specification
  } = req.body;

  // Validate input
  if (!Fullname || !Email || !username || !password || !PhoneNumber || !VetRegistrationNumber || !specification) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check for existing vet with same email, username, or registration number
    const existingVet = await Vet.findOne({
      $or: [
        { Email: Email.toLowerCase() },
        { username: username.toLowerCase() },
        { VetRegistrationNumber: VetRegistrationNumber.toUpperCase().trim() }
      ]
    });

    if (existingVet) {
      if (existingVet.Email === Email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingVet.username === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      if (existingVet.VetRegistrationNumber === VetRegistrationNumber.toUpperCase().trim()) {
        return res.status(400).json({ message: 'Vet Registration Number already exists' });
      }
    }

    // Create new vet
    const newVet = new Vet({
      Fullname: Fullname.trim(),
      Email: Email.toLowerCase(),
      username: username.toLowerCase().trim(),
      password,
      PhoneNumber,
      VetRegistrationNumber: VetRegistrationNumber.toUpperCase().trim(),
      specification
    });

    await newVet.save();

    res.status(201).json({ 
      message: 'Vet registered successfully', 
      vet: newVet
    });

  } catch (error) {
    console.error("Registration error details:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    if (error.code === 11000) {
      // Handle all possible duplicate key scenarios
      const errorMessage = error.errmsg || error.message;
      
      if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      if (errorMessage.includes('Email') || errorMessage.includes('email')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (errorMessage.includes('VetRegistrationNumber')) {
        return res.status(400).json({ message: 'Vet Registration Number already exists' });
      }
      
      return res.status(400).json({ message: 'Duplicate field value entered' });
    }
    
    res.status(500).json({ message: 'Error registering vet', error: error.message });
  }
};

// Get all Vets
const getVets = async (req, res) => {
  try {
    const vets = await Vet.find({ isActive: true });
    res.status(200).json(vets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vets', error: error.message });
  }
};

// Get Vet by ID
const getVetById = async (req, res) => {
  try {
    const vet = await Vet.findOne({ _id: req.params.id, isActive: true });
    if (!vet) {
      return res.status(404).json({ message: 'Vet not found' });
    }
    res.status(200).json(vet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vet', error: error.message });
  }
};

// Update Vet Profile
const updateVet = async (req, res) => {
  try {
    const { id } = req.params;
    const { Fullname, Email, PhoneNumber, specification } = req.body;
    
    // Check if vet exists and is active
    const vet = await Vet.findOne({ _id: id, isActive: true });
    if (!vet) {
      return res.status(404).json({ message: 'Vet not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (Email && Email !== vet.Email) {
      const emailExists = await Vet.findOne({ 
        Email: Email.toLowerCase(), 
        _id: { $ne: id },
        isActive: true 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Update the vet
    const updatedVet = await Vet.findByIdAndUpdate(
      id,
      { 
        Fullname: Fullname ? Fullname.trim() : vet.Fullname,
        Email: Email ? Email.toLowerCase() : vet.Email,
        PhoneNumber: PhoneNumber || vet.PhoneNumber,
        specification: specification || vet.specification
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      message: 'Vet profile updated successfully', 
      vet: updatedVet 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error updating vet profile', error: error.message });
  }
};

// Delete Vet Profile (Soft Delete)
const deleteVet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vet = await Vet.findOne({ _id: id, isActive: true });
    if (!vet) {
      return res.status(404).json({ message: 'Vet not found' });
    }
    
    // Soft delete by setting isActive to false
    await Vet.findByIdAndUpdate(id, { isActive: false });
    
    res.status(200).json({ message: 'Vet profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vet profile', error: error.message });
  }
};

// Toggle Vet Availability
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vet = await Vet.findOne({ _id: id, isActive: true });
    if (!vet) {
      return res.status(404).json({ message: 'Vet not found' });
    }
    
    // Toggle availability
    const updatedVet = await Vet.findByIdAndUpdate(
      id,
      { isAvailable: !vet.isAvailable },
      { new: true }
    );
    
    res.status(200).json({ 
      message: `Vet is now ${updatedVet.isAvailable ? 'available' : 'unavailable'}`,
      vet: updatedVet 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
};

// Get Available Vets
const getAvailableVets = async (req, res) => {
  try {
    const availableVets = await Vet.find({ isAvailable: true, isActive: true });
    res.status(200).json(availableVets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available vets', error: error.message });
  }
};

export { 
  registerVet, 
  getVets, 
  getVetById, 
  updateVet, 
  deleteVet, 
  toggleAvailability,
  getAvailableVets 
};