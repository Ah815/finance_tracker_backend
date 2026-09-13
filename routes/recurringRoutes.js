const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/recurringController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(ctrl.getRecurring));
router.post('/', asyncHandler(ctrl.createRecurring));
router.put('/:id', asyncHandler(ctrl.updateRecurring));
router.delete('/:id', asyncHandler(ctrl.deleteRecurring));
router.post('/sync', asyncHandler(ctrl.sync));

module.exports = router;
