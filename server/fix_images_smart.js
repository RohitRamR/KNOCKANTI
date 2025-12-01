const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const { fetchAndAttachProductImage } = require('./src/workers/imageWorker');

require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products. Starting smart batch update...`);

        for (const product of products) {
            console.log(`Processing: ${product.name} (${product._id})`);
            await fetchAndAttachProductImage(product._id);
            await new Promise(resolve => setTimeout(resolve, 500)); // Slower for API rate limits
        }

        console.log('Smart batch update complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
