import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for Admin
const adminSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,  // Admin name is required
    },
    UserName: {
        type: String,
        required: true,
        unique: true,  
    },
    Email: {
        type: String,
        required: true,
        unique: true,  // Ensure email is unique
    },
    Password: {
        type: String,
        required: true,
        minlength: 6,  // Ensure password has a minimum length
    },
});

// Hash the password before saving the admin model
adminSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10); // Hash the password before saving
    }
    next();
});

// Compare the entered password with the hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
