const axios = require('axios');
const mongoose = require('mongoose');
const SmartSyncAgent = require('./models/SmartSyncAgent');
const Product = require('./models/Product');
const User = require('./models/User');
const RetailerProfile = require('./models/RetailerProfile');

// Configuration
const API_URL = 'http://localhost:5002/api/smartsync';
let retailerToken = '';
let agentKey = '';
let agentId = '';

const runTests = async () => {
    try {
        console.log('--- Starting SmartSync API Tests ---');

        // 1. Login as Retailer to get Token
        console.log('\n1. Logging in as Retailer...');
        // Assuming we have a seed user or can create one. 
        // For this test, let's try to login with a known user or just use a hardcoded token if we had one.
        // Better: Use the login endpoint.
        try {
            const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
                email: 'retailer@knockanti.com', // Correct email from seed.js
                password: 'password123'
            });
            retailerToken = loginRes.data.accessToken;
            console.log('Login successful. Token obtained.');
        } catch (e) {
            console.log('Login failed:', e.stack);
            console.error('Cannot proceed without retailer token.');
            return;
        }

        // 2. Register Agent
        console.log('\n2. Registering Agent...');
        const regRes = await axios.post(`${API_URL}/agents/register`, {
            agentName: 'Test-Agent-1'
        }, {
            headers: { Authorization: `Bearer ${retailerToken}` }
        });
        agentKey = regRes.data.agentKey;
        agentId = regRes.data.agentId;
        console.log('Agent Registered:', { agentId, agentKey });

        // 3. Agent Heartbeat
        console.log('\n3. Sending Heartbeat...');
        await axios.post(`${API_URL}/agents/heartbeat`, {}, {
            headers: { 'x-agent-key': agentKey }
        });
        console.log('Heartbeat successful.');

        // 4. Upload Inventory
        console.log('\n4. Uploading Inventory...');
        const products = [
            {
                externalProductId: 'EXT-001',
                name: 'Test Product A',
                sellingPrice: 100,
                mrp: 120,
                quantity: 50,
                sku: 'SKU-001',
                isActive: true
            },
            {
                externalProductId: 'EXT-002',
                name: 'Test Product B',
                sellingPrice: 200,
                mrp: 250,
                quantity: 10,
                sku: 'SKU-002',
                isActive: true
            }
        ];
        const uploadRes = await axios.post(`${API_URL}/inventory/upload`, { products }, {
            headers: { 'x-agent-key': agentKey }
        });
        console.log('Inventory Uploaded:', uploadRes.data);

        // 5. Report Offline Sale
        console.log('\n5. Reporting Offline Sale...');
        const sales = [{ sku: 'SKU-001', qtyDelta: -2 }];
        const saleRes = await axios.post(`${API_URL}/inventory/offline-sale`, { sales }, {
            headers: { 'x-agent-key': agentKey }
        });
        console.log('Sale Reported:', saleRes.data);

        // 6. Pull Commands
        console.log('\n6. Pulling Commands...');
        const pullRes = await axios.post(`${API_URL}/commands/pull`, {}, {
            headers: { 'x-agent-key': agentKey }
        });
        console.log('Commands Pulled:', pullRes.data);

        console.log('\n--- Tests Completed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
};

runTests();
