import Event from '../../models/Activity Management/event.js';
import upload from '../../utils/multerConfig.js'

// 1. CREATE: Admin creates a new event (with image upload)
export const createEvent = async (req, res) => {
  const { name, description, date, location, duration, availableSlots, eventType } = req.body;

  try {
    // Create the event with image URL
    const newEvent = new Event({
      name,
      description,
      date,
      location,
      duration,
      availableSlots,
      eventType,
      image: req.file ? `/uploads/events/${req.file.filename}` : null,  // Save image path in the database
    });

    await newEvent.save();

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

// 2. UPDATE: Admin can update the event details (including image upload)
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, date, location, duration, availableSlots, eventType } = req.body;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update the event with new details, including image if provided
    event.name = name || event.name;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.duration = duration || event.duration;
    event.availableSlots = availableSlots || event.availableSlots;
    event.eventType = eventType || event.eventType;
    event.image = req.file ? `/uploads/events/${req.file.filename}` : event.image;  // Update image if new one is uploaded

    await event.save();

    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// 3. DELETE: Admin can delete an event
export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.remove();

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

// 4. GET: Admin can view all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// 5. Upload event image (for updating an existing event image)
export const uploadEventImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  // Find the event by ID
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Update the event with the new image
  event.image = `/uploads/events/${req.file.filename}`;
  await event.save();

  res.status(200).json({ message: 'Event image uploaded successfully', event });
};
