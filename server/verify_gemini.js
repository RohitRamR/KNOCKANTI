const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const run = async () => {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Testing API Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);

    if (!key) {
        console.error('No GEMINI_API_KEY found in .env');
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(key);

    const testModel = async (modelName) => {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you working?");
            const response = await result.response;
            console.log(`[SUCCESS] ${modelName} responded: ${response.text().substring(0, 50)}...`);
            return true;
        } catch (error) {
            console.error(`[FAILED] ${modelName} error:`, error.message);
            if (error.message.includes('API_KEY_INVALID')) {
                console.error('CRITICAL: The API Key is invalid.');
            }
            return false;
        }
    };

    const flashWorking = await testModel('gemini-1.5-flash-latest');
    const proWorking = await testModel('gemini-pro');

    if (flashWorking || proWorking) {
        console.log('\nAt least one model is working!');
        process.exit(0);
    } else {
        console.error('\nAll models failed. Please check your API key.');
        process.exit(1);
    }
};

run();
