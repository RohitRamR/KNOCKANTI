const axios = require('axios');

const verifyAdminIngest = async () => {
    try {
        const timestamp = Date.now();
        const email = `test_retailer_${timestamp}@knockanti.com`;
        const password = 'password123';

        console.log(`🔄 Registering new user: ${email}...`);
        try {
            await axios.post('http://localhost:5002/api/auth/register', {
                name: 'Test Admin',
                email: email,
                phone: `9${timestamp.toString().substring(4)}`, // Random phone
                password: password,
                role: 'ADMIN' // Admin is ACTIVE by default
            });
            console.log('✅ Registration Successful');
        } catch (regError) {
            console.log('ℹ️ Registration failed:', regError.response ? regError.response.data : regError.message);
        }

        console.log('🔄 Attempting Login...');
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: email,
            password: password
        });

        const token = loginRes.data.accessToken;
        console.log('✅ Login Successful');

        // 2. Send Payload with "ItemCode" keys
        const payload = [
            { "ItemCode": "SKU_ADMIN_TEST_1", "QOH": "50", "MRP": "19.99", "Description": "Admin Test Cola" },
            { "ItemCode": "SKU_ADMIN_TEST_2", "QOH": "120", "MRP": "15.50", "Description": "Admin Test Soda" }
        ];

        console.log('🔄 Sending Ingest Request...');
        const ingestRes = await axios.post('http://localhost:5002/api/smartsync/ingest', {
            payload,
            retailerId: '674b34460777130541295968' // Hardcoded ID from frontend
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Ingest Response:', ingestRes.data);

        if (ingestRes.data.stats.failed === 0) {
            console.log('🎉 SUCCESS: All items processed correctly!');
        } else {
            console.error('❌ FAILURE: Some items failed processing.');
            console.error(ingestRes.data);
        }

    } catch (error) {
        console.error('❌ Error Details:', error.message);
        if (error.response) {
            console.error('⚠️ Server Response Status:', error.response.status);
            console.error('⚠️ Server Response Data:', JSON.stringify(error.response.data));
        }
    }
};

verifyAdminIngest();
