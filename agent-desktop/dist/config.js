"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveConfig = exports.loadConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_FILE = path_1.default.join(process.cwd(), 'agent-config.json');
const loadConfig = () => {
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs_1.default.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    return null;
};
exports.loadConfig = loadConfig;
const saveConfig = (config) => {
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};
exports.saveConfig = saveConfig;
