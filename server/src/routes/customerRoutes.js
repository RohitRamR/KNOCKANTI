const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getCustomerProducts,
    placeOrder,
    getMyOrders,
    fetchAndSaveProductImage,
    addAddress,
    getAddresses,
    deleteAddress
} = require('../controllers/customerController');
const { downloadInvoice } = require('../controllers/invoiceController');

// Public routes
router.get('/products', getCustomerProducts);
router.put('/products/:id/ai-image', fetchAndSaveProductImage);

// Protected routes
router.use(protect);
router.use(authorize('CUSTOMER'));

router.post('/orders', placeOrder);
router.get('/orders', getMyOrders);

router.post('/addresses', addAddress);
router.get('/addresses', getAddresses);
router.delete('/addresses/:id', deleteAddress);
router.get('/invoices/:orderId', downloadInvoice);

module.exports = router;
