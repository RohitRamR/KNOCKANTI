import { BillingConnector, ProductRecord, StockChange } from './BillingConnector';
import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');
import * as XLSX from 'xlsx';

export class CSVConnector implements BillingConnector {
    private config: any;
    private watchedFolder: string;

    constructor(config: any) {
        this.config = config;
        this.watchedFolder = config.folderPath;
    }

    async connect(): Promise<void> {
        if (this.config.filePath) {
            if (!fs.existsSync(this.config.filePath)) {
                throw new Error(`File not found: ${this.config.filePath}`);
            }
        } else if (this.watchedFolder) {
            if (!fs.existsSync(this.watchedFolder)) {
                throw new Error(`Folder not found: ${this.watchedFolder}`);
            }
        } else {
            throw new Error('Neither filePath nor folderPath specified in config');
        }
    }

    async testConnection(): Promise<boolean> {
        if (this.config.filePath) return fs.existsSync(this.config.filePath);
        return fs.existsSync(this.watchedFolder);
    }

    async fetchProducts(): Promise<ProductRecord[]> {
        let filePath = this.config.filePath;

        if (!filePath && this.watchedFolder) {
            const files = fs.readdirSync(this.watchedFolder);
            const latestFile = files
                .filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'))
                .map(f => ({ name: f, time: fs.statSync(path.join(this.watchedFolder, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time)[0];

            if (!latestFile) return [];
            filePath = path.join(this.watchedFolder, latestFile.name);
        }

        if (!filePath) return [];

        const records: any[] = [];

        if (filePath.endsWith('.csv')) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data: any) => records.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);
            records.push(...data);
        }

        return this.mapRecords(records);
    }

    async fetchStockChanges(since: Date): Promise<StockChange[]> {
        return []; // CSV is usually full sync only
    }

    async applyStockUpdate(sku: string, newQuantity: number): Promise<boolean> {
        console.warn('Write-back not supported for CSV connector');
        return false;
    }

    async disconnect(): Promise<void> {
        // No-op
    }

    private mapRecords(rows: any[]): ProductRecord[] {
        const mapping = this.config.fieldMapping;
        return rows.map(row => ({
            externalProductId: String(row[mapping.id] || row[mapping.sku]),
            name: row[mapping.name],
            mrp: Number(row[mapping.mrp] || 0),
            sellingPrice: Number(row[mapping.price] || 0),
            quantity: Number(row[mapping.stock] || 0),
            sku: String(row[mapping.sku]),
            barcode: String(row[mapping.barcode] || ''),
            isActive: true
        }));
    }
}
