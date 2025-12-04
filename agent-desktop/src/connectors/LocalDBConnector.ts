import { BillingConnector, ProductRecord, StockChange } from './BillingConnector';
import * as mysql from 'mysql2/promise';
const mssql = require('mssql');

export class LocalDBConnector implements BillingConnector {
    private config: any;
    private connection: any;
    private type: 'mysql' | 'mssql';

    constructor(config: any) {
        this.config = config;
        this.type = config.type; // 'mysql' or 'mssql'
    }

    async connect(): Promise<void> {
        if (this.type === 'mysql') {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database
            });
        } else if (this.type === 'mssql') {
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

    async testConnection(): Promise<boolean> {
        try {
            await this.connect();
            await this.disconnect();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    async fetchProducts(): Promise<ProductRecord[]> {
        await this.connect();
        let products: ProductRecord[] = [];

        try {
            if (this.type === 'mysql') {
                const [rows] = await this.connection.execute(this.config.queries.fetchProducts);
                products = this.mapRows(rows);
            } else if (this.type === 'mssql') {
                const result = await this.connection.request().query(this.config.queries.fetchProducts);
                products = this.mapRows(result.recordset);
            }
        } finally {
            await this.disconnect();
        }

        return products;
    }

    async fetchStockChanges(since: Date): Promise<StockChange[]> {
        // Implementation depends on if the DB has a 'last_modified' column or a sales log
        // For now, returning empty as it requires specific DB schema knowledge
        return [];
    }

    async applyStockUpdate(sku: string, newQuantity: number): Promise<boolean> {
        await this.connect();
        try {
            if (this.type === 'mysql') {
                await this.connection.execute(this.config.queries.updateStock, [newQuantity, sku]);
            } else if (this.type === 'mssql') {
                await this.connection.request()
                    .input('qty', mssql.Int, newQuantity)
                    .input('sku', mssql.VarChar, sku)
                    .query(this.config.queries.updateStock);
            }
            return true;
        } catch (error) {
            console.error('Stock update failed:', error);
            return false;
        } finally {
            await this.disconnect();
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            if (this.type === 'mysql') {
                await this.connection.end();
            } else if (this.type === 'mssql') {
                await this.connection.close();
            }
        }
    }

    private mapRows(rows: any[]): ProductRecord[] {
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
