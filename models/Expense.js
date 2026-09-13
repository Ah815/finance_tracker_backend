const mongoose = require('mongoose');

// Pakistan-oriented expense categories (spec section 6). Custom categories
// are still allowed — see the `custom` flag — but these ship as defaults.
const EXPENSE_CATEGORIES = [
  // Household
  'Home Contribution', 'Rent', 'Electricity', 'Gas', 'Water', 'Internet', 'Maintenance',
  // Food
  'Groceries', 'Restaurants', 'Fast Food', 'Tea/Coffee', 'Delivery',
  // Transportation
  'Fuel', 'Ride-hailing', 'Public Transport', 'Car Maintenance', 'Bike Maintenance', 'Parking',
  // Personal
  'Clothing', 'Grooming', 'Entertainment', 'Shopping', 'Subscriptions',
  // Health
  'Medicine', 'Doctor', 'Gym', 'Supplements',
  // Education
  'Courses', 'Books', 'Certifications', 'Software/Tools',
  // Financial
  'Bank Fees', 'Brokerage Fees', 'Taxes', 'Investment Fees',
  // Other
  'Gifts', 'Charity', 'Miscellaneous',
];

const PAYMENT_METHODS = [
  'Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'Easypaisa', 'JazzCash', 'ATM', 'Other',
];

const ExpenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    customCategory: { type: Boolean, default: false },
    merchant: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, required: true, default: 'Cash' },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true, default: '' },
    recurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null,
    },
    receiptUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paymentMethod: 1 });

ExpenseSchema.statics.CATEGORIES = EXPENSE_CATEGORIES;
ExpenseSchema.statics.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = mongoose.model('Expense', ExpenseSchema);
