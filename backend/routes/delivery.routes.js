const express = require('express');
const router = express.Router();
const {
  getDeliveryOrders,
  getDeliveryOrderById,
  updateDeliveryStatus,
  assignShipper,
} = require('../controllers/delivery.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Shipper routes
router.get('/my-deliveries', authenticate, authorize('shipper'), getDeliveryOrders);
router.get('/:id', authenticate, authorize('shipper'), getDeliveryOrderById);
router.put('/:id/status', authenticate, authorize('shipper'), updateDeliveryStatus);

// Admin routes
router.put('/:id/assign', authenticate, authorize('admin'), assignShipper);

module.exports = router;

