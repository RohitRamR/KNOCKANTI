require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const RetailerProfile = require('./models/RetailerProfile');
const connectDB = require('./config/db');

const checkUser = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: 'retailer@knockanti.com' });
        if (!user) {
            console.log('User not found');
        } else {
            console.log('User found:', {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status
            });

            const profile = await RetailerProfile.findOne({ user: user._id });
            if (profile) {
                console.log('API Key:', profile.apiKey);
            } else {
                console.log('Profile not found');
            }
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
