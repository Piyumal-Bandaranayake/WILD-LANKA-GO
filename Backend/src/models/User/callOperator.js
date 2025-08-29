import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for Call Operator
const callOperatorSchema = new mongoose.Schema({
    Operator_name: {
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
    Phone: {
        type: String,
        required: true,
    },
   
});

// Hash the password before saving
callOperatorSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10); // Hash the password before saving
    }
    next();
});

// Compare the entered password with the hashed password
callOperatorSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

const CallOperator = mongoose.model('CallOperator', callOperatorSchema);
export default CallOperator;
