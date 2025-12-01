const express = require('express');
const router = express.Router();
const smartSyncController = require('../controllers/smartSyncController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `sync-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists (Basic check, in real app do this at startup)
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

router.post('/configure', authMiddleware.protect, smartSyncController.configureProfile);
router.get('/profile', authMiddleware.protect, smartSyncController.getProfile);
router.post('/ingest', authMiddleware.protect, upload.single('file'), smartSyncController.ingestPayload);
router.get('/history', authMiddleware.protect, smartSyncController.getSyncHistory);
router.post('/webhook', smartSyncController.webhook); // Public endpoint protected by API Key

module.exports = router;
