import Donation from '../../models/Activity Management/donation.js';
import User from '../../models/User/tourist.js';  // Assuming you have a User model

// 1. MAKE DONATION: Tourist makes a general donation to support conservation
export const makeDonation = async (req, res) => {
  const { touristId, amount, message } = req.body;  // Collect donation details

  try {
    // Check if the tourist exists
    const tourist = await User.findById(touristId);
    if (!tourist) {
      return res.status(404).json({ message: 'Tourist not found' });
    }

    // Create the donation record
    const newDonation = new Donation({
      touristId,
      amount,
      message,
    });

    // Save the donation
    await newDonation.save();

    res.status(201).json({ message: 'Donation successful', donation: newDonation });
  } catch (error) {
    res.status(500).json({ message: 'Error making donation', error: error.message });
  }
};

// 2. GET DONATION HISTORY: Tourist can see all their donations
export const getDonationHistory = async (req, res) => {
  const { touristId } = req.params;  // Extract touristId from params

  try {
    // Find all donations made by the tourist
    const donations = await Donation.find({ touristId }).populate('touristId');  // Populate tourist details

    if (!donations || donations.length === 0) {
      return res.status(404).json({ message: 'No donations found' });
    }

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation history', error: error.message });
  }
};

// 3. GET ALL DONATIONS: Admin can view all donations made by all tourists
export const getAllDonations = async (req, res) => {
  try {
    // Fetch all donations from the database
    const donations = await Donation.find().populate('touristId');  // Populate tourist details

    if (!donations || donations.length === 0) {
      return res.status(404).json({ message: 'No donations found' });
    }

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all donations', error: error.message });
  }
};
// 3. UPDATE MESSAGE: Tourist can update only the message of their donation
export const updateDonationMessage = async (req, res) => {
  const { id } = req.params;  // Donation ID to be updated
  const { message } = req.body;  // New message

  try {
    // Find the donation by ID
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Ensure the tourist updating the message is the one who made the donation
    if (donation.touristId.toString() !== req.body.touristId) {
      return res.status(403).json({ message: 'You can only update your own donation message' });
    }

    // Update the message
    donation.message = message || donation.message;

    await donation.save();

    res.status(200).json({ message: 'Donation message updated successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donation message', error: error.message });
  }
};
