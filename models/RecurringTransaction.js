const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema(
  {
    transactionType: { type: String, required: true, enum: ['income', 'expense'] },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    nextDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecurringTransactionSchema.index({ active: 1, nextDate: 1 });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);
