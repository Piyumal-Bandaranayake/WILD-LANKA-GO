import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for Wildlife Officer
const wildlifeOfficerSchema = new mongoose.Schema({
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
    OfficerID: {
        type: String,
        required: true,
        unique: true,
    },
    ExperienceYear: {
        type: Number,
        required: true,
        min: 0,
    }
});

// Hash the password before saving
wildlifeOfficerSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10); // Hash the password before saving
    }
    next();
});

// Compare the entered password with the hashed password
wildlifeOfficerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

const WildlifeOfficer = mongoose.model('WildlifeOfficer', wildlifeOfficerSchema);
export default WildlifeOfficer;
