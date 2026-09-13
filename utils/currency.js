/**
 * PKR currency formatting. Uses plain Western thousands-grouping
 * ("PKR 1,250,000") rather than South Asian lakh/crore grouping, to match
 * how the product's own spec writes its examples.
 */

function formatPKR(amount, { decimals = 0, showSymbol = true } = {}) {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return showSymbol ? `PKR ${formatted}` : formatted;
}

module.exports = { formatPKR };
