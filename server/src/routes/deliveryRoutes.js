const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getAssignedOrders,
    updateOrderStatus,
    updateOnlineStatus,
    updateLocation,
    acceptDelivery,
    declineDelivery
} = require('../controllers/deliveryController');

router.use(protect);
router.use(authorize('DELIVERY_PARTNER'));

router.get('/orders/assigned', getAssignedOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/accept', acceptDelivery);
router.post('/orders/:id/decline', declineDelivery);
router.patch('/status', updateOnlineStatus);
router.patch('/location', updateLocation);

module.exports = router;
