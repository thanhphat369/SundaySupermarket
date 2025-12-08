const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} = require('../controllers/purchaseorder.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/', authenticate, authorize('admin'), getPurchaseOrders);
router.get('/:id', authenticate, authorize('admin'), getPurchaseOrderById);
router.post('/', authenticate, authorize('admin'), createPurchaseOrder);
router.put('/:id', authenticate, authorize('admin'), updatePurchaseOrder);
router.delete('/:id', authenticate, authorize('admin'), deletePurchaseOrder);

module.exports = router;
