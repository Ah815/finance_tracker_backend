const { Asset, Liability } = require('../models/AssetLiability');
const Investment = require('../models/Investment');
const NetWorthSnapshot = require('../models/NetWorthSnapshot');
const { roundMoney, netWorth: computeNetWorth } = require('../utils/calculations');

/** Computes current net worth from live data (assets + investment values - liabilities). */
async function computeCurrentNetWorth() {
  const [assets, investments, liabilities] = await Promise.all([
    Asset.find(),
    Investment.find({ archived: false }),
    Liability.find(),
  ]);

  const cash = assets
    .filter((a) => ['Cash', 'Bank Account'].includes(a.type))
    .reduce((s, a) => s + a.value, 0);
  const otherAssets = assets
    .filter((a) => !['Cash', 'Bank Account'].includes(a.type))
    .reduce((s, a) => s + a.value, 0);
  const investmentsTotal = investments.reduce((s, i) => s + i.currentValue, 0);
  const liabilitiesTotal = liabilities.reduce((s, l) => s + l.amount, 0);

  const totalAssets = roundMoney(cash + otherAssets + investmentsTotal);
  const totalLiabilities = roundMoney(liabilitiesTotal);

  return {
    totalAssets,
    totalLiabilities,
    netWorth: computeNetWorth(totalAssets, totalLiabilities),
    breakdown: {
      cash: roundMoney(cash),
      investments: roundMoney(investmentsTotal),
      otherAssets: roundMoney(otherAssets),
      liabilities: roundMoney(liabilitiesTotal),
    },
  };
}

// GET /api/net-worth/current
async function getCurrent(req, res) {
  const result = await computeCurrentNetWorth();
  res.json(result);
}

// GET /api/net-worth/history?range=daily|weekly|monthly|yearly&limit=
async function getHistory(req, res) {
  const limit = Math.min(500, Number(req.query.limit) || 90);
  const snapshots = await NetWorthSnapshot.find().sort({ date: -1 }).limit(limit);
  res.json(snapshots.reverse());
}

/** Plain function (no req/res) so both the HTTP handler and the cron job can call it. */
async function createSnapshotNow() {
  const current = await computeCurrentNetWorth();
  return NetWorthSnapshot.create({ date: new Date(), ...current });
}

// POST /api/net-worth/snapshot — records today's net worth for the history chart
async function recordSnapshot(req, res) {
  const snapshot = await createSnapshotNow();
  res.status(201).json(snapshot);
}

module.exports = { computeCurrentNetWorth, getCurrent, getHistory, recordSnapshot, createSnapshotNow };
