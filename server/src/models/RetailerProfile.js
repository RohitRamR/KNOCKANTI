const mongoose = require('mongoose');

const retailerProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true },
    gstin: { type: String },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    subscriptionPlan: {
        type: String,
        enum: ['FREE', 'BASIC', 'PRO'],
        default: 'FREE'
    },
    apiKey: { type: String, unique: true, sparse: true }, // For SmartSync Agent/Webhook
    integrationConfig: { type: mongoose.Schema.Types.ObjectId, ref: 'ExternalIntegrationConfig' }
}, { timestamps: true });

module.exports = mongoose.model('RetailerProfile', retailerProfileSchema);
