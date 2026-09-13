const mongoose = require('mongoose');

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment Income',
  'Dividends',
  'Interest/Profit',
  'Rental Income',
  'Bonus',
  'Other',
];

const IncomeSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: INCOME_CATEGORIES },
    source: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true, default: '' },
    recurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null,
    },
  },
  { timestamps: true }
);

IncomeSchema.index({ date: -1 });
IncomeSchema.index({ category: 1 });

IncomeSchema.statics.CATEGORIES = INCOME_CATEGORIES;

module.exports = mongoose.model('Income', IncomeSchema);
