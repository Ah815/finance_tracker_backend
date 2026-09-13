const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { required, isPositiveNumber } = require('../utils/validators');
const { roundMoney } = require('../utils/calculations');
const { startOfMonth, endOfMonth } = require('../utils/date');

async function attachSpend(budgets) {
  return Promise.all(
    budgets.map(async (budget) => {
      const from = startOfMonth(new Date(budget.year, budget.month - 1, 1));
      const to = endOfMonth(new Date(budget.year, budget.month - 1, 1));
      const rows = await Expense.aggregate([
        { $match: { category: budget.category, date: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const spent = roundMoney(rows[0]?.total || 0);
      const remaining = roundMoney(budget.limit - spent);
      const percentUsed = budget.limit ? roundMoney((spent / budget.limit) * 100, 1) : 0;

      return {
        ...budget.toObject(),
        spent,
        remaining,
        percentUsed,
        status: spent > budget.limit ? 'Over Budget' : 'On Track',
        overBy: spent > budget.limit ? roundMoney(spent - budget.limit) : 0,
      };
    })
  );
}

// GET /api/budgets?month=&year=
async function getBudgets(req, res) {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();

  const budgets = await Budget.find({ month, year }).sort({ category: 1 });
  const withSpend = await attachSpend(budgets);
  res.json(withSpend);
}

// POST /api/budgets
async function createBudget(req, res) {
  required(['month', 'year', 'category', 'limit'], req.body);
  isPositiveNumber(req.body.limit, 'limit');

  const budget = await Budget.create(req.body);
  const [withSpend] = await attachSpend([budget]);
  res.status(201).json(withSpend);
}

// PUT /api/budgets/:id
async function updateBudget(req, res) {
  if (req.body.limit !== undefined) isPositiveNumber(req.body.limit, 'limit');

  const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!budget) return res.status(404).json({ message: 'Budget not found' });
  const [withSpend] = await attachSpend([budget]);
  res.json(withSpend);
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res) {
  const budget = await Budget.findByIdAndDelete(req.params.id);
  if (!budget) return res.status(404).json({ message: 'Budget not found' });
  res.json({ message: 'Budget deleted' });
}

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
