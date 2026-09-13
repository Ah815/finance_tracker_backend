const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// One budget per category per month
BudgetSchema.index({ month: 1, year: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
