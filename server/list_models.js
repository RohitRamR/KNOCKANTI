const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const run = async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.error('No key'); process.exit(1); }

    // We can't list models directly with the SDK easily in a simple script without setup, 
    // but we can try a raw fetch to the API endpoint to see what's up, 
    // or just try 'gemini-1.0-pro' which is another variant.

    // Actually, let's try a raw REST call to list models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('Error listing models:', data.error);
        } else {
            console.log('Available Models:');
            if (data.models) {
                data.models.slice(0, 20).forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
            } else {
                console.log('No models found in response');
            }
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
};

run();
