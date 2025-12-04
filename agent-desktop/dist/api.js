"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ApiClient {
    constructor(config) {
        this.config = config;
    }
    async register(retailerToken, agentName) {
        const response = await axios_1.default.post(`${this.config.serverUrl}/api/smartsync/agents/register`, {
            agentName
        }, {
            headers: { Authorization: `Bearer ${retailerToken}` }
        });
        return response.data;
    }
    async heartbeat() {
        await axios_1.default.post(`${this.config.serverUrl}/api/smartsync/agents/heartbeat`, {}, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }
    async uploadInventory(products) {
        await axios_1.default.post(`${this.config.serverUrl}/api/smartsync/inventory/upload`, {
            products
        }, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }
    async pullCommands() {
        const response = await axios_1.default.post(`${this.config.serverUrl}/api/smartsync/commands/pull`, {}, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
        return response.data.commands;
    }
    async ackCommand(commandId, status, message) {
        await axios_1.default.post(`${this.config.serverUrl}/api/smartsync/commands/ack`, {
            commandId, status, message
        }, {
            headers: { 'x-agent-key': this.config.agentKey }
        });
    }
}
exports.ApiClient = ApiClient;
