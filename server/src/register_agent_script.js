const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5002/api/smartsync';
const LOGIN_URL = 'http://localhost:5002/api/auth/login';
const CONFIG_PATH = path.join(__dirname, '../../agent-desktop/agent-config.json');

const registerAndConfigure = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(LOGIN_URL, {
            email: 'retailer@knockanti.com',
            password: 'password123'
        });
        const token = loginRes.data.accessToken;
        console.log('Logged in.');

        // 2. Register Agent
        console.log('Registering Agent...');
        const agentRes = await axios.post(`${API_URL}/agents/register`, {
            agentName: 'Desktop Agent (Auto-Configured)'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { agentKey, agentId } = agentRes.data;
        console.log('NEW_AGENT_KEY:' + agentKey);

        // 3. Update Config
        const config = {
            serverUrl: "http://localhost:5002",
            agentKey: agentKey,
            connectorType: "LOCAL_DB",
            connectorConfig: {
                type: "mysql",
                host: "localhost",
                user: "root",
                password: "",
                database: "test_db",
                queries: {
                    fetchProducts: "SELECT * FROM products",
                    updateStock: "UPDATE products SET stock = ? WHERE sku = ?"
                },
                fieldMapping: {
                    id: "id",
                    name: "name",
                    price: "price",
                    stock: "stock",
                    sku: "sku"
                }
            }
        };

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log('agent-config.json updated.');

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

registerAndConfigure();
