require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const RetailerProfile = require('./src/models/RetailerProfile');
const connectDB = require('./src/config/db');

const generateKeys = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        const profiles = await RetailerProfile.find({ apiKey: { $exists: false } });
        console.log(`Found ${profiles.length} profiles without API Key`);

        for (const profile of profiles) {
            const apiKey = 'sk_live_' + crypto.randomBytes(24).toString('hex');
            profile.apiKey = apiKey;
            await profile.save();
            console.log(`Generated key for ${profile.storeName}: ${apiKey}`);
        }

        console.log('API Key generation complete');
        process.exit();
    } catch (error) {
        console.error('Error generating keys:', error);
        process.exit(1);
    }
};

generateKeys();
