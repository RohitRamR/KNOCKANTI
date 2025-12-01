const Product = require('../models/Product');
const Order = require('../models/Order');
const RetailerProfile = require('../models/RetailerProfile');
const User = require('../models/User');

const { parse } = require('csv-parse/sync');
const { fetchAndAttachProductImage } = require('../workers/imageWorker');

// @desc    Migrate products from CSV
// @route   POST /api/retailers/migration/upload
// @access  Private/Retailer
const migrateProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        const fileContent = req.file.buffer.toString();
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const products = [];
        for (const record of records) {
            // Basic validation
            if (!record.name || !record.price) continue;

            products.push({
                retailer: req.user.retailerProfile,
                name: record.name,
                description: record.description || '',
                price: parseFloat(record.price),
                stockQuantity: parseInt(record.stockQuantity) || 0,
                category: record.category || 'Uncategorized',
                sku: record.sku || '',
                barcode: record.barcode || '',
                taxRate: parseFloat(record.taxRate) || 0,
                images: record.image ? [record.image] : []
            });
        }

        if (products.length > 0) {
            await Product.insertMany(products);
        }

        res.json({ message: `Successfully imported ${products.length} products` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during migration' });
    }
};

// @desc    Add a product
// @route   POST /api/retailers/products
// @access  Private/Retailer
const addProduct = async (req, res) => {
    try {
        const { name, brand, sku, barcode, price, stockQuantity, category, subCategory, taxRate } = req.body;

        // Handle Image Upload
        let images = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;
                images.push(dataURI);
            });
        }

        if (req.body.images) {
            const bodyImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            images = [...images, ...bodyImages];
        }

        // Check if product with same SKU/Barcode exists for this retailer
        const existingProduct = await Product.findOne({
            retailer: req.user.retailerProfile,
            $or: [{ sku }, { barcode }]
        });

        if (existingProduct) {
            return res.status(400).json({ message: 'Product with this SKU or Barcode already exists' });
        }

        const product = new Product({
            retailer: req.user.retailerProfile,
            name,
            brand,
            sku,
            barcode,
            price,
            stockQuantity,
            category,
            subCategory,
            taxRate,
            images: images,
            imageStatus: 'pending'
        });

        const savedProduct = await product.save();

        // Emit socket event
        const io = req.app.get('io');
        io.emit('productUpdate', { retailerId: req.user.retailerProfile });

        // Trigger async image fetch (Fire and forget)
        fetchAndAttachProductImage(savedProduct._id, io).catch(err => console.error('Async worker error:', err));

        res.status(201).json(savedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ... (getProducts remains same)

// ... (createBill remains same)

// ... (getSalesReport remains same)

// ... (deleteProduct remains same)



// @desc    Get all products
// @route   GET /api/retailers/products
// @access  Private/Retailer
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ retailer: req.user.retailerProfile })
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create new bill (POS Checkout)
// @route   POST /api/retailers/billing/checkout
// @access  Private/Retailer
const createBill = async (req, res) => {
    try {
        const { items, paymentMethod, customerId } = req.body; // items: [{ productId, quantity }]

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in bill' });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Validate items and calculate total
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }
            if (product.retailer.toString() !== req.user.retailerProfile.toString()) {
                return res.status(403).json({ message: 'Unauthorized product access' });
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

            // Update stock
            product.stockQuantity -= item.quantity;
            await product.save();
        }

        const order = new Order({
            retailer: req.user.retailerProfile,
            customer: customerId || null, // Optional
            items: orderItems,
            totalAmount,
            paymentMethod: paymentMethod || 'CASH_POS',
            status: 'DELIVERED', // POS orders are fulfilled immediately
            source: 'POS'
        });

        const savedOrder = await order.save();

        // Emit socket event
        const io = req.app.get('io');
        io.emit('stockUpdate', { retailerId: req.user.retailerProfile });

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get sales report
// @route   GET /api/retailers/reports/sales
// @access  Private/Retailer
const getSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({ retailer: req.user.retailerProfile })
            .sort({ createdAt: -1 });

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const totalOrders = orders.length;

        res.json({
            totalRevenue,
            totalOrders,
            orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/retailers/products/:id
// @access  Private/Retailer
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.retailer.toString() !== req.user.retailerProfile.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        await product.deleteOne();

        // Emit socket event
        const io = req.app.get('io');
        io.emit('productUpdate', { retailerId: req.user.retailerProfile });

        res.json({ message: 'Product removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a product
// @route   PUT /api/retailers/products/:id
// @access  Private/Retailer
const updateProduct = async (req, res) => {
    try {
        const { name, brand, sku, barcode, price, stockQuantity, category, subCategory, taxRate } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.retailer.toString() !== req.user.retailerProfile.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        // Handle Image Upload
        let newImages = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;
                newImages.push(dataURI);
            });
        }

        if (req.body.images) {
            const bodyImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            newImages = [...newImages, ...bodyImages];
        }

        // If we have new images, append or replace? Usually replace or append. 
        // Let's say if new images are provided, we add them.
        // If the user wants to delete, they would send the filtered list of old images in body.images.
        // So: product.images = newImages (which includes kept old images sent in body + new files)

        if (newImages.length > 0) {
            product.images = newImages;
        }

        product.name = name || product.name;
        product.brand = brand || product.brand;
        product.sku = sku || product.sku;
        product.barcode = barcode || product.barcode;
        product.price = price || product.price;
        product.stockQuantity = stockQuantity || product.stockQuantity;
        product.category = category || product.category;
        product.subCategory = subCategory || product.subCategory;
        product.taxRate = taxRate || product.taxRate;

        const updatedProduct = await product.save();

        // Emit socket event
        const io = req.app.get('io');
        io.emit('productUpdate', { retailerId: req.user.retailerProfile });

        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get retailer orders
// @route   GET /api/retailers/orders
// @access  Private/Retailer
const getRetailerOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { retailer: req.user.retailerProfile };
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('customer', 'name phone')
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get active delivery partners
// @route   GET /api/retailers/delivery-partners
// @access  Private/Retailer
const getDeliveryPartners = async (req, res) => {
    try {
        // In a real app, you might filter by location (radius search)
        // For now, return all active delivery partners
        // For now, return all active delivery partners
        const partners = await User.find({ role: 'DELIVERY_PARTNER', status: 'ACTIVE', isOnline: true })
            .select('name phone email');
        res.json(partners);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Assign delivery partner
// @route   POST /api/retailers/orders/:id/assign
// @access  Private/Retailer
const assignDeliveryPartner = async (req, res) => {
    try {
        const { deliveryPartnerId } = req.body;
        const order = await Order.findOne({ _id: req.params.id, retailer: req.user.retailerProfile });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'PLACED' && order.status !== 'ACCEPTED') {
            return res.status(400).json({ message: 'Order must be PLACED or ACCEPTED to assign delivery partner' });
        }

        order.deliveryPartner = deliveryPartnerId;
        order.status = 'ASSIGNED_WAITING'; // Waiting for partner to accept
        await order.save();

        // Notify delivery partner via socket
        const io = req.app.get('io');
        io.emit('deliveryRequest', {
            partnerId: deliveryPartnerId,
            orderId: order._id,
            pickupAddress: req.user.retailerProfile.address, // Assuming populated or available
            totalAmount: order.totalAmount
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get retailer profile
// @route   GET /api/retailers/profile
// @access  Private/Retailer
const getProfile = async (req, res) => {
    try {
        const profile = await RetailerProfile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        // Also get user phone
        const user = await User.findById(req.user._id);

        res.json({
            _id: profile._id,
            storeName: profile.storeName,
            address: profile.address,
            phone: user.phone,
            gstin: profile.gstin
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update retailer profile
// @route   PUT /api/retailers/profile
// @access  Private/Retailer
const updateProfile = async (req, res) => {
    try {
        const { storeName, phone, address } = req.body;

        const profile = await RetailerProfile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Update profile fields
        if (storeName) profile.storeName = storeName;
        if (address) {
            profile.address = {
                street: address.street,
                coordinates: address.coordinates
            };
        }
        await profile.save();

        // Update user phone if provided
        if (phone) {
            const user = await User.findById(req.user._id);
            user.phone = phone;
            await user.save();
        }

        res.json({
            storeName: profile.storeName,
            address: profile.address,
            phone: phone
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Accept an order
// @route   POST /api/retailers/orders/:id/accept
// @access  Private/Retailer
const acceptOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, retailer: req.user.retailerProfile });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'PLACED') {
            return res.status(400).json({ message: 'Order is not in PLACED status' });
        }

        order.status = 'ACCEPTED';
        await order.save();

        // Emit socket event
        const io = req.app.get('io');
        io.emit('orderStatusUpdate', { orderId: order._id, status: 'ACCEPTED', customerId: order.customer });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Decline an order
// @route   POST /api/retailers/orders/:id/decline
// @access  Private/Retailer
const declineOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, retailer: req.user.retailerProfile });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'PLACED') {
            return res.status(400).json({ message: 'Order is not in PLACED status' });
        }

        order.status = 'CANCELLED';
        await order.save();

        // Handle Refund Logic (Mock)
        if (order.paymentMethod === 'ONLINE') {
            console.log(`Initiating refund for Order #${order._id} Amount: ${order.totalAmount}`);
            // In a real app, call Payment Gateway Refund API here
        }

        // Emit socket event
        const io = req.app.get('io');
        io.emit('orderStatusUpdate', { orderId: order._id, status: 'CANCELLED', customerId: order.customer });

        res.json({ message: 'Order declined and refund initiated (if applicable)', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addProduct,
    getProducts,
    createBill,
    getSalesReport,
    deleteProduct,
    updateProduct,
    migrateProducts,
    getRetailerOrders,
    getDeliveryPartners,
    assignDeliveryPartner,
    getProfile,
    updateProfile,
    acceptOrder,
    declineOrder
};
