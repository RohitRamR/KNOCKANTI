const mongoose = require('mongoose');
const SyncLog = require('./models/SmartSyncLog');
const connectDB = require('./config/db');
require('dotenv').config();

const checkLogs = async () => {
    try {
        await connectDB();
        const logs = await SyncLog.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('--- All Recent Sync Logs ---');
        if (logs.length === 0) {
            console.log('No logs found.');
        } else {
            logs.forEach(log => {
                console.log(`ID: ${log._id}`);
                console.log(`Type: ${log.type}`);
                console.log(`Source: ${log.sourceType}`);
                console.log(`Time: ${log.createdAt}`);
                console.log('------------------------');
            });
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLogs();
