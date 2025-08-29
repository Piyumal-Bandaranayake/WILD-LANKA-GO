import EmergencyOfficer from '../../models/User/EmergencyOfficer.js';  // Correct path to model
import bcrypt from 'bcryptjs';

// Register Emergency Officer (admin assigns username and password)
const registerEmergencyOfficer = async (req, res) => {
    const { Fullname, Email, Username, Password, PhoneNumber, EmergencyOfficerRegistartionNumber } = req.body;

    // Validate input
    if (!Fullname || !Email || !Username || !Password || !PhoneNumber || !EmergencyOfficerRegistartionNumber) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if the email, username, or EmergencyOfficerRegistartionNumber is already taken
        const existingOfficer = await EmergencyOfficer.findOne({ $or: [{ Email }, { Username }, { EmergencyOfficerRegistartionNumber }] });
        if (existingOfficer) {
            return res.status(400).json({ message: 'Email, Username, or Emergency Officer Registration Number already exists' });
        }

        // Create a new Emergency Officer
        const newEmergencyOfficer = new EmergencyOfficer({
            Fullname,
            Email,
            Username,
            Password,
            PhoneNumber,
            EmergencyOfficerRegistartionNumber
        });

        // Hash the password before saving
        newEmergencyOfficer.Password = await bcrypt.hash(Password, 10);

        // Save the Emergency Officer to the database
        await newEmergencyOfficer.save();

        res.status(201).json({ message: 'Emergency Officer registered successfully', emergencyOfficer: newEmergencyOfficer });

    } catch (error) {
        res.status(500).json({ message: 'Error registering Emergency Officer', error: error.message });
    }
};

export { registerEmergencyOfficer };
