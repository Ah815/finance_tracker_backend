const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/goalController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(ctrl.getGoals));
router.post('/', asyncHandler(ctrl.createGoal));
router.put('/:id', asyncHandler(ctrl.updateGoal));
router.post('/:id/contribute', asyncHandler(ctrl.contribute));
router.delete('/:id', asyncHandler(ctrl.deleteGoal));

module.exports = router;
