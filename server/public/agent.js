const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5001/api/smartsync/webhook',
    API_KEY: process.argv[2] || 'YOUR_API_KEY_HERE', // Pass as arg or edit file
    WATCH_FILE: path.join(__dirname, 'inventory.csv'),
    POLL_INTERVAL: 5000, // 5 seconds
    MAX_RETRIES: 5
};

console.log('🛡️  SmartSync Agent Starting (Secure Mode)...');
console.log(`📂 Watching file: ${CONFIG.WATCH_FILE}`);
console.log(`🔗 Target URL: ${CONFIG.API_URL}`);

let lastHash = '';

// Helper: Calculate MD5 for file change detection
const calculateFileHash = (content) => {
    return crypto.createHash('md5').update(content).digest('hex');
};

// Helper: Calculate HMAC-SHA256 for API Security
const generateSignature = (payload, timestamp) => {
    const data = `${JSON.stringify(payload)}.${timestamp}`;
    return crypto.createHmac('sha256', CONFIG.API_KEY).update(data).digest('hex');
};

// Helper: Sleep for backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseCSV = (content) => {
    // 1. Remove BOM (Byte Order Mark) if present (common in Excel CSVs)
    const cleanContent = content.replace(/^\uFEFF/, '');

    const lines = cleanContent.trim().split('\n');
    if (lines.length < 2) return [];

    // Helper to split by comma but ignore commas inside quotes
    const splitLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = splitLine(lines[i]);

        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((h, index) => {
                // Remove quotes from values if present
                obj[h] = values[index].replace(/^"|"$/g, '');
            });
            data.push(obj);
        }
    }
    return data;
};

const sendPayload = async (payload, retryCount = 0) => {
    const timestamp = Date.now().toString();
    const signature = generateSignature(payload, timestamp);
    const postData = JSON.stringify({ payload });

    const url = new URL(CONFIG.API_URL);

    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'x-api-key': CONFIG.API_KEY,
            'x-signature': signature,
            'x-timestamp': timestamp,
            'User-Agent': 'SmartSync-Agent/1.0.0'
        },
        timeout: 10000 // 10s timeout
    };

    // Use https module if the protocol is https
    const client = url.protocol === 'https:' ? require('https') : http;

    return new Promise((resolve) => {
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const response = JSON.parse(data);
                    console.log(`✅ Sync Success: Batch ${response.batchId}`);
                    resolve(true);
                } else {
                    console.error(`❌ Sync Failed (Attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES}): Status ${res.statusCode} - ${data}`);
                    if (retryCount < CONFIG.MAX_RETRIES) {
                        const waitTime = Math.pow(2, retryCount) * 1000;
                        console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
                        await sleep(waitTime);
                        resolve(await sendPayload(payload, retryCount + 1));
                    } else {
                        resolve(false);
                    }
                }
            });
        });

        req.on('error', async (error) => {
            console.error(`❌ Network Error (Attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES}): ${error.message}`);
            if (retryCount < CONFIG.MAX_RETRIES) {
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
                await sleep(waitTime);
                resolve(await sendPayload(payload, retryCount + 1));
            } else {
                resolve(false);
            }
        });

        req.write(postData);
        req.end();
    });
};

const syncInventory = async () => {
    try {
        if (!fs.existsSync(CONFIG.WATCH_FILE)) {
            console.log('Waiting for inventory file...');
            return;
        }

        const content = fs.readFileSync(CONFIG.WATCH_FILE, 'utf8');
        const currentHash = calculateFileHash(content);

        if (currentHash !== lastHash) {
            console.log('📝 Change detected! Processing...');
            const payload = parseCSV(content);

            if (payload.length === 0) {
                console.log('⚠️ File appears empty or invalid. Skipping.');
                return;
            }

            const success = await sendPayload(payload);
            if (success) {
                lastHash = currentHash;
            }
        }
    } catch (error) {
        console.error('🔥 Critical Agent Error:', error.message);
    }
};

// Initial run
syncInventory();

// Poll for changes
setInterval(syncInventory, CONFIG.POLL_INTERVAL);
