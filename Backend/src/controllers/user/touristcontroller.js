import Tourist from '../../models/User/tourist.js';

// Register tourist
const registerTourist = async (req, res) => {
  const { FirstName, LastName, Email, PhoneNumber, username, Password } = req.body;

  if (!FirstName || !LastName || !Email || !PhoneNumber || !username || !Password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const existingUser = await Tourist.findOne({ $or: [{ Email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already exists' });
    }

    const newTourist = new Tourist({
      FirstName,
      LastName,
      Email,
      PhoneNumber,
      username,
      Password, // <-- raw password; model hook will hash
    });

    await newTourist.save();
    res.status(201).json({ message: 'Tourist registered successfully', tourist: newTourist });
  } catch (error) {
    res.status(500).json({ message: 'Error registering tourist', error: error.message });
  }
};

// Get all tourists
const getTourists = async (req, res) => {
  try {
    const tourists = await Tourist.find();
    res.status(200).json(tourists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tourists', error: error.message });
  }
};

// Get tourist by ID
const getTouristById = async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.params.id);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }
    res.status(200).json(tourist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tourist', error: error.message });
  }
};

// Update tourist profile
const updateTourist = async (req, res) => {
  try {
    const { id } = req.params;
    const { FirstName, LastName, Email, PhoneNumber, username } = req.body;
    
    // Check if the tourist exists
    const tourist = await Tourist.findById(id);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }
    
    // Check if email or username already exists (excluding current user)
    if (Email && Email !== tourist.Email) {
      const emailExists = await Tourist.findOne({ Email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    if (username && username !== tourist.username) {
      const usernameExists = await Tourist.findOne({ username, _id: { $ne: id } });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Update the tourist
    const updatedTourist = await Tourist.findByIdAndUpdate(
      id,
      { FirstName, LastName, Email, PhoneNumber, username },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ message: 'Tourist updated successfully', tourist: updatedTourist });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tourist', error: error.message });
  }
};

// Delete tourist profile
const deleteTourist = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tourist = await Tourist.findById(id);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }
    
    await Tourist.findByIdAndDelete(id);
    res.status(200).json({ message: 'Tourist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tourist', error: error.message });
  }
};

export { registerTourist, getTourists, getTouristById, updateTourist, deleteTourist };