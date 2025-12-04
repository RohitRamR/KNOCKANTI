const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const controller = require('../controllers/smartSyncAgentController');

// Agent Authentication Middleware
const authenticateAgent = controller.authenticateAgent;

// Retailer Facing Routes (Protected by User Auth)
router.post('/agents/register', protect, controller.registerAgent);
router.patch('/agents/:id/permissions', protect, controller.updatePermissions);
router.get('/agents', protect, controller.getAgents);

// Agent Facing Routes (Protected by Agent Key)
router.post('/agents/heartbeat', authenticateAgent, controller.heartbeat);
router.post('/inventory/upload', authenticateAgent, controller.uploadInventory);
router.post('/inventory/offline-sale', authenticateAgent, controller.reportOfflineSale);
router.post('/commands/pull', authenticateAgent, controller.pullCommands);
router.post('/commands/ack', authenticateAgent, controller.ackCommand);

module.exports = router;
