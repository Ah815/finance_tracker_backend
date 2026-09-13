const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.put('/password', protect, asyncHandler(ctrl.changePassword));
router.post('/forgot-password', authLimiter, asyncHandler(ctrl.forgotPassword));
router.post('/reset-password/:token', authLimiter, asyncHandler(ctrl.resetPassword));

module.exports = router;
