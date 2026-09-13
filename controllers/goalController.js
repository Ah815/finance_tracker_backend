const Goal = require('../models/Goal');
const { required, isPositiveNumber } = require('../utils/validators');
const { roundMoney } = require('../utils/calculations');

// GET /api/goals?status=
async function getGoals(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const goals = await Goal.find(filter).sort({ priority: -1, targetDate: 1 });
  res.json(goals);
}

// POST /api/goals
async function createGoal(req, res) {
  required(['name', 'targetAmount'], req.body);
  isPositiveNumber(req.body.targetAmount, 'targetAmount');
  const goal = await Goal.create(req.body);
  res.status(201).json(goal);
}

// PUT /api/goals/:id
async function updateGoal(req, res) {
  if (req.body.targetAmount !== undefined) isPositiveNumber(req.body.targetAmount, 'targetAmount');
  if (req.body.currentAmount !== undefined) isPositiveNumber(req.body.currentAmount, 'currentAmount');

  const goal = await Goal.findById(req.params.id);
  if (!goal) return res.status(404).json({ message: 'Goal not found' });

  Object.assign(goal, req.body);
  if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
    goal.status = 'completed';
  }
  await goal.save();
  res.json(goal);
}

// POST /api/goals/:id/contribute — add a contribution amount to currentAmount
async function contribute(req, res) {
  required(['amount'], req.body);
  isPositiveNumber(req.body.amount, 'amount');

  const goal = await Goal.findById(req.params.id);
  if (!goal) return res.status(404).json({ message: 'Goal not found' });

  goal.currentAmount = roundMoney(goal.currentAmount + Number(req.body.amount));
  if (goal.currentAmount >= goal.targetAmount) {
    goal.currentAmount = goal.targetAmount;
    goal.status = 'completed';
  }
  await goal.save();
  res.json(goal);
}

// DELETE /api/goals/:id
async function deleteGoal(req, res) {
  const goal = await Goal.findByIdAndDelete(req.params.id);
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
}

module.exports = { getGoals, createGoal, updateGoal, contribute, deleteGoal };
