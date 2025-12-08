const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplier.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), createSupplier);
router.put('/:id', authenticate, authorize('admin'), updateSupplier);
router.delete('/:id', authenticate, authorize('admin'), deleteSupplier);

module.exports = router;
