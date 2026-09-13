const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/expenseController');

const router = express.Router();
router.use(protect);

router.get('/categories', ctrl.getCategories);
router.get('/payment-methods', ctrl.getPaymentMethods);
router.get('/', asyncHandler(ctrl.getExpenses));
router.post('/', asyncHandler(ctrl.createExpense));
router.put('/:id', asyncHandler(ctrl.updateExpense));
router.delete('/:id', asyncHandler(ctrl.deleteExpense));

module.exports = router;
