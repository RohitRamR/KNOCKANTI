const axios = require('axios');

const testLogin = async () => {
    try {
        const res = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'retailer@knockanti.com',
            password: 'password123'
        });
        console.log('Login successful:', res.data);
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
    }
};

testLogin();
