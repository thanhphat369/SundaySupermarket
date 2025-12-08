const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);

module.exports = router;

