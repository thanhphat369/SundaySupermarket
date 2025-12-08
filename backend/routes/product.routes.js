const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  cleanupUnusedImages,
} = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// Optional upload middleware
const optionalUpload = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    // Ignore errors if no files are uploaded
    if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next();
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

// Admin only routes
router.post('/', authenticate, authorize('admin'), upload.array('images', 5), createProduct);
router.put('/:id', authenticate, authorize('admin'), optionalUpload, updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);
router.post('/cleanup-images', authenticate, authorize('admin'), cleanupUnusedImages);

module.exports = router;

