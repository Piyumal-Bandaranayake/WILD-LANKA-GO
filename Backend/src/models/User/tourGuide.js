const mongoose = require('mongoose');
const User = require('./user'); // Import the base User model

const tourGuideSchema = new mongoose.Schema({
    // Tours assigned to the guide
    tours_guide: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
    }],

    // Reviews given to the guide by tourists
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }],

    // Availability status
    isAvailable: {
        type: Boolean,
        default: true // By default, the tour guide is available
    },

    // TourGuide ID (although MongoDB provides an _id by default, you can include this explicitly if needed)
    tourGuideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TourGuide',
        required: true
    },

    // Reports related to the guide
    reports: [{
        reportTitle: {
            type: String,
            required: true
        },
        reportContent: {
            type: String,
            required: true
        },
        reportDate: {
            type: Date,
            default: Date.now
        }
    }]
});

// Inherit from User schema
tourGuideSchema.add(User.schema);

module.exports = mongoose.model('TourGuide', tourGuideSchema);
