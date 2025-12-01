const Product = require('../models/Product');
const { generateImageSearchQuery, searchProductImages, pickBestImage } = require('../services/imageSearchService');

const fetchAndAttachProductImage = async (productId, io) => {
    console.log(`[Worker] Starting image fetch for Product ID: ${productId} `);

    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.error(`[Worker] Product not found: ${productId} `);
            return;
        }

        // 1. Generate Search Query
        const searchQuery = await generateImageSearchQuery(product);

        // 2. Search Images
        const results = await searchProductImages(searchQuery);

        // 3. Pick Best Image
        const bestImageUrl = pickBestImage(results, product);

        if (bestImageUrl) {
            product.imageUrl = bestImageUrl;
            product.imageStatus = 'fetched';
            product.imageSource = 'auto-search';

            // If the main images array is empty, add this one too
            if (!product.images || product.images.length === 0) {
                product.images = [bestImageUrl];
            }

            console.log(`[Worker] Successfully fetched image for ${product.name}: ${bestImageUrl} `);
        } else {
            product.imageStatus = 'failed';
            console.log(`[Worker] No suitable image found for ${product.name}`);
        }

        await product.save();

        if (io) {
            io.emit('productImageUpdate', {
                productId: product._id,
                imageUrl: product.imageUrl,
                imageStatus: product.imageStatus,
                retailerId: product.retailer
            });
        }

    } catch (error) {
        console.error(`[Worker] Error fetching image for ${productId}: `, error);
        // Update status to failed
        try {
            await Product.findByIdAndUpdate(productId, { imageStatus: 'failed' });
        } catch (e) {
            console.error('[Worker] Failed to update error status', e);
        }
    }
};

module.exports = {
    fetchAndAttachProductImage
};
