const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmartSyncAgent' },
    direction: {
        type: String,
        enum: ["OFFLINE_TO_CLOUD", "ONLINE_TO_BILLING"],
        required: true
    },
    type: {
        type: String,
        enum: ["FULL_SYNC", "DELTA", "SALE", "STOCK_UPDATE"],
        required: true
    },
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
    status: {
        type: String,
        enum: ["SUCCESS", "FAILED", "PARTIAL"],
        required: true
    },
    errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
