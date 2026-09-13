const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/budgetController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(ctrl.getBudgets));
router.post('/', asyncHandler(ctrl.createBudget));
router.put('/:id', asyncHandler(ctrl.updateBudget));
router.delete('/:id', asyncHandler(ctrl.deleteBudget));

module.exports = router;
