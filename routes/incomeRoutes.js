const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/incomeController');

const router = express.Router();
router.use(protect);

router.get('/categories', ctrl.getCategories);
router.get('/', asyncHandler(ctrl.getIncomes));
router.post('/', asyncHandler(ctrl.createIncome));
router.put('/:id', asyncHandler(ctrl.updateIncome));
router.delete('/:id', asyncHandler(ctrl.deleteIncome));

module.exports = router;
