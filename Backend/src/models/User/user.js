// models/user/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema for common attributes
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    user_type: {
        type: String,
        enum: ['Admin', 'Tourist', 'WildparkOfficer', 'MedicalOfficer', 'Driver', 'TourGuide', 'GuestUser', 'Vet', 'CallOperator'],
        required: true
    },
    full_name: String,
    contact_number: String,
    address: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving user
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare passwords
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
