import Vet from "../../models/User/vet.js";

// Register Vet
const registerVet = async (req, res) => {
  const {
    Fullname,
    Email,
    username,
    password,
    PhoneNumber,
    VetRegistrationNumber,
    specification
  } = req.body;

  // Validate input
  if (!Fullname || !Email || !username || !password || !PhoneNumber || !VetRegistrationNumber || !specification) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    // Check for existing vet
    const existingVet = await Vet.findOne({
      $or: [{ Email }, { username }, { VetRegistrationNumber }]
    });

    if (existingVet) {
      return res.status(400).json({ message: 'Email, Username, or Vet Registration Number already exists' });
    }

    // ✅ Create new vet with hashed password
    const newVet = new Vet({
      Fullname,
      Email,
      username,
      password, // schema will auto-hash
      PhoneNumber,
      VetRegistrationNumber,
      specification
    });

    await newVet.save();

    res.status(201).json({ message: 'Vet registered successfully', vet: newVet });

  } catch (error) {
    res.status(500).json({ message: 'Error registering Vet', error: error.message });
  }
};

// Get all Vets
const getVets = async (req, res) => {
  try {
    const vets = await Vet.find();
    res.status(200).json(vets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vets', error: error.message });
  }
};

// Get Vet by ID
const getVetById = async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id);
    if (!vet) {
      return res.status(404).json({ message: 'Vet not found' });
    }
    res.status(200).json(vet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vet', error: error.message });
  }
};

export { registerVet, getVets, getVetById };
