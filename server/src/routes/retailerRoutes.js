const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    downloadInvoice
} = require('../controllers/invoiceController');

const {
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
} = require('../controllers/retailerController');

// All routes are protected and retailer only
router.use(protect);
router.use(authorize('RETAILER'));

const upload = require('../middlewares/uploadMiddleware'); // Added upload middleware import

router.post('/products', upload.array('images'), addProduct);
router.post('/migration/upload', upload.single('file'), migrateProducts); // Added migration route
router.get('/products', getProducts);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id', upload.array('images'), updateProduct);
router.post('/billing/checkout', createBill);
router.get('/reports/sales', getSalesReport);
router.get('/orders', getRetailerOrders);
router.get('/delivery-partners', getDeliveryPartners);
router.post('/orders/:id/assign', assignDeliveryPartner);
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/decline', declineOrder);
router.get('/invoices/:orderId', downloadInvoice);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
