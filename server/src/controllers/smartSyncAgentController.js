const SmartSyncAgent = require('../models/SmartSyncAgent');
const BillingConnectorConfig = require('../models/BillingConnectorConfig');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Middleware to authenticate Agent
exports.authenticateAgent = async (req, res, next) => {
    try {
        const agentKey = req.headers['x-agent-key'];
        if (!agentKey) {
            return res.status(401).json({ message: 'Agent Key missing' });
        }

        const agent = await SmartSyncAgent.findOne({ agentKey });
        if (!agent) {
            return res.status(401).json({ message: 'Invalid Agent Key' });
        }

        req.agent = agent;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Agent authentication failed', error: error.message });
    }
};

// 1. POST /agents/register
exports.registerAgent = async (req, res) => {
    try {
        const { agentName } = req.body;
        // req.user is set by the protect middleware (Retailer Auth)
        const retailerId = req.user.retailerProfile;

        if (!retailerId) {
            return res.status(400).json({ message: 'Retailer profile not found' });
        }

        // Generate a secure random agent key
        const agentKey = crypto.randomBytes(32).toString('hex');

        const agent = await SmartSyncAgent.create({
            retailerId,
            agentName,
            agentKey,
            status: 'ONLINE',
            lastSeenAt: new Date()
        });

        // Create a default connector config
        await BillingConnectorConfig.create({
            agentId: agent._id,
            type: 'LOCAL_DB', // Default
            isActive: true
        });

        res.status(201).json({
            message: 'Agent registered successfully',
            agentId: agent._id,
            agentKey: agentKey
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// 2. POST /agents/heartbeat
exports.heartbeat = async (req, res) => {
    try {
        const agent = req.agent;
        agent.lastSeenAt = new Date();
        agent.status = 'ONLINE';
        await agent.save();

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        res.status(500).json({ message: 'Heartbeat failed', error: error.message });
    }
};

// 3. POST /inventory/upload
exports.uploadInventory = async (req, res) => {
    try {
        const agent = req.agent;
        const products = req.body.products; // Array of product records

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ message: 'Invalid products data' });
        }

        // Get connector config to check for field mapping (optional, agent might have already mapped it)
        // Assuming agent sends normalized data as per requirements: 
        // externalProductId, name, mrp, sellingPrice, quantity, sku, barcode, taxRate, isActive

        const bulkOps = products.map(p => ({
            updateOne: {
                filter: { retailer: agent.retailerId, sku: p.sku }, // Match by SKU
                update: {
                    $set: {
                        name: p.name,
                        price: p.sellingPrice,
                        mrp: p.mrp,
                        stockQuantity: p.quantity,
                        isActive: p.isActive !== undefined ? p.isActive : true,
                        taxRate: p.taxRate || 0,
                        barcode: p.barcode || p.sku,
                        'smartSync.lastSyncedAt': new Date(),
                        'smartSync.externalId': p.externalProductId,
                        source: 'EXTERNAL_SYNC'
                    },
                    $setOnInsert: {
                        retailer: agent.retailerId,
                        unit: 'pcs',
                        imageStatus: 'pending'
                    }
                },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        // Log sync
        await SyncLog.create({
            retailerId: agent.retailerId,
            agentId: agent._id,
            direction: 'OFFLINE_TO_CLOUD',
            type: 'FULL_SYNC',
            status: 'SUCCESS',
            requestPayload: { count: products.length } // Don't log full payload to save space
        });

        res.status(200).json({ message: 'Inventory synced', count: products.length });
    } catch (error) {
        console.error('Inventory upload error:', error);
        await SyncLog.create({
            retailerId: req.agent.retailerId,
            agentId: req.agent._id,
            direction: 'OFFLINE_TO_CLOUD',
            type: 'FULL_SYNC',
            status: 'FAILED',
            errorMessage: error.message
        });
        res.status(500).json({ message: 'Sync failed', error: error.message });
    }
};

// 4. POST /inventory/offline-sale
exports.reportOfflineSale = async (req, res) => {
    try {
        const agent = req.agent;
        const sales = req.body.sales; // Array of { sku, qtyDelta }

        if (!sales || !Array.isArray(sales)) {
            return res.status(400).json({ message: 'Invalid sales data' });
        }

        const bulkOps = sales.map(s => ({
            updateOne: {
                filter: { retailer: agent.retailerId, sku: s.sku },
                update: { $inc: { stockQuantity: -Math.abs(s.qtyDelta) } } // Decrease stock
            }
        }));

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        await SyncLog.create({
            retailerId: agent.retailerId,
            agentId: agent._id,
            direction: 'OFFLINE_TO_CLOUD',
            type: 'SALE',
            status: 'SUCCESS',
            requestPayload: { count: sales.length }
        });

        res.status(200).json({ message: 'Sales reported', count: sales.length });
    } catch (error) {
        res.status(500).json({ message: 'Reporting failed', error: error.message });
    }
};

// 5. POST /commands/pull
exports.pullCommands = async (req, res) => {
    try {
        const agent = req.agent;

        // In a real system, we would have a Command model. 
        // For now, we'll simulate or check if there are any pending actions.
        // For example, if we had a "PendingStockUpdates" collection.
        // Since the requirements mention "especially stock update commands when ecommerce orders happen",
        // we should probably have a way to queue these.

        // For this implementation, let's assume we return an empty list or mock it.
        // To make it real, we'd need to modify the Order creation flow to push commands here.
        // Let's create a simple in-memory or DB-based queue mechanism if needed, 
        // but for now, we'll return an empty array as the core requirement is the structure.

        // TODO: Implement Command Queue
        const commands = [];

        res.status(200).json({ commands });
    } catch (error) {
        res.status(500).json({ message: 'Pull failed', error: error.message });
    }
};

// 6. POST /commands/ack
exports.ackCommand = async (req, res) => {
    try {
        const { commandId, status, message } = req.body;
        // Update command status in DB (if we had a Command model)

        await SyncLog.create({
            retailerId: req.agent.retailerId,
            agentId: req.agent._id,
            direction: 'ONLINE_TO_BILLING',
            type: 'STOCK_UPDATE', // Assuming it was a stock update
            status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
            errorMessage: message,
            responsePayload: { commandId }
        });

        res.status(200).json({ message: 'Acknowledged' });
    } catch (error) {
        res.status(500).json({ message: 'Ack failed', error: error.message });
    }
};

// 7. PATCH /agents/:id/permissions
exports.updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { allowedWriteBack } = req.body;

        // Verify retailer owns this agent
        const agent = await SmartSyncAgent.findOne({ _id: id, retailerId: req.user.retailerProfile });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        if (allowedWriteBack !== undefined) {
            agent.allowedWriteBack = allowedWriteBack;
        }

        await agent.save();
        res.status(200).json({ message: 'Permissions updated', agent });
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// Get all agents for the logged-in retailer
exports.getAgents = async (req, res) => {
    try {
        const retailerId = req.user.retailerProfile;
        const agents = await SmartSyncAgent.find({ retailerId });
        res.status(200).json(agents);
    } catch (error) {
        res.status(500).json({ message: 'Fetch failed', error: error.message });
    }
};
