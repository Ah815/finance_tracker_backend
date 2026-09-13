/**
 * Reusable financial calculation helpers.
 *
 * Money is stored as JS Numbers (not integer paisa) for simplicity, but
 * every function that produces a monetary value routes through
 * roundMoney() to keep floating-point drift from accumulating across
 * repeated add/subtract operations (spec section 32).
 */

function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

function savingsRate(income, savings) {
  return roundMoney(safeDivide(savings, income) * 100, 2);
}

function investmentRate(income, invested) {
  return roundMoney(safeDivide(invested, income) * 100, 2);
}

function netWorth(totalAssets, totalLiabilities) {
  return roundMoney(totalAssets - totalLiabilities);
}

function percentChange(previous, current) {
  if (!previous) return current ? 100 : 0;
  return roundMoney(safeDivide(current - previous, Math.abs(previous)) * 100, 2);
}

function emergencyFundCoverage(emergencyFundAmount, avgMonthlyEssentialExpenses) {
  if (!avgMonthlyEssentialExpenses) return 0;
  return roundMoney(emergencyFundAmount / avgMonthlyEssentialExpenses, 1);
}

/** Weighted-average buy price after adding `qty` more units at `price`, incl. fees/taxes rolled into cost basis. */
function weightedAverageBuyPrice(prevQty, prevAvgPrice, addQty, addPrice, addCosts = 0) {
  const prevCost = prevQty * prevAvgPrice;
  const newCost = addQty * addPrice + addCosts;
  const totalQty = prevQty + addQty;
  if (!totalQty) return 0;
  return roundMoney((prevCost + newCost) / totalQty, 4);
}

function returnPercent(totalInvested, currentValue) {
  return roundMoney(safeDivide(currentValue - totalInvested, totalInvested) * 100, 2);
}

module.exports = {
  roundMoney,
  safeDivide,
  savingsRate,
  investmentRate,
  netWorth,
  percentChange,
  emergencyFundCoverage,
  weightedAverageBuyPrice,
  returnPercent,
};
