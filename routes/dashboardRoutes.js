const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect);

router.get('/summary', asyncHandler(ctrl.getSummary));

module.exports = router;
