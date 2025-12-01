const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { handleExternalWebhook, handleFileImport } = require('../controllers/integrationController');

router.post('/external-billing/webhook', handleExternalWebhook);

// Protected route for manual import
router.post('/external-billing/import-file', protect, authorize('RETAILER'), handleFileImport);

// Public route for product search proxy
router.get('/product-search', require('../controllers/integrationController').searchProducts);

module.exports = router;
