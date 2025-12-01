const express = require('express');
const router = express.Router();
const {
  getInventoryTransactions,
  createInventoryTransaction,
  getProductInventoryHistory,
} = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/', authenticate, authorize('admin'), getInventoryTransactions);
router.get('/product/:productId', authenticate, authorize('admin'), getProductInventoryHistory);
router.post('/', authenticate, authorize('admin'), createInventoryTransaction);

module.exports = router;

