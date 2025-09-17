import CallOperator from "../../models/User/callOperator.js";

// ✅ Register Call Operator
const registerCallOperator = async (req, res) => {
  try {
    const { operatorName, email, username, password, phone } = req.body;

    // ✅ Validate all required fields
    if (!operatorName || !email || !username || !password || !phone) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // ✅ Check for existing email or username
    const existingOperator = await CallOperator.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ],
      isActive: true
    });

    if (existingOperator) {
      if (existingOperator.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingOperator.username === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // ✅ Create new operator
    const newCallOperator = new CallOperator({
      operatorName: operatorName.trim(),
      email: email.toLowerCase(),
      username: username.toLowerCase().trim(),
      password,
      phone
    });

    await newCallOperator.save();

    res.status(201).json({
      message: 'Call Operator registered successfully',
      callOperator: newCallOperator
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    if (error.code === 11000) {
      const errorMessage = error.errmsg || error.message;
      
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      return res.status(400).json({ message: 'Duplicate field value entered' });
    }
    
    res.status(500).json({ message: 'Error registering call operator', error: error.message });
  }
};

// ✅ Get All Call Operators
const getCallOperators = async (req, res) => {
  try {
    const operators = await CallOperator.find({ isActive: true });
    res.status(200).json(operators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Call Operators', error: error.message });
  }
};

// ✅ Get Call Operator by ID
const getCallOperatorById = async (req, res) => {
  try {
    const operator = await CallOperator.findOne({ _id: req.params.id, isActive: true });
    if (!operator) {
      return res.status(404).json({ message: 'Call Operator not found' });
    }
    res.status(200).json(operator);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Call Operator', error: error.message });
  }
};

// ✅ Update Call Operator Profile
const updateCallOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const { operatorName, email, phone } = req.body;
    
    // Check if operator exists and is active
    const operator = await CallOperator.findOne({ _id: id, isActive: true });
    if (!operator) {
      return res.status(404).json({ message: 'Call Operator not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== operator.email) {
      const emailExists = await CallOperator.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id },
        isActive: true 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Update the operator
    const updatedOperator = await CallOperator.findByIdAndUpdate(
      id,
      { 
        operatorName: operatorName ? operatorName.trim() : operator.operatorName,
        email: email ? email.toLowerCase() : operator.email,
        phone: phone || operator.phone
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      message: 'Call Operator profile updated successfully', 
      callOperator: updatedOperator 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Error updating call operator profile', error: error.message });
  }
};

// ✅ Delete Call Operator Profile (Soft Delete)
const deleteCallOperator = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operator = await CallOperator.findOne({ _id: id, isActive: true });
    if (!operator) {
      return res.status(404).json({ message: 'Call Operator not found' });
    }
    
    // Soft delete by setting isActive to false
    await CallOperator.findByIdAndUpdate(id, { isActive: false });
    
    res.status(200).json({ message: 'Call Operator profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting call operator profile', error: error.message });
  }
};

// ✅ Toggle Call Operator Availability
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operator = await CallOperator.findOne({ _id: id, isActive: true });
    if (!operator) {
      return res.status(404).json({ message: 'Call Operator not found' });
    }
    
    // Toggle availability
    const updatedOperator = await CallOperator.findByIdAndUpdate(
      id,
      { isAvailable: !operator.isAvailable },
      { new: true }
    );
    
    res.status(200).json({ 
      message: `Call Operator is now ${updatedOperator.isAvailable ? 'available' : 'unavailable'}`,
      callOperator: updatedOperator 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error: error.message });
  }
};

// ✅ Get Available Call Operators
const getAvailableOperators = async (req, res) => {
  try {
    const availableOperators = await CallOperator.find({ isAvailable: true, isActive: true });
    res.status(200).json(availableOperators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available call operators', error: error.message });
  }
};

export { 
  registerCallOperator, 
  getCallOperators, 
  getCallOperatorById, 
  updateCallOperator,
  deleteCallOperator,
  toggleAvailability,
  getAvailableOperators
};