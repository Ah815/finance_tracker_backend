const Investment = require('../models/Investment');
const { required } = require('../utils/validators');

// GET /api/investments?type=&archived=
async function getInvestments(req, res) {
  const { type, archived } = req.query;
  const filter = {};
  if (type) filter.type = type;
  filter.archived = archived === 'true';

  const investments = await Investment.find(filter).sort({ currentValue: -1 });
  res.json(investments);
}

// GET /api/investments/:id
async function getInvestment(req, res) {
  const investment = await Investment.findById(req.params.id);
  if (!investment) return res.status(404).json({ message: 'Investment not found' });
  res.json(investment);
}

// POST /api/investments
async function createInvestment(req, res) {
  required(['name', 'type'], req.body);
  const investment = await Investment.create(req.body);
  res.status(201).json(investment);
}

// PUT /api/investments/:id
// Used for manual price updates (currentPrice) as well as editing metadata.
// Quantity / totalInvested / averageBuyPrice should normally move through
// investment-transactions instead, but direct edits are allowed for
// corrections.
async function updateInvestment(req, res) {
  const investment = await Investment.findById(req.params.id);
  if (!investment) return res.status(404).json({ message: 'Investment not found' });

  Object.assign(investment, req.body);
  await investment.save();
  res.json(investment);
}

// DELETE /api/investments/:id
async function deleteInvestment(req, res) {
  const investment = await Investment.findByIdAndDelete(req.params.id);
  if (!investment) return res.status(404).json({ message: 'Investment not found' });
  res.json({ message: 'Investment deleted' });
}

// GET /api/investments/types
function getTypes(req, res) {
  res.json({ types: Investment.TYPES, unitBasedTypes: Investment.UNIT_BASED_TYPES });
}

module.exports = {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getTypes,
};
