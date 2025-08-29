import CallOperator from "../../models/User/callOperator.js";
import bcrypt from 'bcryptjs';

// Register Call Operator (admin assigns username and password)
const registerCallOperator = async (req, res) => {
    const { Operator_name, Email, Username, Password, Phone } = req.body;

    // Validate input
    if (!Operator_name || !Email || !Username || !Password || !Phone) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if the email or username is already taken
        const existingOperator = await CallOperator.findOne({ $or: [{ Email }, { Username }] });
        if (existingOperator) {
            return res.status(400).json({ message: 'Email or Username already exists' });
        }

        // Create a new Call Operator
        const newCallOperator = new CallOperator({
            Operator_name,
            Email,
            Username,
            Password,
            Phone
        });

        // Hash the password before saving
        newCallOperator.Password = await bcrypt.hash(Password, 10);

        // Save the Call Operator to the database
        await newCallOperator.save();

        res.status(201).json({ message: 'Call Operator registered successfully', callOperator: newCallOperator });

    } catch (error) {
        res.status(500).json({ message: 'Error registering Call Operator', error: error.message });
    }
};
export { registerCallOperator };
