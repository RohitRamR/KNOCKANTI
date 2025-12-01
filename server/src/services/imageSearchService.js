const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock LLM call - In production, replace with OpenAI/Anthropic API
// Mock LLM call - In production, replace with OpenAI/Anthropic API

// Smart Fallback Images (Unsplash)
const FALLBACK_IMAGES = {
    'tv': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    'television': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    'headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'macbook': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=800&q=80',
    'phone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'iphone': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    'samsung': 'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=800&q=80',
    'bread': 'https://images.unsplash.com/photo-1598373182133-52452f7691f6?w=800&q=80',
    'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80',
    'cheese': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80',
    'water': 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800&q=80',
    'soda': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80',
    'coke': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80',
    'chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80',
    'chips': 'https://images.unsplash.com/photo-1566478919030-41567d132720?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'
};

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock');

const generateImageSearchQuery = async (product) => {
    try {
        if (process.env.GEMINI_API_KEY) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Extract the core product name for image searching from: "${product.brand} ${product.name}". Remove size, color, specs. Output ONLY the clean name.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            console.log(`[Gemini] Cleaned name: "${text}"`);
            return text;
        }

        // Fallback regex
        const cleanName = `${product.brand || ''} ${product.name}`
            .replace(/\d+gb/gi, '')
            .replace(/\d+tb/gi, '')
            .replace(/black|white|gold|silver|grey|blue|red/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        return cleanName;
    } catch (error) {
        console.error('Error generating search query:', error);
        return product.name;
    }
};

const searchProductImages = async (query) => {
    try {
        console.log(`[ImageSearch] Searching for: "${query}"`);

        // 1. TRY REAL API IF KEYS EXIST
        if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX) {
            try {
                const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
                    params: {
                        key: process.env.GOOGLE_API_KEY,
                        cx: process.env.GOOGLE_CX,
                        q: query,
                        searchType: 'image',
                        num: 3
                    }
                });

                if (res.data.items && res.data.items.length > 0) {
                    return res.data.items.map(item => ({
                        contentUrl: item.link,
                        hostPageUrl: item.image.contextLink,
                        name: item.title,
                        hostPageDomainFriendlyName: item.displayLink
                    }));
                }
            } catch (apiError) {
                console.error('[ImageSearch] Real API failed, falling back to smart mock:', apiError.message);
            }
        }

        // 2. GEMINI SMART CATEGORIZATION FALLBACK
        let bestMatch = FALLBACK_IMAGES['default'];

        if (process.env.GEMINI_API_KEY) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const categories = Object.keys(FALLBACK_IMAGES).join(', ');
                const prompt = `Categorize the product "${query}" into exactly ONE of these categories: [${categories}]. If none match well, output 'default'. Output ONLY the category word.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const category = response.text().trim().toLowerCase();

                console.log(`[Gemini] Categorized "${query}" as: "${category}"`);

                if (FALLBACK_IMAGES[category]) {
                    bestMatch = FALLBACK_IMAGES[category];
                }
            } catch (err) {
                console.error('[Gemini] Categorization failed:', err);
                // Fallback to keyword matching if Gemini fails
                const lowerQuery = query.toLowerCase();
                for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
                    if (lowerQuery.includes(key)) {
                        bestMatch = url;
                        break;
                    }
                }
            }
        } else {
            // Simple keyword matching fallback
            const lowerQuery = query.toLowerCase();
            for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
                if (lowerQuery.includes(key)) {
                    bestMatch = url;
                    break;
                }
            }
        }

        return [{
            contentUrl: bestMatch,
            hostPageUrl: 'https://unsplash.com',
            name: query,
            hostPageDomainFriendlyName: 'SmartMock'
        }];

    } catch (error) {
        console.error('Error searching images:', error);
        return [];
    }
};

const pickBestImage = (results, product) => {
    if (!results || results.length === 0) return null;

    // 1. Prefer official brand domain (only works with real API results)
    const brand = (product.brand || '').toLowerCase();
    if (brand) {
        const officialImage = results.find(r =>
            r.hostPageDomainFriendlyName &&
            r.hostPageDomainFriendlyName.toLowerCase().includes(brand)
        );

        if (officialImage) {
            console.log('[AI] Picked official brand image');
            return officialImage.contentUrl;
        }
    }

    // Default: pick the first one
    return results[0].contentUrl;
};

module.exports = {
    generateImageSearchQuery,
    searchProductImages,
    pickBestImage
};
