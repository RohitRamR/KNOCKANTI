const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all products (Public/Customer)
// @route   GET /api/customers/products
// @access  Public
const getCustomerProducts = async (req, res) => {
    try {
        const { keyword, category, retailerId } = req.query;
        const query = {};

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (category) query.category = category;
        if (retailerId) query.retailer = retailerId;

        // Only show products with stock > 0
        query.stockQuantity = { $gt: 0 };

        const products = await Product.find(query)
            .populate('retailer', 'storeName address')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Place an order
// @route   POST /api/customers/orders
// @access  Private/Customer
const placeOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, retailerId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // Validate items and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }
            if (product.stockQuantity < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }

            const itemTotal = product.price * item.quantity;
            const tax = itemTotal * (product.taxRate / 100);
            totalAmount += itemTotal + tax;

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                tax: tax
            });

            // Reserve stock (decrement)
            product.stockQuantity -= item.quantity;
            await product.save();
        }

        const order = new Order({
            customer: req.user._id,
            retailer: retailerId, // Assuming all items from same retailer for MVP
            items: orderItems,
            totalAmount,
            status: 'PLACED',
            paymentMethod: 'COD', // Default for MVP
            deliveryAddress: deliveryAddress || { addressLine: 'Pickup / Unspecified' }, // Fallback
            source: 'APP'
        });

        const savedOrder = await order.save();

        // Emit socket event
        const io = req.app.get('io');
        console.log('Emitting newOrder event for retailer:', retailerId);
        io.emit('newOrder', {
            retailerId: retailerId,
            orderId: savedOrder._id,
            totalAmount: savedOrder.totalAmount,
            customerName: req.user.name
        });

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my orders
// @route   GET /api/customers/orders
// @access  Private/Customer
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('retailer', 'storeName')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const axios = require('axios');

// @desc    Fetch and save AI image for a product (On-demand)
// @route   PUT /api/customers/products/:id/ai-image
// @access  Public (or Protected, but allowing public for smoother UX for now)
const fetchAndSaveProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If already has image, return it
        if (product.images && product.images.length > 0) {
            return res.json({ image: product.images[0] });
        }

        console.log(`Fetching AI image for: ${product.name}`);

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

                    // If strict brand matching fails, maybe we shouldn't return anything if the user wants "only" brand pics.
                    // But for better UX, let's try to be slightly lenient but prioritize brand.
                    // If no brand match found, return null to respect "only use images taken by brand" request.
                    return null;
                }
                return null;
            } catch (err) {
                console.error('External API Error:', err.message);
                return null;
            }
        };

        let imageUrl = await searchImage(product.name);

        if (!imageUrl) {
            // Strategy 2: Remove numbers and units (e.g. "500g", "1kg")
            const simplifiedName = product.name.replace(/\d+[a-zA-Z]+/g, '').replace(/\d+/g, '').trim();
            if (simplifiedName !== product.name && simplifiedName.length > 3) {
                console.log(`Strategy 2: Searching for "${simplifiedName}"`);
                imageUrl = await searchImage(simplifiedName);
            }
        }

        if (!imageUrl) {
            // Strategy 3: First 2 words (e.g. "Amul Butter")
            const firstTwoWords = product.name.split(' ').slice(0, 2).join(' ');
            if (firstTwoWords.length > 3 && firstTwoWords !== product.name) {
                console.log(`Strategy 3: Searching for "${firstTwoWords}"`);
                imageUrl = await searchImage(firstTwoWords);
            }
        }

        if (!imageUrl) {
            // Strategy 4: First word only (e.g. "Maggi")
            const firstWord = product.name.split(' ')[0];
            if (firstWord.length > 3 && firstWord !== product.name) {
                console.log(`Strategy 4: Searching for "${firstWord}"`);
                imageUrl = await searchImage(firstWord);
            }
        }

        if (imageUrl) {
            product.images = [imageUrl];
            await product.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) io.emit('productUpdate', { retailerId: product.retailer });

            return res.json({ image: imageUrl });
        }

        return res.status(404).json({ message: 'No image found' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const User = require('../models/User');

// @desc    Add a new address
// @route   POST /api/customers/addresses
// @access  Private/Customer
const addAddress = async (req, res) => {
    try {
        const { label, addressLine, city, zip, lat, lng, isDefault } = req.body;

        const user = await User.findById(req.user._id);

        if (isDefault) {
            // Unset other defaults
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({
            label,
            addressLine,
            city,
            zip,
            lat,
            lng,
            isDefault: isDefault || user.addresses.length === 0 // First one is default
        });

        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all addresses
// @route   GET /api/customers/addresses
// @access  Private/Customer
const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.addresses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete an address
// @route   DELETE /api/customers/addresses/:id
// @access  Private/Customer
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        user.addresses = user.addresses.filter(
            (addr) => addr._id.toString() !== req.params.id
        );

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCustomerProducts,
    placeOrder,
    getMyOrders,
    fetchAndSaveProductImage,
    addAddress,
    getAddresses,
    deleteAddress
};
