"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const api_1 = require("./api");
const LocalDBConnector_1 = require("./connectors/LocalDBConnector");
const CSVConnector_1 = require("./connectors/CSVConnector");
const ZohoBooksConnector_1 = require("./connectors/ZohoBooksConnector");
const SyncService_1 = require("./services/SyncService");
const CommandService_1 = require("./services/CommandService");
const inquirer_1 = __importDefault(require("inquirer"));
const node_cron_1 = __importDefault(require("node-cron"));
const setup = async () => {
    var _a;
    console.log('Welcome to SmartSync Agent Setup');
    const answers = await inquirer_1.default.prompt([
        { type: 'input', name: 'serverUrl', message: 'Enter Server URL:', default: 'http://localhost:5000' },
        { type: 'input', name: 'retailerToken', message: 'Enter Retailer Auth Token:' },
        { type: 'input', name: 'agentName', message: 'Enter Agent Name:', default: 'Desktop-Agent-1' },
        { type: 'list', name: 'connectorType', message: 'Choose Billing Connector:', choices: ['LOCAL_DB', 'CSV', 'ZOHO_BOOKS'] }
    ]);
    // Connector specific config
    let connectorConfig = {};
    if (answers.connectorType === 'LOCAL_DB') {
        connectorConfig = await inquirer_1.default.prompt([
            { type: 'list', name: 'type', message: 'DB Type:', choices: ['mysql', 'mssql'] },
            { type: 'input', name: 'host', message: 'Host:', default: 'localhost' },
            { type: 'input', name: 'user', message: 'User:' },
            { type: 'password', name: 'password', message: 'Password:' },
            { type: 'input', name: 'database', message: 'Database Name:' },
            // Field mapping prompts would go here
        ]);
        // Add default mapping for demo
        connectorConfig.queries = {
            fetchProducts: 'SELECT * FROM products',
            updateStock: 'UPDATE products SET stock = ? WHERE sku = ?'
        };
        connectorConfig.fieldMapping = {
            id: 'id', name: 'name', price: 'price', stock: 'stock', sku: 'sku'
        };
    }
    else if (answers.connectorType === 'CSV') {
        connectorConfig = await inquirer_1.default.prompt([
            { type: 'input', name: 'folderPath', message: 'CSV Folder Path:' }
        ]);
        connectorConfig.fieldMapping = {
            id: 'id', name: 'name', price: 'price', stock: 'stock', sku: 'sku'
        };
    }
    const tempApi = new api_1.ApiClient({ serverUrl: answers.serverUrl });
    try {
        const result = await tempApi.register(answers.retailerToken, answers.agentName);
        console.log('Registration Successful!');
        const config = {
            serverUrl: answers.serverUrl,
            agentKey: result.agentKey,
            connectorType: answers.connectorType,
            connectorConfig
        };
        (0, config_1.saveConfig)(config);
        return config;
    }
    catch (error) {
        console.error('Registration failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        process.exit(1);
    }
};
const main = async () => {
    let config = (0, config_1.loadConfig)();
    if (!config) {
        config = await setup();
    }
    if (!config)
        return;
    console.log('Starting SmartSync Agent...');
    const api = new api_1.ApiClient(config);
    let connector;
    if (config.connectorType === 'LOCAL_DB')
        connector = new LocalDBConnector_1.LocalDBConnector(config.connectorConfig);
    else if (config.connectorType === 'CSV')
        connector = new CSVConnector_1.CSVConnector(config.connectorConfig);
    else if (config.connectorType === 'ZOHO_BOOKS')
        connector = new ZohoBooksConnector_1.ZohoBooksConnector(config.connectorConfig);
    else
        throw new Error('Unknown connector type');
    const syncService = new SyncService_1.SyncService(connector, api);
    const commandService = new CommandService_1.CommandService(connector, api);
    // Initial Heartbeat
    await api.heartbeat();
    // Schedule Sync (every 1 minute)
    node_cron_1.default.schedule('* * * * *', () => {
        syncService.runSync();
    });
    // Schedule Heartbeat (every 1 minute)
    node_cron_1.default.schedule('* * * * *', () => {
        api.heartbeat();
    });
    // Poll Commands (every 10 seconds)
    setInterval(() => {
        commandService.poll();
    }, 10000);
    console.log('Agent running. Press Ctrl+C to exit.');
    // Run initial sync
    syncService.runSync();
};
main();
