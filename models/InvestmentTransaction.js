const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['buy', 'sell', 'dividend', 'deposit'];

const InvestmentTransactionSchema = new mongoose.Schema(
  {
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true },
    type: { type: String, required: true, enum: TRANSACTION_TYPES },
    quantity: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    fees: { type: Number, default: 0, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    // For dividend transactions: dividend paid per share.
    dividendPerShare: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

InvestmentTransactionSchema.index({ investment: 1, date: -1 });
InvestmentTransactionSchema.index({ type: 1 });

InvestmentTransactionSchema.statics.TYPES = TRANSACTION_TYPES;

module.exports = mongoose.model('InvestmentTransaction', InvestmentTransactionSchema);
