const axios = require('axios');
const Product = require('../models/Product');

// Search Logic with Brand Verification
const searchImage = async (query) => {
    try {
        const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);

        if (response.data && response.data.products && response.data.products.length > 0) {
            // Extract potential brand from query (first word)
            const queryBrand = query.split(' ')[0].toLowerCase();

            // Find a product that matches the brand
            const matchingProduct = response.data.products.find(p => {
                const hasImage = p.image_front_url || p.image_url;
                if (!hasImage) return false;

                // Check if result's brand includes our query brand
                const resultBrands = (p.brands || '').toLowerCase();
                return resultBrands.includes(queryBrand);
            });

            if (matchingProduct) {
                return matchingProduct.image_front_url || matchingProduct.image_url;
            }
            return null;
        }
        return null;
    } catch (err) {
        console.error('External API Error:', err.message);
        return null;
    }
};

const runBackfill = async (io) => {
    console.log('Running automated image backfill...');
    try {
        const products = await Product.find({
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } },
                { images: null }
            ]
        });

        if (products.length === 0) {
            console.log('No products missing images.');
            return;
        }

        console.log(`Found ${products.length} products without images.`);
        let updatedCount = 0;

        for (const product of products) {
            if (!product.name) continue;

            let imageUrl = await searchImage(product.name);

            if (!imageUrl) {
                // Strategy 2: Remove numbers and units
                const simplifiedName = product.name.replace(/\d+[a-zA-Z]+/g, '').replace(/\d+/g, '').trim();
                if (simplifiedName !== product.name && simplifiedName.length > 3) {
                    imageUrl = await searchImage(simplifiedName);
                }
            }

            if (!imageUrl) {
                // Strategy 3: First 2 words
                const firstTwoWords = product.name.split(' ').slice(0, 2).join(' ');
                if (firstTwoWords.length > 3 && firstTwoWords !== product.name) {
                    imageUrl = await searchImage(firstTwoWords);
                }
            }

            if (!imageUrl) {
                // Strategy 4: First word only
                const firstWord = product.name.split(' ')[0];
                if (firstWord.length > 3 && firstWord !== product.name) {
                    imageUrl = await searchImage(firstWord);
                }
            }

            if (imageUrl) {
                product.images = [imageUrl];
                await product.save();
                updatedCount++;
                console.log(`✓ Auto-filled image for ${product.name}`);

                // Emit socket event for real-time update
                if (io) {
                    io.emit('productUpdate', { retailerId: product.retailer });
                }
            }

            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Backfill complete. Updated ${updatedCount} products.`);

    } catch (error) {
        console.error('Auto-fill error:', error);
    }
};

const startAutoFiller = (io, intervalMs = 60000 * 60) => { // Default 1 hour
    // Run immediately on start
    runBackfill(io);

    // Schedule interval
    setInterval(() => {
        runBackfill(io);
    }, intervalMs);

    console.log(`Image Auto-Filler started with interval ${intervalMs}ms`);
};

module.exports = { startAutoFiller };
