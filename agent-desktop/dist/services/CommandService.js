"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandService = void 0;
class CommandService {
    constructor(connector, api) {
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
        }
        catch (error) {
            console.error('Polling failed:', error);
        }
    }
}
exports.CommandService = CommandService;
