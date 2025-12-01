const mongoose = require('mongoose');

const externalSaleSyncLogSchema = new mongoose.Schema({
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    externalInvoiceId: { type: String },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true },
    message: { type: String },
    payload: { type: Object }, // Store the raw payload for debugging
}, { timestamps: true });

module.exports = mongoose.model('ExternalSaleSyncLog', externalSaleSyncLogSchema);
