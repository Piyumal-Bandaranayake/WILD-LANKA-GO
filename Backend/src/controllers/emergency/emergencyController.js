import Emergency from '../../models/emergency/emergency.js';

// Report an emergency
const reportEmergency = async (req, res) => {
    try {
        const {type, description, location, date, time, status } = req.body;

        // Validate the type of emergency
        const validTypes = ['animal', 'physical', 'unethical', 'human'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Invalid emergency type' });
        }

        // Create a new emergency instance
        const newEmergency = new Emergency({
            
            type,
            description,
            location,
            date,
            time,
            status: status || 'pending', // Default to 'pending' if no status is provided
        });

        // Save the emergency case
        await newEmergency.save();
        res.status(201).json({ message: 'Emergency reported successfully', emergency: newEmergency });
    } catch (error) {
        console.error('Error reporting emergency:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update the status of an emergency
const updateEmergencyStatus = async (req, res) => {
    try {
        const { case_id, status } = req.body;

        // Ensure the status is valid
        const validStatuses = ['pending', 'in-progress', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the emergency by case_id and update the status
        const emergency = await Emergency.findOneAndUpdate(
            { case_id },
            { status },
            { new: true } // Return the updated document
        );

        if (!emergency) {
            return res.status(404).json({ message: 'Emergency not found' });
        }

        res.status(200).json({ message: 'Emergency status updated', emergency });
    } catch (error) {
        console.error('Error updating emergency status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



export { reportEmergency, updateEmergencyStatus };
