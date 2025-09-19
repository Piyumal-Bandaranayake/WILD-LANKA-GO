import User from '../../models/User.js';
import Donation from '../../models/Activity Management/donation.js';

// 1. MAKE DONATION: User makes a general donation to support conservation
const makeDonation = async (req, res) => {
    const { userId, amount, message } = req.body;  // Collect donation details

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create the donation
        const newDonation = new Donation({
            userId,
            amount,
            message,
        });

        await newDonation.save();
        res.status(201).json({ message: 'Donation successful', donation: newDonation });
    } catch (error) {
        res.status(500).json({ message: 'Error making donation', error: error.message });
    }
};

// 2. GET DONATION HISTORY: User can see all their donations
const getDonationHistory = async (req, res) => {
    const { userId } = req.params;  // Extract userId from params

    try {
        // Find all donations made by the user
        const donations = await Donation.find({ userId }).populate('userId');  // Populate user details
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donation history', error: error.message });
    }
};

// 3. GET ALL DONATIONS: Admin can view all donations made by all users
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('userId');  // Populate user details
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all donations', error: error.message });
    }
};

// 4. UPDATE MESSAGE: User can update only the message of their donation
const updateDonationMessage = async (req, res) => {
    const { id } = req.params;
    const { message, userId } = req.body; // userId is needed for authorization

    try {
        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        // Ensure the user updating the message is the one who made the donation
        if (donation.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this donation' });
        }

        donation.message = message;
        await donation.save();

        res.status(200).json({ message: 'Donation message updated successfully', donation });
    } catch (error) {
        res.status(500).json({ message: 'Error updating donation message', error: error.message });
    }
};

export {
    makeDonation,
    getDonationHistory,
    getAllDonations,
    updateDonationMessage,
};
