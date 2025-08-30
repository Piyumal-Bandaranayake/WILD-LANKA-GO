import Event from '../../models/Activity Management/event.js';

// Create a new event
export const createEvent = async (req, res) => {
    const { name, description, date, location, duration, availableSlots, eventType } = req.body;
    try {
        const newEvent = new Event({
            name,
            description,
            date,
            location,
            duration,
            availableSlots,
            eventType,
        });
        await newEvent.save();
        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

// Get all events
export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();

        // Format the event data before sending it to the frontend
        const formattedEvents = events.map(event => ({
            name: event.name,
            description: event.description,
            date: event.date,
            location: event.location,
            duration: event.duration,
            availableSlots: event.availableSlots,
            eventType: event.eventType,
            formattedDate: event.date.toISOString().split('T')[0],  // Format date as 'YYYY-MM-DD'
            formattedTime: event.date.toLocaleTimeString(),  // Get the time part
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};
