const express = require('express');
const router = express.Router();
const {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
} = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/product/:productId', getProductReviews);

// Authenticated routes
router.get('/', getReviews);
router.get('/:id', getReviewById);
router.post('/', authenticate, upload.array('images', 3), createReview);
router.put('/:id', authenticate, upload.array('images', 3), updateReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;

