import EmergencyForm from '../../models/emergency/emergencyForm.js';

// Submit emergency form
const submitEmergencyForm = async (req, res) => {
    try {
        const { name, email, phone, property_name, location, emergency_type, description, date, time } = req.body;

        // Validate the form data
        if (!name || !email || !phone || !property_name || !location || !emergency_type || !description || !date || !time) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Create and save the emergency form
        const newEmergencyForm = new EmergencyForm({
            name,
            email,
            phone,
            property_name,
            location,
            emergency_type,
            description,
            date,
            time,
        });

        await newEmergencyForm.save();
        res.status(201).json({ message: 'Emergency form submitted successfully', emergencyForm: newEmergencyForm });
    } catch (error) {
        console.error('Error submitting emergency form:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export { submitEmergencyForm };
