const mongoose = require('mongoose');
const SmartSyncAgent = require('./models/SmartSyncAgent');
const connectDB = require('./config/db');
require('dotenv').config();

const checkAgent = async () => {
    try {
        await connectDB();
        const agents = await SmartSyncAgent.find({});
        console.log('--- Connected Agents ---');
        if (agents.length === 0) {
            console.log('No agents found.');
        } else {
            agents.forEach(agent => {
                console.log(`AGENT_KEY:${agent.agentKey}`);
            });
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAgent();
