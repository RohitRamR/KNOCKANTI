export interface ProductRecord {
    externalProductId: string;
    name: string;
    mrp?: number;
    sellingPrice: number;
    quantity: number;
    sku: string;
    barcode?: string;
    taxRate?: number;
    isActive?: boolean;
}

export interface StockChange {
    sku: string;
    qtyDelta: number;
}

export interface BillingConnector {
    connect(): Promise<void>;
    testConnection(): Promise<boolean>;
    fetchProducts(): Promise<ProductRecord[]>;
    fetchStockChanges(since: Date): Promise<StockChange[]>;
    applyStockUpdate(sku: string, newQuantity: number): Promise<boolean>;
    disconnect(): Promise<void>;
}
