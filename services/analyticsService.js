const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { startOfMonth, endOfMonth, lastNMonths } = require('../utils/date');
const { roundMoney, percentChange, safeDivide } = require('./../utils/calculations');

/** Sum of expenses grouped by category for a given month/year. */
async function expensesByCategory(month, year) {
  const from = startOfMonth(new Date(year, month - 1, 1));
  const to = endOfMonth(new Date(year, month - 1, 1));
  const rows = await Expense.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ category: r._id, total: roundMoney(r.total) }));
}

async function totalForMonth(Model, month, year) {
  const from = startOfMonth(new Date(year, month - 1, 1));
  const to = endOfMonth(new Date(year, month - 1, 1));
  const rows = await Model.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return roundMoney(rows[0]?.total || 0);
}

/**
 * Builds a handful of plain-language insights strictly from stored data —
 * no fabricated figures. Each insight is only included if the underlying
 * data actually supports a meaningful comparison (e.g. we skip the
 * "vs your average" insight if there isn't at least one prior month to
 * compare against).
 */
async function buildInsights(now = new Date()) {
  const insights = [];
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const priorMonths = lastNMonths(4, now).slice(0, 3); // 3 months before current

  // 1. Category spend this month vs its own trailing average
  const currentCategories = await expensesByCategory(month, year);
  if (currentCategories.length && priorMonths.length) {
    const top = currentCategories[0];
    const priorTotals = await Promise.all(
      priorMonths.map(async (m) => {
        const rows = await expensesByCategory(m.month, m.year);
        const match = rows.find((r) => r.category === top.category);
        return match ? match.total : 0;
      })
    );
    const validPriors = priorTotals.filter((t) => t > 0);
    if (validPriors.length) {
      const avg = roundMoney(validPriors.reduce((a, b) => a + b, 0) / validPriors.length);
      const change = percentChange(avg, top.total);
      if (Math.abs(change) >= 1) {
        const direction = change > 0 ? 'more' : 'less';
        insights.push(
          `You spent ${Math.abs(change)}% ${direction} on ${top.category} this month than your ${validPriors.length}-month average.`
        );
      }
    }
  }

  // 2. Category share of this month's total spend
  const totalExpense = currentCategories.reduce((sum, c) => sum + c.total, 0);
  if (totalExpense > 0 && currentCategories.length) {
    const biggest = currentCategories[0];
    const share = roundMoney(safeDivide(biggest.total, totalExpense) * 100, 0);
    insights.push(`${biggest.category} represents ${share}% of your spending this month.`);
  }

  // 3. Investment rate this month
  const monthlyIncome = await totalForMonth(Income, month, year);
  if (monthlyIncome > 0) {
    const investmentIncomeCategories = ['Investment Income', 'Dividends', 'Interest/Profit'];
    const investedThisMonth = currentCategories
      .filter((c) => ['Brokerage Fees', 'Investment Fees'].includes(c.category))
      .reduce((s, c) => s + c.total, 0);
    if (investedThisMonth > 0) {
      const rate = roundMoney(safeDivide(investedThisMonth, monthlyIncome) * 100, 0);
      insights.push(`You invested ${rate}% of your income this month (based on recorded investment-related transactions).`);
    }
    void investmentIncomeCategories; // reserved for a future income-mix insight
  }

  // 4. Most expensive month this year, if we have more than one month of data
  const monthsThisYear = Array.from({ length: month }, (_, i) => i + 1);
  if (monthsThisYear.length > 1) {
    const totals = await Promise.all(
      monthsThisYear.map(async (m) => ({ m, total: await totalForMonth(Expense, m, year) }))
    );
    const nonZero = totals.filter((t) => t.total > 0);
    if (nonZero.length > 1) {
      const worst = nonZero.reduce((a, b) => (b.total > a.total ? b : a));
      const monthName = new Date(year, worst.m - 1, 1).toLocaleString('en-US', { month: 'long' });
      insights.push(`${monthName} was your most expensive month this year, at PKR ${worst.total.toLocaleString('en-US')}.`);
    }
  }

  return insights;
}

module.exports = { expensesByCategory, totalForMonth, buildInsights };
