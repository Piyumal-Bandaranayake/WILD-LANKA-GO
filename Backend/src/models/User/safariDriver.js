const mongoose = require('mongoose');
const User = require('./user'); // Import the base User model

const driverSchema = new mongoose.Schema({
    vehicle_assigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    }],
    assigned_tours: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
    }],
    // Vehicle meter before and after the tour
    vehicle_meter_before_tour: {
        type: Number,
        default: 0, // Default to 0 if not provided
    },
    vehicle_meter_after_tour: {
        type: Number,
        default: 0, // Default to 0 if not provided
    },
    // Availability status
    isAvailable: {
        type: Boolean,
        default: true, // A driver is available by default
    },
    // Reports for the driver
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
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Driver',
            required: true
        }
    }]
});

// Inherit from User schema
driverSchema.add(User.schema);

module.exports = mongoose.model('Driver', driverSchema);
