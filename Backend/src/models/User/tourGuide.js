import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const tourGuideSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    Username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
    },
    Guide_Registration_No: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    Experience_Year: {
        type: Number,       
        required: true,
        min: 0
    },
    Status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',  // Default to Pending when the guide applies
    },

    // ✅ New availability column
    availability: {
        type: String,
        enum: ['Available', 'Busy', 'OnLeave', 'Inactive'],
        default: 'Inactive', // start as Inactive until approved
    },

    // ✅ New column to track the guide's current tour status
    currentTourStatus: {
        type: String,
        enum: ['Idle', 'Processing', 'Started', 'Ended'],
        default: 'Idle'
    }
})

// Hash the password before saving the user model
tourGuideSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10); // Hash the password before saving
    }
    next();
});

// Compare the entered password with the hashed password
tourGuideSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

const TourGuide = mongoose.model('TourGuide', tourGuideSchema);
export default TourGuide;
