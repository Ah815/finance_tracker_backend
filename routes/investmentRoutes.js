const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/investmentController');

const router = express.Router();
router.use(protect);

router.get('/types', ctrl.getTypes);
router.get('/', asyncHandler(ctrl.getInvestments));
router.get('/:id', asyncHandler(ctrl.getInvestment));
router.post('/', asyncHandler(ctrl.createInvestment));
router.put('/:id', asyncHandler(ctrl.updateInvestment));
router.delete('/:id', asyncHandler(ctrl.deleteInvestment));

module.exports = router;
