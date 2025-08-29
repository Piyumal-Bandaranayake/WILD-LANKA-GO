import TourGuide from "../../models/User/tourGuide.js";

const registerTourGuide = async (req, res) => {
    try {
        const { firstname, lastname, email, Username, password, phone, Guide_Registration_No, Experience_Year } = req.body;

        // Check if the email or username already exists
        const existingGuide = await TourGuide.findOne({ $or: [{ email }, { Username }, { Guide_Registration_No }] });
        if (existingGuide) {
            return res.status(400).json({ message: 'Email, Username, or Guide Registration Number already in use' });
        }

        // Create a new tour guide
        const newTourGuide = new TourGuide({
            firstname,
            lastname,
            email,
            Username,
            password,
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
}
export { registerTourGuide };