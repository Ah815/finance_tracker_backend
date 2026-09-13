const RecurringTransaction = require('../models/RecurringTransaction');
const { required, isPositiveNumber, isOneOf } = require('../utils/validators');
const { generateDueTransactions } = require('../services/recurringService');

// GET /api/recurring?active=true
async function getRecurring(req, res) {
  const filter = {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  const items = await RecurringTransaction.find(filter).sort({ nextDate: 1 });
  res.json(items);
}

// POST /api/recurring
async function createRecurring(req, res) {
  required(['transactionType', 'amount', 'category', 'frequency', 'nextDate'], req.body);
  isPositiveNumber(req.body.amount, 'amount');
  isOneOf(req.body.transactionType, ['income', 'expense'], 'transactionType');
  isOneOf(req.body.frequency, ['daily', 'weekly', 'monthly', 'yearly'], 'frequency');

  const item = await RecurringTransaction.create(req.body);
  res.status(201).json(item);
}

// PUT /api/recurring/:id
async function updateRecurring(req, res) {
  const item = await RecurringTransaction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ message: 'Recurring transaction not found' });
  res.json(item);
}

// DELETE /api/recurring/:id
async function deleteRecurring(req, res) {
  const item = await RecurringTransaction.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Recurring transaction not found' });
  res.json({ message: 'Recurring transaction deleted' });
}

// POST /api/recurring/sync — generate any due transactions right now
async function sync(req, res) {
  const created = await generateDueTransactions();
  res.json({ message: `${created.length} transaction(s) generated`, created });
}

module.exports = { getRecurring, createRecurring, updateRecurring, deleteRecurring, sync };
