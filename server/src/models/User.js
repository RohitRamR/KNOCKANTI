const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['ADMIN', 'CUSTOMER', 'RETAILER', 'DELIVERY_PARTNER'],
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'BLOCKED', 'PENDING_APPROVAL'],
        default: 'ACTIVE'
    },
    isOnline: { type: Boolean, default: false },
    location: {
        lat: Number,
        lng: Number,
        lastUpdated: Date
    },
    addresses: [{
        label: { type: String, default: 'Home' }, // Home, Work, Other
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
        lat: Number,
        lng: Number,
        isDefault: { type: Boolean, default: false }
    }],
    // References to profile documents
    retailerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile' },
    // deliveryProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryProfile' }, // Future
    // customerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile' }, // Future
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
