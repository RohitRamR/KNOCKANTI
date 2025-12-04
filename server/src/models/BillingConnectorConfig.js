const mongoose = require('mongoose');

const billingConnectorConfigSchema = new mongoose.Schema({
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmartSyncAgent', required: true },
    type: {
        type: String,
        enum: ["LOCAL_DB", "CSV", "ZOHO_BOOKS", "QUICKBOOKS", "TALLY", "CUSTOM"],
        required: true
    },
    connectionDetails: {
        type: mongoose.Schema.Types.Mixed, // flexible for different connector types
        default: {}
    },
    fieldMapping: {
        type: Map,
        of: String,
        default: {}
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BillingConnectorConfig', billingConnectorConfigSchema);
