const mongoose = require('mongoose');

const smartSyncProfileSchema = new mongoose.Schema({
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true, unique: true },
    syncSource: {
        type: String,
        enum: ['FILE', 'DB_CONNECTOR', 'API_PUSH', 'MANUAL'],
        default: 'MANUAL'
    },
    connectorConfig: {
        connectionString: { type: String }, // Encrypted in real implementation
        filePath: { type: String },
        pollingInterval: { type: Number, default: 3600 } // Seconds
    },
    fieldMapping: {
        sku: { type: String }, // e.g., "ItemCode"
        stock: { type: String }, // e.g., "QOH"
        price: { type: String }, // e.g., "MRP"
        name: { type: String }
    },
    conflictRules: {
        masterSource: { type: String, enum: ['EXTERNAL', 'INTERNAL'], default: 'EXTERNAL' },
        lockedFields: [{ type: String }] // e.g., ['price']
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SmartSyncProfile', smartSyncProfileSchema);
