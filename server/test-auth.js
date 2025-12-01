// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:5001/api/auth';

const testAuth = async () => {
    try {
        // 1. Register
        console.log('Testing Register...');
        const registerRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Admin',
                email: 'admin@test.com',
                phone: '1234567890',
                password: 'password123',
                role: 'ADMIN'
            })
        });
        const registerData = await registerRes.json();
        console.log('Register Response:', registerRes.status, registerData);

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginRes.status, loginData);

        if (loginData.accessToken) {
            console.log('\nAuth Test Passed!');
        } else {
            console.log('\nAuth Test Failed!');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
};

// Check if fetch is available (Node 18+)
if (!globalThis.fetch) {
    console.log("Node fetch not found, installing...");
    // Just a placeholder, assuming Node 18 or user runs with experimental-fetch
}

testAuth();
