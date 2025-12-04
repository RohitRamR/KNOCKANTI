import { BillingConnector } from '../connectors/BillingConnector';
import { ApiClient } from '../api';

export class CommandService {
    private connector: BillingConnector;
    private api: ApiClient;

    constructor(connector: BillingConnector, api: ApiClient) {
        this.connector = connector;
        this.api = api;
    }

    async poll() {
        try {
            const commands = await this.api.pullCommands();
            for (const cmd of commands) {
                console.log('Processing command:', cmd);
                // Process command (e.g., stock update)
                // await this.connector.applyStockUpdate(...)
                // await this.api.ackCommand(...)
            }
        } catch (error) {
            console.error('Polling failed:', error);
        }
    }
}
