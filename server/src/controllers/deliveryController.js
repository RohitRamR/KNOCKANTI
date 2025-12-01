const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get assigned orders
// @route   GET /api/delivery/orders/assigned
// @access  Private/DeliveryPartner
const getAssignedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ deliveryPartner: req.user._id })
            .populate('retailer', 'storeName address phone')
            .populate('customer', 'name phone addresses')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PATCH /api/delivery/orders/:id/status
// @access  Private/DeliveryPartner
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: req.user._id });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Notify Retailer and Customer
        const io = req.app.get('io');
        io.emit('orderStatusUpdate', {
            orderId: order._id,
            status: status,
            retailerId: order.retailer,
            customerId: order.customer
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update online status
// @route   PATCH /api/delivery/status
// @access  Private/DeliveryPartner
const updateOnlineStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const user = await User.findById(req.user._id);
        user.isOnline = isOnline;
        await user.save();
        res.json({ isOnline: user.isOnline });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update location
// @route   PATCH /api/delivery/location
// @access  Private/DeliveryPartner
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const user = await User.findById(req.user._id);

        // Assuming user model has location field or we add it
        // For now, let's assume it's in `location` or similar.
        // If not schema defined, we might need to add it.
        // User schema usually has address or specific location field for delivery partners.
        // Let's assume `currentLocation` or similar.
        // Based on previous tasks, "Update User model with location field" was done.

        user.location = {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON format: [lng, lat]
        };

        await user.save();

        // Emit location update
        const io = req.app.get('io');
        io.emit('deliveryLocationUpdate', {
            partnerId: user._id,
            lat,
            lng
        });

        res.json({ message: 'Location updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Accept a delivery request
// @route   POST /api/delivery/orders/:id/accept
// @access  Private/DeliveryPartner
const acceptDelivery = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            deliveryPartner: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not assigned to you' });
        }

        if (order.status !== 'ASSIGNED_WAITING') {
            return res.status(400).json({ message: 'Order is not waiting for acceptance' });
        }

        order.status = 'CONFIRMED'; // Now it is confirmed
        await order.save();

        // Notify Retailer
        const io = req.app.get('io');
        io.emit('orderStatusUpdate', {
            orderId: order._id,
            status: 'CONFIRMED',
            retailerId: order.retailer
        });

        res.json({ message: 'Delivery accepted', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Decline a delivery request
// @route   POST /api/delivery/orders/:id/decline
// @access  Private/DeliveryPartner
const declineDelivery = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            deliveryPartner: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'ASSIGNED_WAITING') {
            return res.status(400).json({ message: 'Order is not waiting for acceptance' });
        }

        // Revert to ACCEPTED (so retailer can assign someone else)
        order.status = 'ACCEPTED';
        order.deliveryPartner = null; // Unassign
        await order.save();

        // Notify Retailer
        const io = req.app.get('io');
        io.emit('deliveryDeclined', {
            orderId: order._id,
            retailerId: order.retailer,
            partnerName: req.user.name
        });

        res.json({ message: 'Delivery declined' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAssignedOrders,
    updateOrderStatus,
    updateOnlineStatus,
    updateLocation,
    acceptDelivery,
    declineDelivery
};
