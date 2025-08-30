import bcrypt from 'bcryptjs';
import CallOperator from "../../models/User/callOperator.js";

// Register Call Operator
const registerCallOperator = async (req, res) => {
    try {
        const { Operator_name, Email, Username, Password, Phone } = req.body;

        // Check if all required fields are provided
        if (!Operator_name || !Email || !Username || !Password || !Phone) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // Check if the email or username already exists
        const existingOperator = await CallOperator.findOne({ $or: [{ Email }, { Username }] });
        if (existingOperator) {
            return res.status(400).json({ message: 'Email or Username already in use' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Create a new Call Operator
        const newCallOperator = new CallOperator({
            Operator_name,
            Email,
            Username,
            Password: hashedPassword, // Save the hashed password
            Phone
        });

        await newCallOperator.save();

        res.status(201).json({ message: 'Call Operator registered successfully', callOperator: newCallOperator });

    } catch (error) {
        console.error('Error registering Call Operator:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all Call Operators
const getCallOperators = async (req, res) => {
    try {
        const operators = await CallOperator.find();
        res.status(200).json(operators);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Call Operators', error: error.message });
    }
};

// Get Call Operator by ID
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