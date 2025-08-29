import WildlifeOfficer from '../../models/User/WildlifeOfficer.js';  // Correct path to model
import bcrypt from 'bcryptjs';
// Register Wildlife Officer
const registerWildlifeOfficer = async (req, res) => {
    const { Fullname, Email, Username, Password, PhoneNumber, OfficerID, ExperienceYear } = req.body;

    // Validate input
    if (!Fullname || !Email || !Username || !Password || !PhoneNumber || !OfficerID || !ExperienceYear) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if the email or username or OfficerID is already taken
        const existingOfficer = await WildlifeOfficer.findOne({ $or: [{ Email }, { Username }, { OfficerID }] });
        if (existingOfficer) {
            return res.status(400).json({ message: 'Email, Username, or Officer ID already exists' });
        }

        // Create a new Wildlife Officer
        const newOfficer = new WildlifeOfficer({
            Fullname,
            Email,
            Username,
            Password,
            PhoneNumber,
            OfficerID,
            ExperienceYear
        });

        // Hash the password before saving
        newOfficer.Password = await bcrypt.hash(Password, 10);

        // Save the officer to the database
        await newOfficer.save();

        res.status(201).json({ message: 'Wildlife Officer registered successfully', wildlifeOfficer: newOfficer });

    } catch (error) {
        res.status(500).json({ message: 'Error registering Wildlife Officer', error: error.message });
    }
};

export { registerWildlifeOfficer };
