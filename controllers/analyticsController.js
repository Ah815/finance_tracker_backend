const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const NetWorthSnapshot = require('../models/NetWorthSnapshot');
const { lastNMonths } = require('../utils/date');
const { roundMoney } = require('../utils/calculations');
const { totalForMonth, expensesByCategory, buildInsights } = require('../services/analyticsService');

function parseRange(query) {
  const now = new Date();
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return { from, to };
}

// GET /api/analytics/expenses?months=6
async function getExpenseAnalytics(req, res) {
  const months = Math.min(24, Number(req.query.months) || 6);
  const series = await Promise.all(
    lastNMonths(months).map(async ({ month, year }) => ({
      month,
      year,
      label: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      total: await totalForMonth(Expense, month, year),
    }))
  );

  const now = new Date();
  const byCategory = await expensesByCategory(now.getMonth() + 1, now.getFullYear());
  const total = byCategory.reduce((s, c) => s + c.total, 0);
  const average = roundMoney(series.reduce((s, m) => s + m.total, 0) / (series.length || 1));

  res.json({
    trend: series,
    currentMonthByCategory: byCategory,
    averageMonthlyExpense: average,
    largestCategory: byCategory[0] || null,
    totalThisMonth: roundMoney(total),
  });
}

// GET /api/analytics/income?months=6
async function getIncomeAnalytics(req, res) {
  const months = Math.min(24, Number(req.query.months) || 6);
  const series = await Promise.all(
    lastNMonths(months).map(async ({ month, year }) => ({
      month,
      year,
      label: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      total: await totalForMonth(Income, month, year),
    }))
  );

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const byCategory = await Income.aggregate([
    { $match: { date: { $gte: from } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const average = roundMoney(series.reduce((s, m) => s + m.total, 0) / (series.length || 1));

  res.json({
    trend: series,
    currentMonthByCategory: byCategory.map((r) => ({ category: r._id, total: roundMoney(r.total) })),
    averageMonthlyIncome: average,
  });
}

// GET /api/analytics/net-worth
async function getNetWorthAnalytics(req, res) {
  const snapshots = await NetWorthSnapshot.find().sort({ date: 1 });
  const first = snapshots[0];
  const latest = snapshots[snapshots.length - 1];
  const growth = first && latest && first.netWorth
    ? roundMoney(((latest.netWorth - first.netWorth) / Math.abs(first.netWorth)) * 100, 2)
    : 0;

  res.json({
    history: snapshots,
    growthSinceFirstSnapshot: growth,
    currentNetWorth: latest?.netWorth || 0,
  });
}

// GET /api/analytics/investments
async function getInvestmentAnalytics(req, res) {
  const investments = await Investment.find({ archived: false });
  const totalInvested = roundMoney(investments.reduce((s, i) => s + i.totalInvested, 0));
  const totalValue = roundMoney(investments.reduce((s, i) => s + i.currentValue, 0));
  const totalDividends = roundMoney(investments.reduce((s, i) => s + i.totalDividends, 0));
  const totalRealized = roundMoney(investments.reduce((s, i) => s + i.realizedGainLoss, 0));

  const allocation = {};
  investments.forEach((i) => {
    allocation[i.type] = roundMoney((allocation[i.type] || 0) + i.currentValue);
  });

  const ranked = [...investments].sort((a, b) => b.returnPercent - a.returnPercent);

  res.json({
    totalPortfolioValue: totalValue,
    totalInvested,
    totalProfitLoss: roundMoney(totalValue - totalInvested + totalRealized),
    unrealizedGainLoss: roundMoney(totalValue - totalInvested),
    realizedGainLoss: totalRealized,
    totalDividends,
    overallReturnPercent: totalInvested ? roundMoney(((totalValue - totalInvested) / totalInvested) * 100, 2) : 0,
    bestPerformer: ranked[0] || null,
    worstPerformer: ranked[ranked.length - 1] || null,
    allocation: Object.entries(allocation).map(([type, value]) => ({ type, value })),
    performance: investments.map((i) => ({
      name: i.name,
      symbol: i.symbol,
      profitLoss: roundMoney(i.currentValue - i.totalInvested),
      returnPercent: i.returnPercent,
    })),
  });
}

// GET /api/analytics/insights
async function getInsights(req, res) {
  const insights = await buildInsights();
  res.json({ insights });
}

module.exports = {
  getExpenseAnalytics,
  getIncomeAnalytics,
  getNetWorthAnalytics,
  getInvestmentAnalytics,
  getInsights,
  parseRange,
};
