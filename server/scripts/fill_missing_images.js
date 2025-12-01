const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../src/models/Product');
const RetailerProfile = require('../src/models/RetailerProfile'); // Required for populating if needed, though not strictly for this script
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/knockknock');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const searchImage = async (query) => {
    try {
        const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);
        if (response.data && response.data.products && response.data.products.length > 0) {
            const product = response.data.products.find(p => p.image_front_url || p.image_url);
            return product ? (product.image_front_url || product.image_url) : null;
        }
        return null;
    } catch (error) {
        console.error(`Error searching for ${query}:`, error.message);
        return null;
    }
};

const fillImages = async () => {
    await connectDB();

    try {
        const products = await Product.find({
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } },
                { images: null }
            ]
        });

        console.log(`Found ${products.length} products without images.`);

        for (const product of products) {
            console.log('Processing product:', product._id, product.name);
            if (!product.name) {
                console.warn('Skipping product without name:', product._id);
                continue;
            }
            console.log(`Searching image for: ${product.name}...`);
            let imageUrl = await searchImage(product.name);

            if (!imageUrl) {
                // Try simplified query (remove numbers and units like 500g, 1kg, 20L)
                const simplifiedName = product.name.replace(/\d+[a-zA-Z]+/g, '').replace(/\d+/g, '').trim();
                if (simplifiedName !== product.name && simplifiedName.length > 3) {
                    console.log(`  > Retrying with simplified name: "${simplifiedName}"...`);
                    imageUrl = await searchImage(simplifiedName);
                }
            }

            if (imageUrl) {
                product.images = [imageUrl];
                await product.save();
                console.log(`✓ Updated ${product.name}`);
            } else {
                console.log(`✗ No image found for ${product.name}`);
            }

            // Be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Script Error:', error);
        process.exit(1);
    }
};

fillImages();
