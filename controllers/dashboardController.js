const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const { Asset } = require('../models/AssetLiability');
const { computeCurrentNetWorth } = require('./netWorthController');
const { startOfMonth, endOfMonth } = require('../utils/date');
const { roundMoney, savingsRate, investmentRate } = require('../utils/calculations');
const { totalForMonth } = require('../services/analyticsService');

// GET /api/dashboard/summary
async function getSummary(req, res) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const [
    netWorthData,
    monthlyIncome,
    monthlyExpenses,
    investments,
    cashAssets,
    recentExpenses,
    recentIncome,
  ] = await Promise.all([
    computeCurrentNetWorth(),
    totalForMonth(Income, month, year),
    totalForMonth(Expense, month, year),
    Investment.find({ archived: false }),
    Asset.find({ type: { $in: ['Cash', 'Bank Account'] } }),
    Expense.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).limit(5),
    Income.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).limit(5),
  ]);

  const totalCash = roundMoney(cashAssets.reduce((s, a) => s + a.value, 0));
  const totalInvestmentValue = roundMoney(investments.reduce((s, i) => s + i.currentValue, 0));
  const totalInvestedAmount = roundMoney(investments.reduce((s, i) => s + i.totalInvested, 0));
  const monthlySavings = roundMoney(monthlyIncome - monthlyExpenses);

  // "Investment" spend this month, for the investment-rate figure, is
  // approximated from investment transactions dated this month rather than
  // expense categories, since deposits into a portfolio aren't "expenses".
  const InvestmentTransaction = require('../models/InvestmentTransaction');
  const monthlyInvested = await InvestmentTransaction.aggregate([
    { $match: { date: { $gte: from, $lte: to }, type: { $in: ['buy', 'deposit'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]).then((rows) => roundMoney(rows[0]?.total || 0));

  res.json({
    totalBalance: roundMoney(totalCash + totalInvestmentValue),
    totalCash,
    totalSavings: totalCash, // cash assets double as "savings" absent a dedicated savings-account type
    totalInvestments: totalInvestmentValue,
    totalInvested: totalInvestedAmount,
    totalAssets: netWorthData.totalAssets,
    totalLiabilities: netWorthData.totalLiabilities,
    netWorth: netWorthData.netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    monthlyInvestment: monthlyInvested,
    savingsRate: savingsRate(monthlyIncome, monthlySavings),
    investmentRate: investmentRate(monthlyIncome, monthlyInvested),
    portfolioReturn:
      totalInvestedAmount > 0
        ? roundMoney(((totalInvestmentValue - totalInvestedAmount) / totalInvestedAmount) * 100, 2)
        : 0,
    netWorthBreakdown: netWorthData.breakdown,
    recentExpenses,
    recentIncome,
  });
}

module.exports = { getSummary };
