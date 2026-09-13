const Expense = require('../models/Expense');
const { required, isPositiveNumber, isValidDate } = require('../utils/validators');

// GET /api/expenses?category=&paymentMethod=&from=&to=&search=&page=&limit=
async function getExpenses(req, res) {
  const { category, paymentMethod, from, to, search, recurring, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (recurring !== undefined) filter.recurring = recurring === 'true';
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { merchant: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Expense.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
}

// POST /api/expenses
async function createExpense(req, res) {
  required(['amount', 'category', 'date'], req.body);
  isPositiveNumber(req.body.amount, 'amount');
  isValidDate(req.body.date, 'date');

  const expense = await Expense.create(req.body);
  res.status(201).json(expense);
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  if (req.body.amount !== undefined) isPositiveNumber(req.body.amount, 'amount');
  if (req.body.date !== undefined) isValidDate(req.body.date, 'date');

  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json(expense);
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
}

// GET /api/expenses/categories
function getCategories(req, res) {
  res.json(Expense.CATEGORIES);
}

// GET /api/expenses/payment-methods
function getPaymentMethods(req, res) {
  res.json(Expense.PAYMENT_METHODS);
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCategories,
  getPaymentMethods,
};
