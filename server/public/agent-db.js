const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5002/api/smartsync/webhook',
    API_KEY: process.argv[2] || 'YOUR_API_KEY_HERE',
    DB_FILE: path.join(__dirname, 'COMP001.db'),
    POLL_INTERVAL: 5000, // Check every 5 seconds
    MAX_RETRIES: 5
};

console.log('🛡️  SmartSync Agent (Database Edition) Starting...');

// --- AUTO-INSTALL DEPENDENCIES ---
const ensureDependency = (name) => {
    try {
        return require(name);
    } catch (e) {
        console.log(`📦 Installing required package: ${name}...`);
        try {
            execSync(`npm install ${name}`, { stdio: 'inherit', cwd: __dirname });
            console.log(`✅ Installed ${name}.`);
            return require(name);
        } catch (installError) {
            console.error(`❌ Failed to install ${name}. Please run 'npm install ${name}' manually.`);
            process.exit(1);
        }
    }
};

const sqlite3 = ensureDependency('sqlite3').verbose();
// ---------------------------------

console.log(`📂 Watching Database: ${CONFIG.DB_FILE}`);
console.log(`🔗 Target URL: ${CONFIG.API_URL}`);

let lastHash = '';

// Helper: Calculate MD5 for content change detection
const calculateHash = (content) => {
    return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
};

// Helper: Calculate HMAC-SHA256 for API Security
const generateSignature = (payload, timestamp) => {
    const data = `${JSON.stringify(payload)}.${timestamp}`;
    return crypto.createHmac('sha256', CONFIG.API_KEY).update(data).digest('hex');
};

// Helper: Sleep for backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            'User-Agent': 'SmartSync-Agent-DB/1.0.0'
        },
        timeout: 10000
    };

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

const getTableSchema = (db, tableName) => {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const findProductTable = async (db) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", async (err, tables) => {
            if (err) return reject(err);

            const candidates = tables.map(t => t.name);
            console.log('🔎 Found tables:', candidates.join(', '));

            // Heuristic: Look for tables with 'product', 'item', or 'inventory' in the name
            const bestMatch = candidates.find(name => /product|item|inventory|stock/i.test(name));

            if (bestMatch) {
                console.log(`🎯 Auto-selected table: ${bestMatch}`);
                resolve(bestMatch);
            } else if (candidates.length > 0) {
                console.log(`⚠️ No obvious product table found. Using first table: ${candidates[0]}`);
                resolve(candidates[0]);
            } else {
                reject(new Error('No tables found in database.'));
            }
        });
    });
};

const readDatabase = async () => {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(CONFIG.DB_FILE)) {
            console.log('Waiting for database file...');
            return resolve(null);
        }

        const db = new sqlite3.Database(CONFIG.DB_FILE, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        try {
            const tableName = await findProductTable(db);

            // Read all data
            db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
                db.close();
            });
        } catch (error) {
            db.close();
            reject(error);
        }
    });
};

const syncInventory = async () => {
    try {
        const data = await readDatabase();
        if (!data) return;

        const currentHash = calculateHash(data);

        if (currentHash !== lastHash) {
            console.log(`📝 Database change detected! (${data.length} records) Processing...`);

            const success = await sendPayload(data);
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
