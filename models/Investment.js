const mongoose = require('mongoose');
const { roundMoney } = require('../utils/calculations');

const INVESTMENT_TYPES = [
  'PSX Stock',
  'PSX ETF',
  'Mutual Fund',
  'T-Bill',
  'Sukuk',
  'National Savings',
  'Gold',
  'Bank Savings / Term Deposit',
  'Cryptocurrency',
  'Real Estate',
  'Other',
];

// Types where "quantity x price" doesn't really apply (a National Savings
// certificate isn't bought in "shares"). For these, quantity stays 1 and
// currentPrice doubles as the current lump-sum value.
const UNIT_BASED_TYPES = ['PSX Stock', 'PSX ETF', 'Mutual Fund', 'Cryptocurrency', 'Gold'];

const InvestmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, trim: true, uppercase: true, default: '' },
    type: { type: String, required: true, enum: INVESTMENT_TYPES },
    institution: { type: String, trim: true, default: '' },
    currency: { type: String, default: 'PKR' },
    quantity: { type: Number, default: 0, min: 0 },
    averageBuyPrice: { type: Number, default: 0, min: 0 },
    currentPrice: { type: Number, default: 0, min: 0 },
    totalInvested: { type: Number, default: 0, min: 0 },
    currentValue: { type: Number, default: 0, min: 0 },
    realizedGainLoss: { type: Number, default: 0 },
    totalDividends: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: '' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InvestmentSchema.pre('save', function computeCurrentValue(next) {
  this.currentValue = roundMoney(this.quantity * this.currentPrice);
  next();
});

InvestmentSchema.virtual('unrealizedGainLoss').get(function unrealizedGainLoss() {
  return roundMoney(this.currentValue - this.totalInvested);
});

InvestmentSchema.virtual('returnPercent').get(function returnPercent() {
  if (!this.totalInvested) return 0;
  return roundMoney(((this.currentValue - this.totalInvested) / this.totalInvested) * 100, 2);
});

InvestmentSchema.set('toJSON', { virtuals: true });
InvestmentSchema.set('toObject', { virtuals: true });

InvestmentSchema.statics.TYPES = INVESTMENT_TYPES;
InvestmentSchema.statics.UNIT_BASED_TYPES = UNIT_BASED_TYPES;

module.exports = mongoose.model('Investment', InvestmentSchema);
