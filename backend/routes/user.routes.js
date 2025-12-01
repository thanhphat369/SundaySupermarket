const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser, createUser } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/', authenticate, authorize('admin'), getUsers);
router.post('/', authenticate, authorize('admin'), createUser);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;

