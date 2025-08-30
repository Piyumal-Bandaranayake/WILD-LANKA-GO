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

// Get all Wildlife Officers
const getWildlifeOfficers = async (req, res) => {
    try {
        const officers = await WildlifeOfficer.find();
        res.status(200).json(officers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Wildlife Officers', error: error.message });
    }
};

// Get Wildlife Officer by ID
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

export { registerWildlifeOfficer, getWildlifeOfficers, getWildlifeOfficerById };