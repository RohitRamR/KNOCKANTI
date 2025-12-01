const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const SmartSyncLog = require('./src/models/SmartSyncLog');
require('dotenv').config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Check for the new product
        const product = await Product.findOne({ sku: 'SKU007' });
        if (product) {
            console.log('✅ Product SKU007 found:', product.name);
        } else {
            console.error('❌ Product SKU007 NOT found');
        }

        // Check for recent logs
        const logs = await SmartSyncLog.find().sort({ createdAt: -1 }).limit(5);
        const secureLog = logs.find(l => l.sourceType === 'SECURE_AGENT');

        if (secureLog) {
            console.log('✅ Secure Sync Log Found!');
            console.log('Source:', secureLog.sourceType);
            console.log('Status:', secureLog.status);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
