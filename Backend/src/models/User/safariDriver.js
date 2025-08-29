import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const safariDriverSchema = new mongoose.Schema({
    DriverName:{
        type : String,
        required : true,

    },
    Email:{
        type : String,
        required : true,
        unique : true,
    },
    PhoneNumber:{
        type : String,
        required : true,
    },  
    username:{
        type : String,
        required : true,
        unique : true,
    },
    Password:{
        type : String,
        required : true,
    },
    LicenceNumber:{
        type : String,      
        required : true,
        unique : true,      
    },
    vechicleType:{
        type : String,  
        required : true,
    },
    vechicleNumber:{
        type : String,      
        required : true,
        unique : true,
    },
    status:{
        type : String,  
        enum : ['pending', 'approved', 'rejected'],
        default : 'pending',
        
    }
});

// Hash the password before saving  
safariDriverSchema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcrypt.hash(this.Password, 10);
    }
    next();
});    

// Compare the entered password with the hashed password
safariDriverSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
}   

const SafariDriver = mongoose.model('SafariDriver', safariDriverSchema);
export default SafariDriver;