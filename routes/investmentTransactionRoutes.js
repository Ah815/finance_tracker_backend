const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/investmentTransactionController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(ctrl.getTransactions));
router.post('/', asyncHandler(ctrl.createTransaction));
router.delete('/:id', asyncHandler(ctrl.deleteTransaction));

module.exports = router;
