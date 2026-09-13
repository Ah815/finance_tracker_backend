const mongoose = require('mongoose');

const ASSET_TYPES = [
  'Cash', 'Bank Account', 'PSX Stocks', 'ETFs', 'Mutual Funds', 'National Savings',
  'T-Bills', 'Sukuk', 'Gold', 'Cryptocurrency', 'Property', 'Vehicle', 'Other',
];

const LIABILITY_TYPES = [
  'Credit Card', 'Personal Loan', 'Car Financing', 'Family Loan', 'Other Debt',
];

// Manually-tracked assets that are NOT already represented by an Investment
// document (e.g. a bank account balance, a car, a house). Investment
// holdings feed into net worth separately via their currentValue.
const AssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ASSET_TYPES },
    value: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const LiabilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: LIABILITY_TYPES },
    amount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

AssetSchema.statics.TYPES = ASSET_TYPES;
LiabilitySchema.statics.TYPES = LIABILITY_TYPES;

module.exports = {
  Asset: mongoose.model('Asset', AssetSchema),
  Liability: mongoose.model('Liability', LiabilitySchema),
};
