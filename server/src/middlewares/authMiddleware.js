const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            req.user = await User.findById(decoded.id).select('-passwordHash');

            // Populate retailerProfile if it exists (for Retailers)
            if (req.user && req.user.role === 'RETAILER') {
                // We need to fetch the profile ID if it's not directly on the user object (it is referenced)
                // Assuming User model has retailerProfile field which is an ObjectId
                // Or we can query RetailerProfile model. Let's check User model first.
                // Actually, let's just populate it if it's a ref.
                // If it's not a ref in schema, we might need to findOne from RetailerProfile.
                // Let's assume it's a ref for now or just fetch it.
                // Safer to fetch from RetailerProfile model to be sure.
                const RetailerProfile = require('../models/RetailerProfile');
                const profile = await RetailerProfile.findOne({ user: req.user._id });
                if (profile) {
                    req.user.retailerProfile = profile._id;
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
