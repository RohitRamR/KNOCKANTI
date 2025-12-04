import axios from 'axios';
import { AgentConfig } from './config';

export class ApiClient {
    private config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    async register(retailerToken: string, agentName: string) {
        const response = await axios.post(`${this.config.serverUrl}/api/smartsync/agents/register`, {
            agentName
        }, {
            headers: { Authorization: `Bearer ${retailerToken}` }
        });
        return response.data;
    }

    async heartbeat() {
        await axios.post(`${this.config.serverUrl}/api/smartsync/agents/heartbeat`, {}, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }

    async uploadInventory(products: any[]) {
        await axios.post(`${this.config.serverUrl}/api/smartsync/inventory/upload`, {
            products
        }, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }

    async pullCommands() {
        const response = await axios.post(`${this.config.serverUrl}/api/smartsync/commands/pull`, {}, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
        return response.data.commands;
    }

    async ackCommand(commandId: string, status: string, message: string) {
        await axios.post(`${this.config.serverUrl}/api/smartsync/commands/ack`, {
            commandId, status, message
        }, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }
}
