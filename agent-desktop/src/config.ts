import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'agent-config.json');

export interface AgentConfig {
    serverUrl: string;
    agentKey: string;
    connectorType: 'LOCAL_DB' | 'CSV' | 'ZOHO_BOOKS';
    connectorConfig: any;
}

export const loadConfig = (): AgentConfig | null => {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    return null;
};

export const saveConfig = (config: AgentConfig) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};
