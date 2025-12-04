const SmartSyncProfile = require('../models/SmartSyncProfile');
const SmartSyncLog = require('../models/SmartSyncLog');
const Product = require('../models/Product');
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');

// Helper: Calculate SHA-256 hash
const calculateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// AI HEURISTICS: Format Intelligence Engine (FIE™)
// Auto-detects field meaning based on column headers
const detectMapping = (headers) => {
    const mapping = {};
    const patterns = {
        sku: /sku|item|code|id|product_no|part_no/i,
        stock: /qty|quantity|stock|qoh|available|inventory/i,
        price: /price|mrp|cost|rate|amount|selling/i,
        name: /name|description|title|product|item_name/i
    };

    headers.forEach(header => {
        for (const [field, regex] of Object.entries(patterns)) {
            if (!mapping[field] && regex.test(header)) {
                mapping[field] = header;
            }
        }
    });

    return mapping;
};

// Helper: Parse File (CSV/Excel)
const parseFile = (filePath, mimeType) => {
    return new Promise((resolve, reject) => {
        const results = [];

        if (mimeType.includes('csv') || filePath.endsWith('.csv')) {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        } else if (mimeType.includes('sheet') || mimeType.includes('excel') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
            try {
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);
                resolve(data);
            } catch (err) {
                reject(err);
            }
        } else {
            reject(new Error('Unsupported file format. Please upload CSV or Excel.'));
        }
    });
};

exports.configureProfile = async (req, res) => {
    try {
        const { syncSource, connectorConfig, fieldMapping, conflictRules } = req.body;
        const retailerId = req.user.retailerProfile || req.body.retailerId;

        if (!retailerId) return res.status(400).json({ message: 'Retailer ID required' });

        let profile = await SmartSyncProfile.findOne({ retailer: retailerId });

        if (profile) {
            profile.syncSource = syncSource || profile.syncSource;
            profile.connectorConfig = connectorConfig || profile.connectorConfig;
            profile.fieldMapping = fieldMapping || profile.fieldMapping;
            profile.conflictRules = conflictRules || profile.conflictRules;
            await profile.save();
        } else {
            profile = await SmartSyncProfile.create({
                retailer: retailerId,
                syncSource,
                connectorConfig,
                fieldMapping,
                conflictRules
            });
        }

        res.status(200).json({ message: 'SmartSync Profile Configured', profile });
    } catch (error) {
        res.status(500).json({ message: 'Configuration failed', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const retailerId = req.user.retailerProfile || req.query.retailerId;
        const profile = await SmartSyncProfile.findOne({ retailer: retailerId });

        // Also fetch the apiKey from RetailerProfile
        const RetailerProfile = require('../models/RetailerProfile');
        const retailerProfile = await RetailerProfile.findById(retailerId);

        const response = profile ? profile.toObject() : {};
        if (retailerProfile) {
            response.apiKey = retailerProfile.apiKey;
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Fetch failed', error: error.message });
    }
};

// CORE INVENTION: Ingest & CRF™ (Conflict-Resilient Fusion)
exports.ingestPayload = async (req, res) => {
    const batchId = crypto.randomUUID();
    let payload = [];
    let retailerId = req.user?.retailerProfile || req.body.retailerId;

    // 1. Handle File Upload vs JSON Body
    try {
        if (req.file) {
            payload = await parseFile(req.file.path, req.file.mimetype);
            // Cleanup file
            fs.unlinkSync(req.file.path);
        } else if (req.body.payload) {
            payload = typeof req.body.payload === 'string' ? JSON.parse(req.body.payload) : req.body.payload;
        } else {
            return res.status(400).json({ message: 'No data provided (File or Payload required)' });
        }

        if (!retailerId) return res.status(400).json({ message: 'Retailer ID required' });

        // 2. Intelligence: Auto-Detect Mapping if not configured
        let profile = await SmartSyncProfile.findOne({ retailer: retailerId });
        let mapping = profile?.fieldMapping || {};

        // If profile mapping is empty or incomplete, OR if the current payload doesn't match the mapping
        const payloadHeaders = Object.keys(payload[0] || {});
        const isMappingValid = mapping.sku && payloadHeaders.includes(mapping.sku);

        if (!isMappingValid || !mapping.stock) {
            console.log('Mapping invalid or missing. Auto-detecting...');
            const detected = detectMapping(payloadHeaders);

            // Merge, but prefer detected for conflicts if invalid
            mapping = { ...mapping, ...detected };

            // Auto-save the detected mapping for future convenience
            if (profile) {
                profile.fieldMapping = mapping;
                await profile.save();
            } else {
                // Create profile on the fly if missing
                profile = await SmartSyncProfile.create({
                    retailer: retailerId,
                    syncSource: 'MANUAL',
                    fieldMapping: mapping
                });
            }
        }

        const lockedFields = profile?.conflictRules?.lockedFields || [];
        const payloadHash = calculateHash(payload);

        let processed = 0;
        let failed = 0;
        const errors = [];
        const bulkOps = [];

        // 3. Universal Stock Normalization (USN™)
        for (const item of payload) {
            try {
                // Fallback: If mapped field is missing, try standard keys (sku, stock, price, name)
                // Also support common variations like ItemCode, QOH, MRP, Description
                const sku = item[mapping.sku] || item.sku || item.item_code || item.id || item.ItemCode;

                // Handle various number formats (e.g., "$10.00", "1,000")
                const stockRaw = item[mapping.stock] || item.stock || item.qty || item.quantity || item.QOH || item.qoh;
                const priceRaw = item[mapping.price] || item.price || item.mrp || item.cost || item.MRP;
                const name = item[mapping.name] || item.name || item.title || item.description || item.Description;

                const stock = stockRaw ? parseInt(String(stockRaw).replace(/[^0-9.-]/g, '')) : 0;
                const price = priceRaw ? parseFloat(String(priceRaw).replace(/[^0-9.-]/g, '')) : 0;

                if (!sku) {
                    failed++;
                    errors.push({ item, reason: `Missing SKU (Mapped field '${mapping.sku}' or standard 'sku'/'ItemCode' not found)` });
                    continue;
                }

                // 4. Conflict-Resilient Fusion (CRF™)
                const updateFields = {
                    'smartSync.lastSyncedAt': new Date(),
                    'smartSync.externalId': sku,
                    'smartSync.sourceHash': calculateHash(item),
                    source: 'EXTERNAL_SYNC'
                };

                if (!lockedFields.includes('stock')) updateFields.stockQuantity = stock;
                if (!lockedFields.includes('price') && price > 0) updateFields.price = price;
                if (!lockedFields.includes('name') && name) updateFields.name = name;

                bulkOps.push({
                    updateOne: {
                        filter: { retailer: retailerId, sku: sku },
                        update: {
                            $set: updateFields,
                            $setOnInsert: {
                                retailer: retailerId,
                                sku: sku,
                                barcode: sku,
                                unit: 'pcs',
                                imageStatus: 'pending'
                            }
                        },
                        upsert: true
                    }
                });

                processed++;
            } catch (err) {
                failed++;
                errors.push({ item, reason: err.message });
            }
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        // 5. Audit Logging
        await SmartSyncLog.create({
            retailer: retailerId,
            batchId,
            sourceType: req.file ? 'FILE_UPLOAD' : 'API_PUSH',
            recordsProcessed: processed,
            recordsFailed: failed,
            status: failed === 0 ? 'SUCCESS' : (processed > 0 ? 'PARTIAL' : 'FAILED'),
            provenanceHash: payloadHash,
            details: {
                errors: errors.slice(0, 50),
                detectedMapping: mapping // Log what mapping was used
            }
        });

        res.status(200).json({
            message: 'Sync completed',
            batchId,
            stats: { processed, failed },
            mappingUsed: mapping
        });

    } catch (error) {
        console.error('SmartSync Ingest Error:', error);
        res.status(500).json({ message: 'Ingest failed', error: error.message });
    }
};

exports.getSyncHistory = async (req, res) => {
    try {
        const retailerId = req.user.retailerProfile || req.query.retailerId;
        const history = await SmartSyncLog.find({ retailer: retailerId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Fetch failed', error: error.message });
    }
};

exports.webhook = async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];

        if (!apiKey) return res.status(401).json({ message: 'API Key missing' });

        const RetailerProfile = require('../models/RetailerProfile');
        const profile = await RetailerProfile.findOne({ apiKey });

        if (!profile) return res.status(401).json({ message: 'Invalid API Key' });

        // SECURITY: Verify HMAC Signature if present (Agent Mode)
        // We allow legacy webhook mode (no signature) for 3rd party integrations like Zoho
        // But if signature is present, we MUST verify it.
        if (signature && timestamp) {
            // 1. Replay Attack Prevention (5 minute window)
            const now = Date.now();
            if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
                return res.status(401).json({ message: 'Request timestamp expired' });
            }

            // 2. Signature Verification
            const data = `${JSON.stringify(req.body.payload)}.${timestamp}`;
            const expectedSignature = crypto.createHmac('sha256', apiKey).update(data).digest('hex');

            // Use timingSafeEqual to prevent timing attacks
            const sigBuffer = Buffer.from(signature);
            const expectedBuffer = Buffer.from(expectedSignature);

            if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
                return res.status(401).json({ message: 'Invalid Signature' });
            }
        }

        const { payload } = req.body;
        if (!payload || !Array.isArray(payload)) {
            return res.status(400).json({ message: 'Invalid payload format. Expected array of items.' });
        }

        // Reuse ingest logic or similar
        // For simplicity, we'll process it directly here using the same logic as ingestPayload
        // But we need to mock the req.user or pass profile directly

        // Let's extract the processing logic to a helper if possible, or just duplicate for now to be safe
        // Actually, let's just do a quick process

        const batchId = crypto.randomUUID();
        let processed = 0;
        let failed = 0;
        const errors = [];

        // Default mapping for webhook (assuming standard format or pre-configured)
        // If profile has mapping, use it.
        const smartProfile = await SmartSyncProfile.findOne({ retailer: profile._id });
        let mapping = smartProfile?.fieldMapping;

        if (!mapping && payload.length > 0) {
            // Auto-detect from first item keys
            mapping = detectMapping(Object.keys(payload[0]));
        }

        // Fallback if detection failed
        mapping = mapping || { sku: 'sku', stock: 'stock', price: 'price', name: 'name' };

        for (const item of payload) {
            try {
                const sku = item[mapping.sku] || item.sku || item.item_code;
                const stock = parseInt(item[mapping.stock] || item.stock || item.qty || 0);
                const price = parseFloat(item[mapping.price] || item.price || item.rate || 0);
                const name = item[mapping.name] || item.name || item.description;

                if (!sku) {
                    failed++;
                    errors.push({ item, reason: 'Missing SKU' });
                    continue;
                }

                await Product.findOneAndUpdate(
                    { retailer: profile._id, sku },
                    {
                        name: name || 'Imported Product',
                        price,
                        stockQuantity: stock,
                        retailer: profile._id,
                        category: 'Uncategorized' // Default
                    },
                    { upsert: true, new: true }
                );
                processed++;
            } catch (err) {
                failed++;
                errors.push({ item, reason: err.message });
            }
        }

        // Log it
        await SmartSyncLog.create({
            retailer: profile._id,
            batchId,
            sourceType: signature ? 'SECURE_AGENT' : 'WEBHOOK', // Distinguish source
            recordsProcessed: processed,
            recordsFailed: failed,
            status: failed === 0 ? 'SUCCESS' : (processed > 0 ? 'PARTIAL' : 'FAILED'),
            details: { errors }
        });

        // Emit socket event if needed (skipped for now)

        res.status(200).json({ message: 'Webhook processed', batchId, stats: { processed, failed } });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook failed', error: error.message });
    }
};

exports.downloadAgent = (req, res) => {
    const path = require('path');
    const filePath = path.join(__dirname, '../../public/agent.js');

    res.setHeader('Content-Disposition', 'attachment; filename="agent.js"');
    res.download(filePath, 'agent.js', (err) => {
        if (err) {
            console.error('Error downloading agent.js:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Could not download agent file' });
            }
        }
    });
};

exports.downloadAgentZip = (req, res) => {
    const path = require('path');
    const filePath = path.join(__dirname, '../../public/agent.zip');

    res.setHeader('Content-Disposition', 'attachment; filename="agent.zip"');
    res.download(filePath, 'agent.zip', (err) => {
        if (err) {
            console.error('Error downloading agent.zip:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Could not download agent zip file' });
            }
        }
    });
};
