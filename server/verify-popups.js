const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

const socket = io(SOCKET_URL);

const runVerification = async () => {
    try {
        console.log('Starting Verification...');

        // Helper to register if login fails
        const getAuthToken = async (role, email, name) => {
            try {
                const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123' });
                return { token: loginRes.data.accessToken, id: loginRes.data._id };
            } catch (e) {
                console.log(`Login failed for ${role}, registering...`);
                const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                    name, email, password: 'password123', phone: Math.floor(Math.random() * 10000000000).toString(), role,
                    storeName: role === 'RETAILER' ? 'Test Store' : undefined,
                    address: 'Test Address'
                });
                return { token: regRes.data.accessToken, id: regRes.data._id };
            }
        };

        // 1. Get Retailer
        const retailer = await getAuthToken('RETAILER', 'retailer_popup@test.com', 'Popup Retailer');
        console.log('Retailer Authenticated:', retailer.id);

        // Fetch Retailer Profile to get the correct Retailer ID (not User ID)
        const profileRes = await axios.get(`${BASE_URL}/retailers/profile`, {
            headers: { Authorization: `Bearer ${retailer.token}` }
        });
        console.log('Profile Response:', profileRes.data);
        const retailerProfileId = profileRes.data._id;
        console.log('Retailer Profile ID:', retailerProfileId);

        // 2. Get Customer
        const customer = await getAuthToken('CUSTOMER', 'customer_popup@test.com', 'Popup Customer');
        console.log('Customer Authenticated:', customer.id);

        console.log('Listening for socket events...');
        socket.on('connect', () => console.log('Socket connected'));
        socket.on('newOrder', (data) => console.log('✅ RECEIVED: newOrder event', data));
        socket.on('deliveryRequest', (data) => console.log('✅ RECEIVED: deliveryRequest event', data));

        // 3. Create a Product for Retailer
        console.log('Creating Product...');
        const sku = 'TEST-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const barcode = 'BAR-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const productRes = await axios.post(`${BASE_URL}/retailers/products`, {
            name: 'Test Product', price: 100, stockQuantity: 10, category: 'Test', sku, barcode
        }, { headers: { Authorization: `Bearer ${retailer.token}` } });
        const productId = productRes.data._id;

        // 4. Place Order
        console.log('Placing Order...');
        const orderRes = await axios.post(`${BASE_URL}/customers/orders`, {
            items: [{ productId, quantity: 1 }],
            retailerId: retailerProfileId
        }, { headers: { Authorization: `Bearer ${customer.token}` } });

        const orderId = orderRes.data._id;
        console.log('Order Placed:', orderId);

        // Wait for newOrder event
        await new Promise(r => setTimeout(r, 2000));

        // 5. Get Delivery Partner
        const partner = await getAuthToken('DELIVERY_PARTNER', 'delivery_popup@test.com', 'Popup Delivery');
        console.log('Delivery Partner Authenticated:', partner.id);

        await axios.patch(`${BASE_URL}/delivery/status`, { isOnline: true }, {
            headers: { Authorization: `Bearer ${partner.token}` }
        });

        console.log('Accepting Order...');
        await axios.post(`${BASE_URL}/retailers/orders/${orderId}/accept`, {}, {
            headers: { Authorization: `Bearer ${retailer.token}` }
        });

        console.log('Assigning Delivery Partner...');
        await axios.post(`${BASE_URL}/retailers/orders/${orderId}/assign`, {
            deliveryPartnerId: partner.id
        }, {
            headers: { Authorization: `Bearer ${retailer.token}` }
        });

        // Wait for deliveryRequest event
        await new Promise(r => setTimeout(r, 2000));

        console.log('Verification Complete. Check logs for ✅ events.');
        socket.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error.response?.data || error.message);
        if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
        socket.disconnect();
        process.exit(1);
    }
};

runVerification();
