const mongoose = require('mongoose');

const smartSyncLogSchema = new mongoose.Schema({
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    batchId: { type: String, required: true, index: true },
    sourceType: { type: String, required: true },
    recordsProcessed: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    status: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILED'], required: true },
    provenanceHash: { type: String }, // SHA-256 signature of the payload
    details: { type: Object } // Summary of errors or stats
}, { timestamps: true });

module.exports = mongoose.model('SmartSyncLog', smartSyncLogSchema);
