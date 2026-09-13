const test = require('node:test');
const assert = require('node:assert/strict');
const {
  roundMoney,
  savingsRate,
  investmentRate,
  netWorth,
  percentChange,
  emergencyFundCoverage,
  weightedAverageBuyPrice,
  returnPercent,
} = require('./calculations');

test('roundMoney avoids floating point drift', () => {
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(19.999), 20);
  assert.equal(roundMoney(1234.5678, 2), 1234.57);
});

test('savingsRate is savings / income * 100', () => {
  assert.equal(savingsRate(100000, 25000), 25);
  assert.equal(savingsRate(0, 25000), 0); // no divide-by-zero
});

test('investmentRate is invested / income * 100', () => {
  assert.equal(investmentRate(100000, 22000), 22);
});

test('netWorth is assets minus liabilities', () => {
  assert.equal(netWorth(1000000, 150000), 850000);
});

test('percentChange handles zero baseline without throwing', () => {
  assert.equal(percentChange(0, 500), 100);
  assert.equal(percentChange(0, 0), 0);
  assert.equal(percentChange(200, 250), 25);
});

test('emergencyFundCoverage returns months covered', () => {
  assert.equal(emergencyFundCoverage(300000, 60000), 5);
});

test('weightedAverageBuyPrice blends prior and new purchase', () => {
  // 100 shares @ 250, buy 50 more @ 280 -> (25000 + 14000) / 150
  const avg = weightedAverageBuyPrice(100, 250, 50, 280, 0);
  assert.equal(avg, roundMoney(39000 / 150, 4));
});

test('returnPercent compares current value to invested amount', () => {
  assert.equal(returnPercent(25000, 32000), 28);
});
