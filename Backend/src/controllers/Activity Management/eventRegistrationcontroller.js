import EventRegistration from '../../models/Activity Management/eventRegistration.js';

// 1. CREATE: User registers for an event (No payment)
const createEventRegistration = async (req, res) => {
    const { userId, eventId, numberOfParticipants } = req.body;  // Collect registration details

    try {
        // Optional: Check if user and event exist before creating the registration

        // Create the event registration (user registering)
        const newRegistration = new EventRegistration({
            userId,
            eventId,
            numberOfParticipants,
        });

        await newRegistration.save();
        res.status(201).json({ message: 'Event registration successful', registration: newRegistration });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event registration', error: error.message });
    }
};

// 2. MODIFY: User modifies their event registration (e.g., change number of participants)
const modifyEventRegistration = async (req, res) => {
    const { id } = req.params;
    const { numberOfParticipants } = req.body;

    try {
        const updatedRegistration = await EventRegistration.findByIdAndUpdate(
            id,
            { numberOfParticipants },
            { new: true } // Return the updated document
        );

        if (!updatedRegistration) {
            return res.status(404).json({ message: 'Event registration not found' });
        }

        res.status(200).json({ message: 'Event registration updated successfully', registration: updatedRegistration });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event registration', error: error.message });
    }
};

// 3. DELETE: User deletes their event registration (User removes their registration)
const deleteEventRegistration = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedRegistration = await EventRegistration.findByIdAndDelete(id);

        if (!deletedRegistration) {
            return res.status(404).json({ message: 'Event registration not found' });
        }

        res.status(200).json({ message: 'Event registration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event registration', error: error.message });
    }
};

// 4. GET ALL: Admin gets all event registrations
const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await EventRegistration.find().populate('userId eventId');  // Populate to get user and event details
        res.status(200).json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event registrations', error: error.message });
    }
};

// 5. GET ONE: Get a single event registration by ID
const getRegistrationById = async (req, res) => {
    const { id } = req.params;

    try {
        const registration = await EventRegistration.findById(id).populate('userId eventId');  // Populate to get user and event details
        if (!registration) {
            return res.status(404).json({ message: 'Event registration not found' });
        }
        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event registration', error: error.message });
    }
};

export {
    createEventRegistration,
    modifyEventRegistration,
    deleteEventRegistration,
    getAllRegistrations,
    getRegistrationById,
};
