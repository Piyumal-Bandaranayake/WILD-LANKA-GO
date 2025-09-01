import bcrypt from 'bcryptjs';
import CallOperator from "../../models/User/callOperator.js";

// ✅ Register Call Operator
const registerCallOperator = async (req, res) => {
  try {
    const { operatorName, email, username, password, phone } = req.body;

    // ✅ Validate all required fields
    if (!operatorName || !email || !username || !password || !phone) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // ✅ Check for existing email or username
    const existingOperator = await CallOperator.findOne({ $or: [{ email }, { username }] });
    if (existingOperator) {
      return res.status(400).json({ message: 'Email or Username already in use' });
    }

    // ✅ Schema will hash password automatically
    const newCallOperator = new CallOperator({
      operatorName,
      email,
      username,
      password,
      phone
    });

    await newCallOperator.save();

    res.status(201).json({
      message: 'Call Operator registered successfully',
      callOperator: {
        id: newCallOperator._id,
        username: newCallOperator.username,
        email: newCallOperator.email
      }
    });

  } catch (error) {
    console.error('Error registering Call Operator:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get All Call Operators
const getCallOperators = async (req, res) => {
  try {
    const operators = await CallOperator.find();
    res.status(200).json(operators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Call Operators', error: error.message });
  }
};

// ✅ Get Call Operator by ID
const getCallOperatorById = async (req, res) => {
  try {
    const operator = await CallOperator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Call Operator not found' });
    }
    res.status(200).json(operator);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Call Operator', error: error.message });
  }
};

export { registerCallOperator, getCallOperators, getCallOperatorById };
