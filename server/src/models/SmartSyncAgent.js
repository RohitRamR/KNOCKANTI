const mongoose = require('mongoose');

const smartSyncAgentSchema = new mongoose.Schema({
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    agentKey: { type: String, required: true, unique: true },
    agentName: { type: String, required: true },
    status: {
        type: String,
        enum: ['ONLINE', 'OFFLINE'],
        default: 'OFFLINE'
    },
    lastSeenAt: { type: Date },
    allowedWriteBack: { type: Boolean, default: false },
    version: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SmartSyncAgent', smartSyncAgentSchema);
