import Activity from '../../models/Activity Management/Activity.js';
import upload from '../../utils/multerConfig.js';

// 1. CREATE: Admin creates a new activity (with image upload)
export const createActivity = async (req, res) => {
  const { name, description, location, availableSlots, duration, activityType, price } = req.body;

  try {
    // Create the activity with image URL
    const newActivity = new Activity({
      name,
      description,
      location,
      availableSlots,
      duration,
      activityType,
      price,
      image: req.file ? `/uploads/activities/${req.file.filename}` : null,  // Save image path in the database
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
  const { name, description, location, availableSlots, duration, activityType, price } = req.body;

  try {
    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Update the activity with new details, including image if provided
    activity.name = name || activity.name;
    activity.description = description || activity.description;
    activity.location = location || activity.location;
    activity.availableSlots = availableSlots || activity.availableSlots;
    activity.duration = duration || activity.duration;
    activity.activityType = activityType || activity.activityType;
    activity.price = price || activity.price;
    activity.image = req.file ? `/uploads/activities/${req.file.filename}` : activity.image;  // Update image if new one is uploaded

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
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    await activity.remove();

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

// 5. Upload activity image (for updating an existing activity image)
export const uploadActivityImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  // Find the activity by ID
  const { id } = req.params;
  const activity = await Activity.findById(id);
  if (!activity) {
    return res.status(404).json({ message: 'Activity not found' });
  }

  // Update the activity with the new image
  activity.image = `/uploads/activities/${req.file.filename}`;
  await activity.save();

  res.status(200).json({ message: 'Activity image uploaded successfully', activity });
};
