import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
