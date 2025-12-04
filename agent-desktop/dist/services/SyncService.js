"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
class SyncService {
    constructor(connector, api) {
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
        }
        catch (error) {
            console.error('Sync failed:', error);
        }
    }
}
exports.SyncService = SyncService;
