require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const RetailerProfile = require('./src/models/RetailerProfile');
const connectDB = require('./src/config/db');

const runTest = async () => {
    try {
        await connectDB();

        // 1. Get a Retailer with API Key
        const profile = await RetailerProfile.findOne({ apiKey: { $exists: true } });
        if (!profile) {
            console.error('No retailer with API Key found. Run generate-api-keys.js first.');
            process.exit(1);
        }
        console.log(`Testing with Retailer: ${profile.storeName} (Key: ${profile.apiKey})`);

        // 2. Simulate Agent Payload
        const payload = [
            { sku: 'AGENT-001', name: 'Agent Test Product', stock: 50, price: 99.99 },
            { sku: 'AGENT-002', name: 'Agent Test Product 2', stock: 10, price: 199.99 }
        ];

        // 3. Send to Webhook
        console.log('Sending payload to webhook...');
        const res = await axios.post('http://localhost:5002/api/smartsync/webhook', { payload }, {
            headers: { 'x-api-key': profile.apiKey }
        });

        console.log('Webhook Response:', res.data);

        if (res.data.stats.processed === 2) {
            console.log('SUCCESS: Webhook processed all items.');
        } else {
            console.log('FAILURE: Webhook did not process all items.');
        }

        process.exit();
    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

runTest();
