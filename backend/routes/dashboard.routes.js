const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/stats', authenticate, authorize('admin'), getStats);

module.exports = router;

