const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true, 
        trim: true,
        minlength: 3
    },

    email: {
        type: String,
        unique: true,
        sparse: true, 
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        minlength: 6
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },

    age: {
        type: Number, 
        min: 12,
        max: 110
    },

    otp: {
        type: String 
    },

    otpExpiry: {
        type: Date    
    },

    isPhoneVerified: { 
        type: Boolean, 
        default: false 
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);