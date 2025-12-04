import { loadConfig, saveConfig, AgentConfig } from './config';
import { ApiClient } from './api';
import { LocalDBConnector } from './connectors/LocalDBConnector';
import { CSVConnector } from './connectors/CSVConnector';
import { ZohoBooksConnector } from './connectors/ZohoBooksConnector';
import { SyncService } from './services/SyncService';
import { CommandService } from './services/CommandService';
import inquirer from 'inquirer';
import cron from 'node-cron';

const setup = async () => {
    console.log('Welcome to SmartSync Agent Setup');

    const answers = await inquirer.prompt([
        { type: 'input', name: 'serverUrl', message: 'Enter Server URL:', default: 'http://localhost:5000' },
        { type: 'input', name: 'retailerToken', message: 'Enter Retailer Auth Token:' },
        { type: 'input', name: 'agentName', message: 'Enter Agent Name:', default: 'Desktop-Agent-1' },
        { type: 'list', name: 'connectorType', message: 'Choose Billing Connector:', choices: ['LOCAL_DB', 'CSV', 'ZOHO_BOOKS'] }
    ]);

    // Connector specific config
    let connectorConfig: any = {};
    if (answers.connectorType === 'LOCAL_DB') {
        connectorConfig = await inquirer.prompt([
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
    } else if (answers.connectorType === 'CSV') {
        connectorConfig = await inquirer.prompt([
            { type: 'input', name: 'folderPath', message: 'CSV Folder Path:' }
        ]);
        connectorConfig.fieldMapping = {
            id: 'id', name: 'name', price: 'price', stock: 'stock', sku: 'sku'
        };
    }

    const tempApi = new ApiClient({ serverUrl: answers.serverUrl } as any);
    try {
        const result = await tempApi.register(answers.retailerToken, answers.agentName);
        console.log('Registration Successful!');

        const config: AgentConfig = {
            serverUrl: answers.serverUrl,
            agentKey: result.agentKey,
            connectorType: answers.connectorType,
            connectorConfig
        };

        saveConfig(config);
        return config;
    } catch (error: any) {
        console.error('Registration failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

const main = async () => {
    let config = loadConfig();
    if (!config) {
        config = await setup();
    }

    if (!config) return;

    console.log('Starting SmartSync Agent...');
    const api = new ApiClient(config);

    let connector;
    if (config.connectorType === 'LOCAL_DB') connector = new LocalDBConnector(config.connectorConfig);
    else if (config.connectorType === 'CSV') connector = new CSVConnector(config.connectorConfig);
    else if (config.connectorType === 'ZOHO_BOOKS') connector = new ZohoBooksConnector(config.connectorConfig);
    else throw new Error('Unknown connector type');

    const syncService = new SyncService(connector, api);
    const commandService = new CommandService(connector, api);

    // Initial Heartbeat
    await api.heartbeat();

    // Schedule Sync (every 1 minute)
    cron.schedule('* * * * *', () => {
        syncService.runSync();
    });

    // Schedule Heartbeat (every 1 minute)
    cron.schedule('* * * * *', () => {
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
