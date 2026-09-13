const Income = require('../models/Income');
const { required, isPositiveNumber, isValidDate } = require('../utils/validators');

// GET /api/income?category=&from=&to=&search=&page=&limit=&recurring=
async function getIncomes(req, res) {
  const { category, from, to, search, recurring, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (recurring !== undefined) filter.recurring = recurring === 'true';
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { source: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Income.find(filter)
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Income.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
}

// POST /api/income
async function createIncome(req, res) {
  required(['amount', 'category', 'date'], req.body);
  isPositiveNumber(req.body.amount, 'amount');
  isValidDate(req.body.date, 'date');

  const income = await Income.create(req.body);
  res.status(201).json(income);
}

// PUT /api/income/:id
async function updateIncome(req, res) {
  if (req.body.amount !== undefined) isPositiveNumber(req.body.amount, 'amount');
  if (req.body.date !== undefined) isValidDate(req.body.date, 'date');

  const income = await Income.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!income) return res.status(404).json({ message: 'Income record not found' });
  res.json(income);
}

// DELETE /api/income/:id
async function deleteIncome(req, res) {
  const income = await Income.findByIdAndDelete(req.params.id);
  if (!income) return res.status(404).json({ message: 'Income record not found' });
  res.json({ message: 'Income record deleted' });
}

// GET /api/income/categories
function getCategories(req, res) {
  res.json(Income.CATEGORIES);
}

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome, getCategories };
