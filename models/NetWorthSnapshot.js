const mongoose = require('mongoose');

const NetWorthSnapshotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    totalAssets: { type: Number, required: true, min: 0 },
    totalLiabilities: { type: Number, required: true, min: 0 },
    netWorth: { type: Number, required: true },
    breakdown: {
      cash: { type: Number, default: 0 },
      investments: { type: Number, default: 0 },
      otherAssets: { type: Number, default: 0 },
      liabilities: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

NetWorthSnapshotSchema.index({ date: -1 });

module.exports = mongoose.model('NetWorthSnapshot', NetWorthSnapshotSchema);
