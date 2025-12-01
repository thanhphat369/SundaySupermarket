const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getMyOrders,
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Customer routes
router.get('/my-orders', authenticate, getMyOrders);
router.post('/', authenticate, createOrder);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/cancel', authenticate, cancelOrder);

// Admin routes
router.get('/', authenticate, authorize('admin'), getOrders);
router.put('/:id', authenticate, authorize('admin'), updateOrder);

module.exports = router;

