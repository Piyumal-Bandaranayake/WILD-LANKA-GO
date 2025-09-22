import User from '../../models/User.js';
import Donation from '../../models/Donation.js'; // Use the main comprehensive Donation model

// 1. MAKE DONATION: User makes a general donation to support conservation
const makeDonation = async (req, res) => {
    const { userId, amount, message } = req.body;  // Collect donation details

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create the donation using the comprehensive schema
        const newDonation = new Donation({
            donor: {
                userId: userId,
                isAnonymous: false,
                isGuest: false,
            },
            amount: {
                value: amount,
                currency: 'LKR',
                amountInLKR: amount,
            },
            donationType: 'One-time',
            category: 'General Wildlife Conservation',
            purpose: {
                description: message || 'General donation for wildlife conservation',
            },
            payment: {
                method: 'Online',
                status: 'Completed',
                processedAt: new Date(),
            },
            receipt: {
                issueDate: new Date(),
                taxDeductible: true,
            },
            visibility: {
                showInPublicList: !req.body.isAnonymous,
                showAmount: !req.body.isAnonymous,
            }
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
        // Find all donations made by the user using the new schema structure
        const donations = await Donation.find({ 'donor.userId': userId }).populate('donor.userId');  // Populate user details
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donation history', error: error.message });
    }
};

// 3. GET ALL DONATIONS: Admin can view all donations made by all users
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('donor.userId');  // Populate user details with new schema
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

        // Ensure the user updating the message is the one who made the donation (using new schema)
        if (donation.donor.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this donation' });
        }

        // Update the purpose description instead of message field
        donation.purpose.description = message;
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
