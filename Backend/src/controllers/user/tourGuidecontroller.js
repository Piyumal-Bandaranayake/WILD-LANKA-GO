import TourGuide from "../../models/User/tourGuide.js";

// ✅ Register a new Tour Guide
const registerTourGuide = async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            email,
            Username,
            password,
            phone,
            Guide_Registration_No,
            Experience_Year
        } = req.body;

        // ✅ Validate required fields
        if (
            !firstname || !lastname || !email || !Username || !password ||
            !phone || !Guide_Registration_No || !Experience_Year
        ) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // ✅ Check for duplicates
        const existingGuide = await TourGuide.findOne({
            $or: [
                { email },
                { Username },
                { Guide_Registration_No }
            ]
        });

        if (existingGuide) {
            return res.status(400).json({
                message: 'Email, Username, or Guide Registration Number already in use'
            });
        }

        // ✅ No manual hashing – handled in schema
        const newGuide = new TourGuide({
            firstname,
            lastname,
            email,
            Username,
            password, // will be hashed by schema
            phone,
            Guide_Registration_No,
            Experience_Year,
            Status: 'Pending'
        });

        await newGuide.save();

        res.status(201).json({
            message: 'Tour guide registered successfully and is pending approval',
            guideId: newGuide._id
        });

    } catch (error) {
        console.error('❌ Error registering tour guide:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get all Tour Guides
const getTourGuides = async (req, res) => {
    try {
        const guides = await TourGuide.find();
        res.status(200).json(guides);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour guides', error: error.message });
    }
};

// ✅ Get Tour Guide by ID
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
