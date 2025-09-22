import Event from '../../models/Event.js'; // Use the main comprehensive Event model

// 1. CREATE: Admin creates a new event (with image upload)
export const createEvent = async (req, res) => {
  const { name, description, date, location, duration, availableSlots, eventType } = req.body;

  try {
    // Collect image URLs for multiple images
    let imagesArray = [];
    if (req.files && req.files.length > 0) {
      imagesArray = req.files.map(file => `/uploads/events/${file.filename}`);
    }

    // Map the simple schema to the comprehensive Event model
    const newEvent = new Event({
      title: name, // Map name to title
      description,
      category: 'Educational Program', // Default category
      eventType: 'Public', // Default event type for main schema
      dateTime: {
        startDate: new Date(date),
        endDate: new Date(date), // Same day event
        startTime: '09:00', // Default times
        endTime: '17:00',
      },
      location: {
        venue: location,
        address: location,
      },
      capacity: {
        maxSlots: availableSlots,
        availableSlots: availableSlots,
      },
      pricing: {
        basePrice: 0, // Default free event
        currency: 'LKR',
      },
      media: {
        images: imagesArray,
      },
      status: 'Active',
      visibility: 'Public',
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

    // Update the event with new details using comprehensive schema mapping
    event.title = name || event.title;
    event.description = description || event.description;
    
    if (date) {
      event.dateTime.startDate = new Date(date);
      event.dateTime.endDate = new Date(date);
    }
    
    if (location) {
      event.location.venue = location;
      event.location.address = location;
    }
    
    if (availableSlots) {
      event.capacity.availableSlots = availableSlots;
      event.capacity.maxSlots = availableSlots;
    }

    // Handle images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/events/${file.filename}`);
      event.media.images = [...(event.media.images || []), ...newImages];  // Append new images
    }

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
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

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


// 6. GET: Admin can view a specific event by ID
export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};
