import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for Tourist
const touristSchema = new mongoose.Schema({
    FirstName: {             
        type: String,
        required: true,
    },  
    LastName: {             
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,  // Ensures email is unique
    },
    PhoneNumber: {
        type: String,   
        required: true,
    },
    username: {
        type: String,   
        required: true,
        unique: true,    // Ensures username is unique
    },
    Password: {
        type: String,
        required: true,
    },
}, { timestamps: true }); // Add timestamps for created/updated dates

// Hash the password before saving
touristSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10);
    }
    next();
});

// Compare the entered password with the hashed password
touristSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

// Create and export the model using default export
const Tourist = mongoose.model('Tourist', touristSchema);
export default Tourist;