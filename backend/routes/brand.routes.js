const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brand.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), upload.single('logo'), createBrand);
router.put('/:id', authenticate, authorize('admin'), upload.single('logo'), updateBrand);
router.delete('/:id', authenticate, authorize('admin'), deleteBrand);

module.exports = router;

