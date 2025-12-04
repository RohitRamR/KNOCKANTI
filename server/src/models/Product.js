const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProfile', required: true },
    name: { type: String, required: true },
    brand: { type: String },
    sku: { type: String, index: true },
    barcode: { type: String, index: true },
    category: { type: String },
    subCategory: { type: String }, // e.g. 'Smartphone', 'Antibiotics'
    price: { type: Number, required: true }, // Selling Price
    mrp: { type: Number }, // Maximum Retail Price
    purchasePrice: { type: Number },
    isActive: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, default: 'pcs' },
    images: [String],
    imageUrl: { type: String }, // The main official image
    imageStatus: {
        type: String,
        enum: ['pending', 'fetched', 'failed'],
        default: 'pending'
    },
    imageSource: { type: String }, // e.g. 'bing', 'google'
    source: {
        type: String,
        enum: ['MANUAL', 'EXTERNAL_SYNC'],
        default: 'MANUAL'
    },
    smartSync: {
        lastSyncedAt: { type: Date },
        externalId: { type: String, index: true },
        sourceHash: { type: String }, // To detect if data actually changed
        isLocked: { type: Boolean, default: false } // If true, SmartSync ignores this product
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
