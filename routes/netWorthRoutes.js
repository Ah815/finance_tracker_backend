const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const netWorthCtrl = require('../controllers/netWorthController');
const alCtrl = require('../controllers/assetLiabilityController');

const router = express.Router();
router.use(protect);

router.get('/current', asyncHandler(netWorthCtrl.getCurrent));
router.get('/history', asyncHandler(netWorthCtrl.getHistory));
router.post('/snapshot', asyncHandler(netWorthCtrl.recordSnapshot));

router.get('/assets', asyncHandler(alCtrl.getAssets));
router.post('/assets', asyncHandler(alCtrl.createAsset));
router.put('/assets/:id', asyncHandler(alCtrl.updateAsset));
router.delete('/assets/:id', asyncHandler(alCtrl.deleteAsset));

router.get('/liabilities', asyncHandler(alCtrl.getLiabilities));
router.post('/liabilities', asyncHandler(alCtrl.createLiability));
router.put('/liabilities/:id', asyncHandler(alCtrl.updateLiability));
router.delete('/liabilities/:id', asyncHandler(alCtrl.deleteLiability));

module.exports = router;
