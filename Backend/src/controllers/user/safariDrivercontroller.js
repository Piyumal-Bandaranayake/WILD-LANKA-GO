import SafariDriver from "../../models/User/safariDriver.js";

// Register Safari Driver
const registerSafariDriver = async (req, res) => {
    const { DriverName, Email, PhoneNumber, username, Password, LicenceNumber, vechicleType, vechicleNumber } = req.body;

    // Validate input
    if (!DriverName || !Email || !PhoneNumber || !username || !Password || !LicenceNumber || !vechicleType || !vechicleNumber) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if the email, username, licence number or vehicle number is already taken
        const existingDriver = await SafariDriver.findOne({ $or: [{ Email }, { username }, { LicenceNumber }, { vechicleNumber }] });
        if (existingDriver) {
            return res.status(400).json({ message: 'Email, Username, Licence Number or Vehicle Number already exists' });
        }

        // Create a new safari driver
        const newSafariDriver = new SafariDriver({
            DriverName,
            Email,
            PhoneNumber,
            username,
            Password,
            LicenceNumber,
            vechicleType,
            vechicleNumber
        });

        // Save the safari driver to the database
        await newSafariDriver.save();
        res.status(201).json({ message: 'Safari Driver registered successfully', safariDriver: newSafariDriver });
    } catch (error) {
        res.status(500).json({ message: 'Error registering safari driver', error: error.message });
    }
}
export { registerSafariDriver };