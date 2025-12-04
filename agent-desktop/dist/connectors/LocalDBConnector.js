"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDBConnector = void 0;
const mysql = __importStar(require("mysql2/promise"));
const mssql = require('mssql');
class LocalDBConnector {
    constructor(config) {
        this.config = config;
        this.type = config.type; // 'mysql' or 'mssql'
    }
    async connect() {
        if (this.type === 'mysql') {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database
            });
        }
        else if (this.type === 'mssql') {
            this.connection = await mssql.connect({
                user: this.config.user,
                password: this.config.password,
                server: this.config.host,
                database: this.config.database,
                options: {
                    encrypt: true,
                    trustServerCertificate: true
                }
            });
        }
    }
    async testConnection() {
        try {
            await this.connect();
            await this.disconnect();
            return true;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    async fetchProducts() {
        await this.connect();
        let products = [];
        try {
            if (this.type === 'mysql') {
                const [rows] = await this.connection.execute(this.config.queries.fetchProducts);
                products = this.mapRows(rows);
            }
            else if (this.type === 'mssql') {
                const result = await this.connection.request().query(this.config.queries.fetchProducts);
                products = this.mapRows(result.recordset);
            }
        }
        finally {
            await this.disconnect();
        }
        return products;
    }
    async fetchStockChanges(since) {
        // Implementation depends on if the DB has a 'last_modified' column or a sales log
        // For now, returning empty as it requires specific DB schema knowledge
        return [];
    }
    async applyStockUpdate(sku, newQuantity) {
        await this.connect();
        try {
            if (this.type === 'mysql') {
                await this.connection.execute(this.config.queries.updateStock, [newQuantity, sku]);
            }
            else if (this.type === 'mssql') {
                await this.connection.request()
                    .input('qty', mssql.Int, newQuantity)
                    .input('sku', mssql.VarChar, sku)
                    .query(this.config.queries.updateStock);
            }
            return true;
        }
        catch (error) {
            console.error('Stock update failed:', error);
            return false;
        }
        finally {
            await this.disconnect();
        }
    }
    async disconnect() {
        if (this.connection) {
            if (this.type === 'mysql') {
                await this.connection.end();
            }
            else if (this.type === 'mssql') {
                await this.connection.close();
            }
        }
    }
    mapRows(rows) {
        const mapping = this.config.fieldMapping;
        return rows.map(row => ({
            externalProductId: String(row[mapping.id]),
            name: row[mapping.name],
            mrp: row[mapping.mrp],
            sellingPrice: row[mapping.price],
            quantity: row[mapping.stock],
            sku: row[mapping.sku],
            barcode: row[mapping.barcode],
            isActive: true
        }));
    }
}
exports.LocalDBConnector = LocalDBConnector;
