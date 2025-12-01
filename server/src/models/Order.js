const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for walk-in POS
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String, // Snapshot
        quantity: Number,
        price: Number, // Snapshot
        tax: Number
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'ACCEPTED', 'ARRIVED_PICKUP', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'ASSIGNED_WAITING'],
        default: 'PLACED'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE', 'CASH_POS'],
        default: 'COD'
    },
    deliveryAddress: {
        addressLine: String,
        city: String,
        zip: String,
        lat: Number,
        lng: Number
    },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalInvoiceId: { type: String }, // If synced from external POS
    source: {
        type: String,
        enum: ['APP', 'POS', 'EXTERNAL_SYNC'],
        default: 'APP'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
