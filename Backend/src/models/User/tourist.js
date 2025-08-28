const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const touristSchema = new mongoose.Schema({
    FullName: {             
    type: String,
    
    },  
    Email:{
        type: String,
        required: true,
        unique: true,
    },
    PhoneNumber: {
        type: String,   
        required: true,
    },
    Password: {
        type: String,
        required: true,
    },
    ConfirmPassword: {
        type: String,
        required: true,
    },}
);
