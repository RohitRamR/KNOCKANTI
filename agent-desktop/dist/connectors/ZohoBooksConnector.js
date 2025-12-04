"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoBooksConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class ZohoBooksConnector {
    constructor(config) {
        this.accessToken = '';
        this.config = config;
    }
    async connect() {
        // Refresh token logic would go here
        this.accessToken = this.config.accessToken; // Simplified
    }
    async testConnection() {
        try {
            await axios_1.default.get('https://www.zohoapis.com/books/v3/organizations', {
                headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}` }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async fetchProducts() {
        // Pagination logic needed for real implementation
        const response = await axios_1.default.get(`https://www.zohoapis.com/books/v3/items?organization_id=${this.config.orgId}`, {
            headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}` }
        });
        return response.data.items.map((item) => ({
            externalProductId: item.item_id,
            name: item.name,
            mrp: item.rate, // Zoho doesn't always have MRP, using rate
            sellingPrice: item.rate,
            quantity: item.stock_on_hand,
            sku: item.sku,
            isActive: item.status === 'active'
        }));
    }
    async fetchStockChanges(since) {
        return [];
    }
    async applyStockUpdate(sku, newQuantity) {
        // Zoho requires finding item ID first, then updating
        return true;
    }
    async disconnect() {
    }
}
exports.ZohoBooksConnector = ZohoBooksConnector;
