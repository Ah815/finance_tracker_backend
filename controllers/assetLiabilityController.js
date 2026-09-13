const { Asset, Liability } = require('../models/AssetLiability');
const { required, isPositiveNumber } = require('../utils/validators');

// GET /api/net-worth/assets
async function getAssets(req, res) {
  const assets = await Asset.find().sort({ value: -1 });
  res.json(assets);
}

// POST /api/net-worth/assets
async function createAsset(req, res) {
  required(['name', 'type', 'value'], req.body);
  isPositiveNumber(req.body.value, 'value');
  const asset = await Asset.create(req.body);
  res.status(201).json(asset);
}

// PUT /api/net-worth/assets/:id
async function updateAsset(req, res) {
  if (req.body.value !== undefined) isPositiveNumber(req.body.value, 'value');
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json(asset);
}

// DELETE /api/net-worth/assets/:id
async function deleteAsset(req, res) {
  const asset = await Asset.findByIdAndDelete(req.params.id);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json({ message: 'Asset deleted' });
}

// GET /api/net-worth/liabilities
async function getLiabilities(req, res) {
  const liabilities = await Liability.find().sort({ amount: -1 });
  res.json(liabilities);
}

// POST /api/net-worth/liabilities
async function createLiability(req, res) {
  required(['name', 'type', 'amount'], req.body);
  isPositiveNumber(req.body.amount, 'amount');
  const liability = await Liability.create(req.body);
  res.status(201).json(liability);
}

// PUT /api/net-worth/liabilities/:id
async function updateLiability(req, res) {
  if (req.body.amount !== undefined) isPositiveNumber(req.body.amount, 'amount');
  const liability = await Liability.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!liability) return res.status(404).json({ message: 'Liability not found' });
  res.json(liability);
}

// DELETE /api/net-worth/liabilities/:id
async function deleteLiability(req, res) {
  const liability = await Liability.findByIdAndDelete(req.params.id);
  if (!liability) return res.status(404).json({ message: 'Liability not found' });
  res.json({ message: 'Liability deleted' });
}

module.exports = {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
};
