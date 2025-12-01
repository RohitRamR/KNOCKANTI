const User = require('../models/User');
const RetailerProfile = require('../models/RetailerProfile');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;

        const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user status (Block/Unblock)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get pending retailers
// @route   GET /api/admin/retailers/pending
// @access  Private/Admin
const getPendingRetailers = async (req, res) => {
    try {
        const users = await User.find({ role: 'RETAILER', status: 'PENDING_APPROVAL' })
            .select('-passwordHash')
            .populate('retailerProfile');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve retailer
// @route   POST /api/admin/retailers/:id/approve
// @access  Private/Admin
const approveRetailer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'RETAILER') {
            return res.status(404).json({ message: 'Retailer not found' });
        }

        user.status = 'ACTIVE';
        await user.save();

        res.json({ message: 'Retailer approved successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'CUSTOMER' });
        const activeRetailers = await User.countDocuments({ role: 'RETAILER', status: 'ACTIVE' });

        // Calculate orders today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: startOfDay }
        });

        // Calculate total revenue (sum of all orders)
        // Note: In a real app, this might be platform commission, but for now let's show GMV
        const revenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Calculate Revenue History (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const revenueHistory = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    status: { $ne: 'CANCELLED' } // Exclude cancelled orders
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const filledHistory = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = revenueHistory.find(r => r._id === dateStr);
            filledHistory.push({
                date: dateStr,
                revenue: found ? found.revenue : 0
            });
        }

        // Calculate Top Retailers
        const topRetailers = await Order.aggregate([
            {
                $match: { status: { $ne: 'CANCELLED' } }
            },
            {
                $group: {
                    _id: "$retailer",
                    totalSales: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "retailerprofiles", // Collection name is usually lowercase plural
                    localField: "_id",
                    foreignField: "_id",
                    as: "retailerInfo"
                }
            },
            {
                $unwind: "$retailerInfo"
            },
            {
                $project: {
                    _id: 1,
                    storeName: "$retailerInfo.storeName",
                    totalSales: 1,
                    orderCount: 1
                }
            }
        ]);

        console.log('Stats calculated:', { totalUsers, activeRetailers, ordersToday, totalRevenue });

        res.json({
            totalUsers,
            activeRetailers,
            ordersToday,
            totalRevenue,
            revenueHistory: filledHistory,
            topRetailers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all orders with pagination and filtering
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const query = {};

        if (status && status !== 'ALL') {
            query.status = status;
        }

        // Search by Order ID or Customer Name (if populated)
        // Note: Searching by customer name in a referenced collection is complex in simple queries.
        // For now, we'll search by Order ID if it matches ObjectId format
        if (search) {
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = search;
            }
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email phone')
            .populate('retailer', 'storeName')
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalOrders: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// @desc    Get all products with pagination and filtering
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, search, category } = req.query;
        const query = {};

        if (category && category !== 'ALL') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }



        const products = await Product.find(query)
            .populate('retailer', 'storeName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalProducts: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    updateUserStatus,
    getPendingRetailers,
    approveRetailer,
    getStats,
    getAllOrders,
    getAllProducts,
};
