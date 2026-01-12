const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

const User = require('./User');
const router = express.Router();

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ msg: 'Phone number required' });
        }

        const existingUser = await User.findOne({ phone });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); 

        await User.findOneAndUpdate(
            { phone },
            { 
                phone,
                otp,
                otpExpiry,
                isPhoneVerified: false
            },
            { upsert: true, new: true }
        );

        console.log(`[DEV] OTP for ${phone}: ${otp}`);

        // Sending an OTP to the user via Twilio
        await client.messages.create({
            body: `Your SmartWasteAI verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phone}` 
        });

        res.json({ msg: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ msg: 'Failed to send OTP' });
    }
});

// VERIFY OTP - Stage 2
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ msg: 'Phone and OTP required' });
        }

        const user = await User.findOne({ phone });
        
        if (!user || !user.otp) {
            return res.status(400).json({ msg: 'OTP not found. Request a new one.' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ msg: 'OTP expired' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Mark phone as verified but don't clear OTP yet
        user.isPhoneVerified = true;
        await user.save();
        
        res.json({ msg: 'OTP verified successfully' });
    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(500).json({ msg: 'Verification failed' });
    }
});

// REGISTER - Stage 3
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phone, age } = req.body;

        // Validate inputs
        if (!username || !email || !password || !phone || !age) {
            return res.status(400).json({ msg: "Fill all fields" });
        }

        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters" });
        }

        // Find the user with verified phone
        const user = await User.findOne({ phone, isPhoneVerified: true });
        
        if (!user) {
            return res.status(400).json({ msg: "Verify phone number first" });
        }

        // Check if username or email already exists
        const exists = await User.findOne({
            _id: { $ne: user._id }, 
            $or: [{ email }, { username }]
        });
        
        if (exists) {
            return res.status(400).json({ msg: "Username or email already exists" });
        }

        user.username = username;
        user.email = email;
        user.password = await bcrypt.hash(password, 10);
        user.age = parseInt(age);
        user.otp = undefined; 
        user.otpExpiry = undefined; 

        await user.save();

        res.status(201).json({ msg: "Registration successful" });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt with:', { email, hasPassword: !!password });

        if (!email || !password) {
            return res.status(400).json({ msg: "Please fill all fields" });
        }

     
        const user = await User.findOne({ email: email.toLowerCase() });

        console.log('User found:', user ? `Yes (${user.username})` : 'No');

        if (!user) {
            return res.status(400).json({ msg: "Enter in a valid email format (e.g., user@example.com)" });
        }

        
        if (!user.username || !user.email || !user.password) {
            return res.status(400).json({ msg: "Please complete your registration first" });
        }

        if (!user.isPhoneVerified) {
            return res.status(403).json({ msg: "Phone not verified" });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ msg: "Wrong password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log('Login successful for:', user.username);

        res.json({
            token,
            username: user.username,
            email: user.email,
            phone: user.phone
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});


module.exports = router;