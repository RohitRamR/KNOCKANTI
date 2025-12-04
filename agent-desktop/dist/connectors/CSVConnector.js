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
exports.CSVConnector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv = require('csv-parser');
const XLSX = __importStar(require("xlsx"));
class CSVConnector {
    constructor(config) {
        this.config = config;
        this.watchedFolder = config.folderPath;
    }
    async connect() {
        if (this.config.filePath) {
            if (!fs.existsSync(this.config.filePath)) {
                throw new Error(`File not found: ${this.config.filePath}`);
            }
        }
        else if (this.watchedFolder) {
            if (!fs.existsSync(this.watchedFolder)) {
                throw new Error(`Folder not found: ${this.watchedFolder}`);
            }
        }
        else {
            throw new Error('Neither filePath nor folderPath specified in config');
        }
    }
    async testConnection() {
        if (this.config.filePath)
            return fs.existsSync(this.config.filePath);
        return fs.existsSync(this.watchedFolder);
    }
    async fetchProducts() {
        let filePath = this.config.filePath;
        if (!filePath && this.watchedFolder) {
            const files = fs.readdirSync(this.watchedFolder);
            const latestFile = files
                .filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'))
                .map(f => ({ name: f, time: fs.statSync(path.join(this.watchedFolder, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time)[0];
            if (!latestFile)
                return [];
            filePath = path.join(this.watchedFolder, latestFile.name);
        }
        if (!filePath)
            return [];
        const records = [];
        if (filePath.endsWith('.csv')) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => records.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });
        }
        else {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);
            records.push(...data);
        }
        return this.mapRecords(records);
    }
    async fetchStockChanges(since) {
        return []; // CSV is usually full sync only
    }
    async applyStockUpdate(sku, newQuantity) {
        console.warn('Write-back not supported for CSV connector');
        return false;
    }
    async disconnect() {
        // No-op
    }
    mapRecords(rows) {
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
exports.CSVConnector = CSVConnector;
