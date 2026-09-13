const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/expenses', asyncHandler(ctrl.getExpenseAnalytics));
router.get('/income', asyncHandler(ctrl.getIncomeAnalytics));
router.get('/net-worth', asyncHandler(ctrl.getNetWorthAnalytics));
router.get('/investments', asyncHandler(ctrl.getInvestmentAnalytics));
router.get('/insights', asyncHandler(ctrl.getInsights));

module.exports = router;
