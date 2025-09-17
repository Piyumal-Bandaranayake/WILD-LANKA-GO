import SafariDriver from "../../models/User/safariDriver.js";

// ✅ Register Safari Driver (Fixed like Vet model)
const registerSafariDriver = async (req, res) => {
  const { 
    DriverName, 
    Email, 
    PhoneNumber, 
    username, 
    password, 
    LicenceNumber, 
    vehicleType, 
    vehicleNumber, 
    isAvailable 
  } = req.body;

  // ✅ Input validation
  if (!DriverName || !Email || !PhoneNumber || !username || !password || !LicenceNumber || !vehicleType || !vehicleNumber) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // ✅ Check for existing driver with same email, username, licence number, or vehicle number
    const existingDriver = await SafariDriver.findOne({
      $or: [
        { Email: Email.toLowerCase() },
        { username: username.toLowerCase() },
        { LicenceNumber: LicenceNumber.toUpperCase().trim() },
        { vehicleNumber: vehicleNumber.toUpperCase().trim() }
      ],
      isActive: true
    });

    if (existingDriver) {
      if (existingDriver.Email === Email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingDriver.username === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      if (existingDriver.LicenceNumber === LicenceNumber.toUpperCase().trim()) {
        return res.status(400).json({ message: 'Licence Number already exists' });
      }
      if (existingDriver.vehicleNumber === vehicleNumber.toUpperCase().trim()) {
        return res.status(400).json({ message: 'Vehicle Number already exists' });
      }
    }

    // ✅ Create new driver
    const newSafariDriver = new SafariDriver({
      DriverName: DriverName.trim(),
      Email: Email.toLowerCase(),
      PhoneNumber,
      username: username.toLowerCase().trim(),
      password,
      LicenceNumber: LicenceNumber.toUpperCase().trim(),
      vehicleType: vehicleType.trim(),
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      ...(isAvailable !== undefined && { isAvailable })
    });

    await newSafariDriver.save();

    res.status(201).json({
      message: 'Safari Driver registered successfully',
      safariDriver: newSafariDriver
    });

  } catch (error) {
    console.error("Registration error:", error);
    
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
      if (errorMessage.includes('LicenceNumber')) {
        return res.status(400).json({ message: 'Licence Number already exists' });
      }
      if (errorMessage.includes('vehicleNumber')) {
        return res.status(400).json({ message: 'Vehicle Number already exists' });
      }
      
      return res.status(400).json({ message: 'Duplicate field value entered' });
    }
    
    res.status(500).json({ message: 'Error registering safari driver', error: error.message });
  }
};

// ✅ Get all Safari Drivers
const getSafariDrivers = async (req, res) => {
  try {
    const drivers = await SafariDriver.find({ isActive: true });
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching safari drivers', error: error.message });
  }
};

// ✅ Get Safari Driver by ID
const getSafariDriverById = async (req, res) => {
  try {
    const driver = await SafariDriver.findOne({ _id: req.params.id, isActive: true });
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Safari Driver', error: error.message });
  }
};

// ✅ Update Safari Driver Profile
const updateSafariDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { DriverName, Email, PhoneNumber, vehicleType } = req.body;
    
    // Check if driver exists and is active
    const driver = await SafariDriver.findOne({ _id: id, isActive: true });
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (Email && Email !== driver.Email) {
      const emailExists = await SafariDriver.findOne({ 
        Email: Email.toLowerCase(), 
        _id: { $ne: id },
        isActive: true 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Update the driver
    const updatedDriver = await SafariDriver.findByIdAndUpdate(
      id,
      { 
        DriverName: DriverName ? DriverName.trim() : driver.DriverName,
        Email: Email ? Email.toLowerCase() : driver.Email,
        PhoneNumber: PhoneNumber || driver.PhoneNumber,
        vehicleType: vehicleType ? vehicleType.trim() : driver.vehicleType
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      message: 'Safari Driver profile updated successfully', 
      safariDriver: updatedDriver 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error updating safari driver profile', error: error.message });
  }
};

// ✅ Toggle Driver Availability (like Vet model)
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await SafariDriver.findOne({ _id: id, isActive: true });
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }
    
    // Toggle availability
    const updatedDriver = await SafariDriver.findByIdAndUpdate(
      id,
      { isAvailable: !driver.isAvailable },
      { new: true }
    );
    
    res.status(200).json({ 
      message: `Safari Driver is now ${updatedDriver.isAvailable ? 'available' : 'unavailable'}`,
      safariDriver: updatedDriver 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
};

// ✅ Update Driver Status (approve/reject)
const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const driver = await SafariDriver.findOne({ _id: id, isActive: true });
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }

    const updatedDriver = await SafariDriver.findByIdAndUpdate(
      id,
      { 
        status,
        // If approved, set availability to true by default
        ...(status === 'approved' && { isAvailable: true })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: `Driver status updated to ${status}`, 
      safariDriver: updatedDriver 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating driver status', error: error.message });
  }
};

// ✅ Delete Safari Driver Profile (Soft Delete)
const deleteSafariDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await SafariDriver.findOne({ _id: id, isActive: true });
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }
    
    // Soft delete by setting isActive to false
    await SafariDriver.findByIdAndUpdate(id, { isActive: false });
    
    res.status(200).json({ message: 'Safari Driver profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting safari driver profile', error: error.message });
  }
};

// ✅ Get Available Safari Drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const availableDrivers = await SafariDriver.find({ 
      isAvailable: true, 
      status: 'approved',
      isActive: true 
    });
    res.status(200).json(availableDrivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available safari drivers', error: error.message });
  }
};

// ✅ Get Approved Safari Drivers
const getApprovedDrivers = async (req, res) => {
  try {
    const approvedDrivers = await SafariDriver.find({ 
      status: 'approved',
      isActive: true 
    });
    res.status(200).json(approvedDrivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved safari drivers', error: error.message });
  }
};

// ✅ Make All Approved Drivers Available (Bulk Update)
const makeAllApprovedDriversAvailable = async (req, res) => {
  try {
    const result = await SafariDriver.updateMany(
      { status: 'approved', isActive: true },
      { isAvailable: true }
    );
    
    res.status(200).json({
      message: `Made ${result.modifiedCount} approved drivers available`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating drivers availability', error: error.message });
  }
};

export { 
  registerSafariDriver, 
  getSafariDrivers, 
  getSafariDriverById,
  updateSafariDriver,
  toggleAvailability,
  updateDriverStatus,
  deleteSafariDriver,
  getAvailableDrivers,
  getApprovedDrivers,
  makeAllApprovedDriversAvailable
};