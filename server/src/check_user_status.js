const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkUser = async () => {
    await connectDB();
    const user = await User.findOne({ email: 'retailer@knockanti.com' });
    console.log('User Status:', user.status);
    process.exit();
};

checkUser();
