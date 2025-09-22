import Activity from '../../models/Activity Management/Activity.js';

// 1. CREATE: Admin creates a new activity (with image upload)
export const createActivity = async (req, res) => {
  const { name, description, location, availableSlots, duration, activityType, price, availableSlotsByDate } = req.body;

 try {
    // Convert availableSlotsByDate to Map if it's a string
    let parsedAvailableSlotsByDate = new Map();
    if (typeof availableSlotsByDate === 'string') {
      parsedAvailableSlotsByDate = new Map(Object.entries(JSON.parse(availableSlotsByDate)));
    } else {
      parsedAvailableSlotsByDate = new Map(Object.entries(availableSlotsByDate));
    }

    // Collect image URLs for multiple images
    let imagesArray = [];
    if (req.files && req.files.length > 0) {
      imagesArray = req.files.map(file => `/uploads/activities/${file.filename}`);
    }

    // Create the activity with images and available slots by date
    const newActivity = new Activity({
      name,
      description,
      location,
      duration,
      activityType,
      price,
      images: imagesArray,  // Store the images array
      availableSlotsByDate: parsedAvailableSlotsByDate,  // Add available slots by date
    });

    await newActivity.save();

    res.status(201).json({ message: 'Activity created successfully', activity: newActivity });
  } catch (error) {
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

// 2. UPDATE: Admin can update the activity details (including image upload)
export const updateActivity = async (req, res) => {
  const { id } = req.params;
  const { name, description, location, duration, activityType, price, availableSlotsByDate } = req.body;

  try {
    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Update the activity with new details, including image if provided
    activity.name = name || activity.name;
    activity.description = description || activity.description;
    activity.location = location || activity.location;
    activity.duration = duration || activity.duration;
    activity.activityType = activityType || activity.activityType;
    activity.price = price || activity.price;
    activity.availableSlotsByDate = availableSlotsByDate || activity.availableSlotsByDate;

       // Convert availableSlotsByDate to Map if it's a string
    let parsedAvailableSlotsByDate = new Map();
    if (typeof availableSlotsByDate === 'string') {
      parsedAvailableSlotsByDate = new Map(Object.entries(JSON.parse(availableSlotsByDate)));
    } else {
      parsedAvailableSlotsByDate = new Map(Object.entries(availableSlotsByDate));
    }

    activity.availableSlotsByDate = parsedAvailableSlotsByDate;

    // Handle images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/activities/${file.filename}`);
      activity.images = [...activity.images, ...newImages];  // Append new images
    }

    await activity.save();

    res.status(200).json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
};

// 3. DELETE: Admin can delete an activity
export const deleteActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const activity = await Activity.findByIdAndDelete(id);  // Updated to use findByIdAndDelete instead of remove()

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

// 4. GET: Admin can view all activities
export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find();

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};


