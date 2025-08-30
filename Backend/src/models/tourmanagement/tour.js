import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
    tourId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    touristNames: {
        type: [String], // multiple tourists
        required: true,
    },
    numberOfTourists: {
        type: Number,
        required: true,
    },
    tourDate: {
        type: Date,
        required: true,
    },
    tourLocation: {
        type: String,
        required: true,
    },
    assignedTourGuide: {
        type: String, // could be ID or username
        default: null,
    },
    assignedDriver: {
        type: String, // could be ID or username
        default: null,
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Started', 'Ended'],
        default: 'Pending',
    }
}, {
    timestamps: true
});

const Tour = mongoose.model('Tour', tourSchema);
export default Tour;
