const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getAllUsers,
    updateUserStatus,
    getPendingRetailers,
    approveRetailer,
    getStats,
} = require('../controllers/adminController');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/retailers/pending', getPendingRetailers);
router.post('/retailers/:id/approve', approveRetailer);
router.get('/stats', getStats);
router.get('/orders', require('../controllers/adminController').getAllOrders);
router.get('/products', require('../controllers/adminController').getAllProducts);

module.exports = router;
