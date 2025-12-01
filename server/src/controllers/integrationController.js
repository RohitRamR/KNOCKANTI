const Order = require('../models/Order');
const Product = require('../models/Product');
const ExternalIntegrationConfig = require('../models/ExternalIntegrationConfig');
const ExternalSaleSyncLog = require('../models/ExternalSaleSyncLog');
const RetailerProfile = require('../models/RetailerProfile');

// @desc    Handle external billing webhook
// @route   POST /api/integrations/external-billing/webhook
// @access  Public (Protected by API Key)
const handleExternalWebhook = async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const payload = req.body;

    if (!apiKey) {
        return res.status(401).json({ message: 'API Key missing' });
    }

    try {
        // 1. Verify API Key
        const config = await ExternalIntegrationConfig.findOne({ apiKey, isActive: true });
        if (!config) {
            return res.status(401).json({ message: 'Invalid API Key' });
        }

        const retailerId = config.retailer;

        // 2. Process Payload
        // Expected payload: { externalInvoiceId, items: [{ sku, quantity, price }], totalAmount, timestamp }
        const { externalInvoiceId, items, totalAmount, timestamp } = payload;

        // Check for duplicate (idempotency)
        const existingOrder = await Order.findOne({
            retailer: retailerId,
            externalInvoiceId
        });

        if (existingOrder) {
            return res.status(200).json({ message: 'Duplicate invoice ignored' });
        }

        const orderItems = [];

        // 3. Map items and update stock
        for (const item of items) {
            // Find product by SKU
            let product = await Product.findOne({ retailer: retailerId, sku: item.sku });

            if (product) {
                // Update stock
                product.stockQuantity -= item.quantity;
                await product.save();

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: item.price,
                    tax: 0 // Simplified for external sync
                });
            } else {
                // Product not found in our DB, maybe log warning or create placeholder?
                // For now, we just record it as a line item without product reference if we want, 
                // or skip. Let's record name if provided.
                orderItems.push({
                    name: item.name || `Unknown SKU: ${item.sku}`,
                    quantity: item.quantity,
                    price: item.price,
                    tax: 0
                });
            }
        }

        // 4. Create Order
        const order = new Order({
            retailer: retailerId,
            items: orderItems,
            totalAmount,
            status: 'DELIVERED', // External sales are already completed
            paymentMethod: 'CASH_POS', // Default or map from payload
            externalInvoiceId,
            source: 'EXTERNAL_SYNC'
        });

        await order.save();

        // 5. Log Success
        await ExternalSaleSyncLog.create({
            retailer: retailerId,
            externalInvoiceId,
            status: 'SUCCESS',
            message: 'Synced successfully',
            payload
        });

        // Update config last synced
        config.lastSyncedAt = new Date();
        await config.save();

        res.status(200).json({ message: 'Sync successful' });

    } catch (error) {
        console.error(error);
        // Log Failure
        // We might not have retailerId if config lookup failed, but if it succeeded we do.
        // If config lookup failed, we can't log to a specific retailer easily without more info.
        // Assuming we found config:
        // We can try to log failure if we have config context.

        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Handle file import (CSV)
// @route   POST /api/integrations/external-billing/import-file
// @access  Private/Retailer
const handleFileImport = async (req, res) => {
    // For MVP, we assume the file content is sent as JSON body or raw text if we don't use multer
    // But a proper file upload needs multer.
    // To keep it simple without adding multer dependency right now, let's assume client parses CSV and sends JSON array.
    // This is easier for the "Migration Wizard" on frontend to handle mapping anyway.

    try {
        const { products } = req.body; // Array of { name, sku, price, stock }

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const retailerId = req.user.retailerProfile;
        let count = 0;

        for (const item of products) {
            // Upsert product
            await Product.findOneAndUpdate(
                { retailer: retailerId, sku: item.sku },
                {
                    name: item.name,
                    price: item.price,
                    stockQuantity: item.stockQuantity,
                    barcode: item.barcode,
                    source: 'EXTERNAL_SYNC'
                },
                { upsert: true, new: true }
            );
            count++;
        }

        res.json({ message: `Successfully imported ${count} products` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const axios = require('axios');

// @desc    Search products from external API (OpenFoodFacts)
// @route   GET /api/integrations/product-search
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);

        if (response.data && response.data.products) {
            // Filter and map to a simpler format
            const products = response.data.products.map(p => ({
                name: p.product_name,
                image: p.image_front_url || p.image_url || p.image_front_small_url || p.image_small_url || null,
                brand: p.brands,
                category: p.categories
            })).filter(p => p.image); // Only return products with images

            return res.json(products);
        }

        res.json([]);
    } catch (error) {
        console.error('Error searching external API:', error.message);
        res.status(500).json({ message: 'Error searching products' });
    }
};

module.exports = { handleExternalWebhook, handleFileImport, searchProducts };

