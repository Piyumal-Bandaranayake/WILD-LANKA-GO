// models/user/Admin.js

const mongoose = require('mongoose');
const User = require('./user'); // Import the base User model

// Admin-specific schema for permissions and management
const adminSchema = new mongoose.Schema({
    role_permissions: {
        type: [String],
        enum: [
            'Manage Users',               // Admin can manage users (create, edit, delete)
            'Create Events',              // Admin can create new events
            'Create Activities',          // Admin can create activities for events
            'Approve Donations',          // Admin can approve or reject donations
            'Generate Monthly Report'     // Admin can generate monthly reports
        ]
    },
    managed_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to users managed by admin
    }],
    managed_events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event' // Reference to events managed by admin
    }],
    managed_activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity' // Reference to activities managed by admin
    }],
    donations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation' // Reference to donations managed by admin
    }]
});

// Inherit from User schema
adminSchema.add(User.schema);

module.exports = mongoose.model('Admin', adminSchema);
