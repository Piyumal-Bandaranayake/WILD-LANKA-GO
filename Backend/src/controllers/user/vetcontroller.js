import Vet from "../../models/User/vet.js";
import bcrypt from "bcryptjs";
// Register Vet
const registerVet = async (req, res) => {
    const { Fullname, Email, Username, Password, PhoneNumber, VetRegistrationNumber, speclication } = req.body;

    // Validate input
    if (!Fullname || !Email || !Username || !Password || !PhoneNumber || !VetRegistrationNumber || !speclication) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    try {
        // Check if the email or username or VetRegistrationNumber is already taken
        const existingVet = await Vet.findOne({ $or: [{ Email }, { Username }, { VetRegistrationNumber }] });
        if (existingVet) {
            return res.status(400).json({ message: 'Email, Username, or Vet Registration Number already exists' });
        }

        // Create a new Vet
        const newVet = new Vet({
            Fullname,
            Email,
            Username,
            Password,
            PhoneNumber,
            VetRegistrationNumber,
            speclication
        });

        // Hash the password before saving
        newVet.Password = await bcrypt.hash(Password, 10);

        // Save the vet to the database
        await newVet.save();

        res.status(201).json({ message: 'Vet registered successfully', vet: newVet });

    } catch (error) {
        res.status(500).json({ message: 'Error registering Vet', error: error.message });
    }
};
export { registerVet };