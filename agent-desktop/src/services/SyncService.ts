import { BillingConnector } from '../connectors/BillingConnector';
import { ApiClient } from '../api';

export class SyncService {
    private connector: BillingConnector;
    private api: ApiClient;

    constructor(connector: BillingConnector, api: ApiClient) {
        this.connector = connector;
        this.api = api;
    }

    async runSync() {
        console.log('Starting sync...');
        try {
            const products = await this.connector.fetchProducts();
            console.log(`Fetched ${products.length} products. Uploading...`);
            await this.api.uploadInventory(products);
            console.log('Sync completed successfully.');
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}
