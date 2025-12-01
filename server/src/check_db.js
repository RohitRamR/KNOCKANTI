require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const RetailerProfile = require('./models/RetailerProfile');
const connectDB = require('./config/db');

const checkData = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        const retailer = await User.findOne({ email: 'retailer@knockanti.com' });
        console.log('Retailer:', retailer ? retailer._id : 'Not Found');

        if (retailer) {
            const profile = await RetailerProfile.findOne({ user: retailer._id });
            console.log('Retailer Profile:', profile ? profile._id : 'Not Found');

            if (profile) {
                const products = await Product.find({ retailer: profile._id });
                console.log('Products found for this retailer profile:', products.length);

                const allProducts = await Product.find({});
                console.log('Total products in DB:', allProducts.length);
                if (allProducts.length > 0) {
                    console.log('Sample product retailer:', allProducts[0].retailer);
                }
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
};

checkData();
