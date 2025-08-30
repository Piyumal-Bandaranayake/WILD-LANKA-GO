import bcrypt from 'bcryptjs';
import TourGuide from "../../models/User/tourGuide.js";

const registerTourGuide = async (req, res) => {
    try {
        const { firstname, lastname, email, Username, password, phone, Guide_Registration_No, Experience_Year } = req.body;

        // Check if all required fields are provided
        if (!firstname || !lastname || !email || !Username || !password || !phone || !Guide_Registration_No || !Experience_Year) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // Check if the email or username already exists
        const existingGuide = await TourGuide.findOne({ $or: [{ email }, { Username }, { Guide_Registration_No }] });
        if (existingGuide) {
            return res.status(400).json({ message: 'Email, Username, or Guide Registration Number already in use' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new tour guide
        const newTourGuide = new TourGuide({
            firstname,
            lastname,
            email,
            Username,
            password: hashedPassword,  // Save the hashed password
            phone,
            Guide_Registration_No,
            Experience_Year,
            Status: 'Pending' // Set initial status to Pending
        });

        await newTourGuide.save();

        res.status(201).json({ message: 'Tour guide registered successfully and is pending approval' });
    } catch (error) {
        console.error('Error registering tour guide:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all Tour Guides
const getTourGuides = async (req, res) => {
    try {
        const guides = await TourGuide.find();
        res.status(200).json(guides);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour guides', error: error.message });
    }
};

// Get Tour Guide by ID
const getTourGuideById = async (req, res) => {
    try {
        const guide = await TourGuide.findById(req.params.id);
        if (!guide) {
            return res.status(404).json({ message: 'Tour Guide not found' });
        }
        res.status(200).json(guide);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour guide', error: error.message });
    }
};

export { registerTourGuide, getTourGuides, getTourGuideById };