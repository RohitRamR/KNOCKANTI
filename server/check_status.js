const mongoose = require('mongoose');
const Product = require('./src/models/Product');

require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const products = await Product.find({}, 'name imageStatus imageUrl');
        console.log('Product Statuses:');
        products.forEach(p => {
            console.log(`${p.name}: ${p.imageStatus} (${p.imageUrl})`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
