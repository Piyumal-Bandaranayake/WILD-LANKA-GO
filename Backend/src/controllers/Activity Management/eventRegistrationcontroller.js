import EventRegistration from '../../models/Activity Management/eventRegistration.js';
import Event from '../../models/Activity Management/event.js';  // Import Event model for registration

// 1. CREATE: Tourist registers for an event (No payment)
export const createEventRegistration = async (req, res) => {
  const { touristId, eventId, numberOfParticipants } = req.body;  // Collect registration details

  try {
    // Check if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if there are enough available slots for the registration
    if (event.availableSlots < numberOfParticipants) {
      return res.status(400).json({ message: 'Not enough available slots for this event' });
    }

    // Create the event registration (tourist registering)
    const newRegistration = new EventRegistration({
      touristId,
      eventId,
      numberOfParticipants,
    });

    // Save the event registration
    await newRegistration.save();

    // Update the available slots for the event
    event.availableSlots -= numberOfParticipants;
    await event.save();

    res.status(201).json({ message: 'Event registration created successfully', registration: newRegistration });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event registration', error: error.message });
  }
};

// 2. MODIFY: Tourist modifies their event registration (e.g., change number of participants)
export const modifyEventRegistration = async (req, res) => {
  const { id } = req.params;
  const { numberOfParticipants } = req.body;

  try {
    // Find the registration by ID
    const registration = await EventRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Event registration not found' });
    }

    // Find the associated event and check available slots
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ensure there are enough available slots for the modification
    if (event.availableSlots < numberOfParticipants - registration.numberOfParticipants) {
      return res.status(400).json({ message: 'Not enough available slots for this event' });
    }

    // Modify the registration details
    registration.numberOfParticipants = numberOfParticipants;
    await registration.save();

    // Update the available slots for the event
    event.availableSlots -= (numberOfParticipants - registration.numberOfParticipants);
    await event.save();

    res.status(200).json({ message: 'Event registration modified successfully', registration });
  } catch (error) {
    res.status(500).json({ message: 'Error modifying event registration', error: error.message });
  }
};

// 3. DELETE: Tourist deletes their event registration (Tourist removes their registration)
export const removeEventRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the registration by ID
    const registration = await EventRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Event registration not found' });
    }

    // Find the associated event and update available slots
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Restore available slots in the event
    event.availableSlots += registration.numberOfParticipants;
    await event.save();

    // Remove the registration
    await registration.remove();

    res.status(200).json({ message: 'Event registration removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing event registration', error: error.message });
  }
};
