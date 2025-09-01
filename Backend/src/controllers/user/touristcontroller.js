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

const getTourists = async (req, res) => {
  try {
    const tourists = await Tourist.find();
    res.status(200).json(tourists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tourists', error: error.message });
  }
};

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

export { registerTourist, getTourists, getTouristById };
