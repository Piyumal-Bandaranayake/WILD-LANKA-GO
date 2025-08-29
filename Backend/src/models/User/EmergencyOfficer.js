import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for Emergency Officer
const emergencyOfficerSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,  // Ensure email is unique
    },
    Username: {
        type: String,
        required: true,
        unique: true,  // Ensure username is unique
    },
    Password: {
        type: String,
        required: true,
        minlength: 6,  // Ensure password has a minimum length
    },
    PhoneNumber: {
        type: String,
        required: true,
    },
    EmergencyOfficerRegistartionNumber: {
        type: String,
        required: true,
        unique: true,  // Unique ID for the emergency officer
    },
   
});

// Hash the password before saving
emergencyOfficerSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10); // Hash the password before saving
    }
    next();
});

// Compare the entered password with the hashed password
emergencyOfficerSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

const EmergencyOfficer = mongoose.model('EmergencyOfficer', emergencyOfficerSchema);
export default EmergencyOfficer;
