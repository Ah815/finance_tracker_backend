/**
 * Development seed script. Wipes all collections and repopulates them with
 * realistic-looking but entirely FAKE Pakistan-oriented data, so the app
 * has something meaningful to look at right after setup.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const User = require('./models/User');
const Income = require('./models/Income');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
const Investment = require('./models/Investment');
const InvestmentTransaction = require('./models/InvestmentTransaction');
const Goal = require('./models/Goal');
const { Asset, Liability } = require('./models/AssetLiability');
const NetWorthSnapshot = require('./models/NetWorthSnapshot');
const RecurringTransaction = require('./models/RecurringTransaction');
const { roundMoney } = require('./utils/calculations');

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function monthsAgo(n, day = 1) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function seed() {
  await connectDB();
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    Income.deleteMany({}),
    Expense.deleteMany({}),
    Budget.deleteMany({}),
    Investment.deleteMany({}),
    InvestmentTransaction.deleteMany({}),
    Goal.deleteMany({}),
    Asset.deleteMany({}),
    Liability.deleteMany({}),
    NetWorthSnapshot.deleteMany({}),
    RecurringTransaction.deleteMany({}),
  ]);

  // --- Owner account -------------------------------------------------
  let owner = await User.findOne();
  if (!owner) {
    owner = await User.create({
      email: (process.env.ADMIN_EMAIL || 'owner@example.com').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      name: process.env.ADMIN_NAME || 'Owner',
    });
    console.log(`Created owner account: ${owner.email}`);
  } else {
    console.log(`Reusing existing owner account: ${owner.email}`);
  }

  // --- Income: 6 months of salary + occasional freelance/bonus -------
  const SALARY = 285000;
  const incomeDocs = [];
  for (let m = 5; m >= 0; m -= 1) {
    incomeDocs.push({
      amount: SALARY,
      category: 'Salary',
      source: 'Employer',
      date: monthsAgo(m, 1),
      description: 'Monthly salary',
      recurring: true,
      recurringFrequency: 'monthly',
    });
  }
  incomeDocs.push(
    { amount: 45000, category: 'Freelance', source: 'Side project', date: monthsAgo(3, 14), description: 'Freelance web project' },
    { amount: 60000, category: 'Bonus', source: 'Employer', date: monthsAgo(1, 28), description: 'Performance bonus' },
    { amount: 8500, category: 'Dividends', source: 'Mutual Fund', date: monthsAgo(2, 20), description: 'Dividend payout' }
  );
  await Income.insertMany(incomeDocs);

  // --- Expenses: 6 months across realistic categories -----------------
  const expenseTemplate = [
    { category: 'Rent', amount: 65000, paymentMethod: 'Bank Transfer', merchant: 'Landlord', day: 3 },
    { category: 'Electricity', amount: () => rand(9000, 18000), paymentMethod: 'JazzCash', merchant: 'K-Electric / LESCO', day: 10 },
    { category: 'Gas', amount: () => rand(2500, 7000), paymentMethod: 'Easypaisa', merchant: 'SSGC', day: 12 },
    { category: 'Water', amount: 1200, paymentMethod: 'Cash', merchant: 'Water Board', day: 12 },
    { category: 'Internet', amount: 4500, paymentMethod: 'Bank Transfer', merchant: 'StormFiber', day: 5 },
    { category: 'Groceries', amount: () => rand(22000, 32000), paymentMethod: 'Debit Card', merchant: 'Imtiaz Super Market', day: 8 },
    { category: 'Groceries', amount: () => rand(6000, 12000), paymentMethod: 'Cash', merchant: 'Local grocer', day: 22 },
    { category: 'Restaurants', amount: () => rand(3500, 9000), paymentMethod: 'Credit Card', merchant: 'Various', day: 18 },
    { category: 'Fast Food', amount: () => rand(1500, 4000), paymentMethod: 'JazzCash', merchant: 'Foodpanda', day: 24 },
    { category: 'Fuel', amount: () => rand(18000, 26000), paymentMethod: 'Debit Card', merchant: 'PSO', day: 6 },
    { category: 'Fuel', amount: () => rand(18000, 26000), paymentMethod: 'Debit Card', merchant: 'PSO', day: 20 },
    { category: 'Ride-hailing', amount: () => rand(2000, 5500), paymentMethod: 'Easypaisa', merchant: 'Careem', day: 15 },
    { category: 'Mobile/Internet', amount: 2500, paymentMethod: 'JazzCash', merchant: 'Jazz', day: 4 },
    { category: 'Subscriptions', amount: 2200, paymentMethod: 'Credit Card', merchant: 'Netflix + Spotify', day: 9 },
    { category: 'Gym', amount: 6000, paymentMethod: 'Bank Transfer', merchant: 'Gold\'s Gym', day: 2 },
    { category: 'Entertainment', amount: () => rand(2000, 7000), paymentMethod: 'Credit Card', merchant: 'Cinema / outings', day: 26 },
    { category: 'Medicine', amount: () => rand(800, 3500), paymentMethod: 'Cash', merchant: 'Pharmacy', day: 17 },
  ];

  const expenseDocs = [];
  for (let m = 5; m >= 0; m -= 1) {
    expenseTemplate.forEach((t) => {
      expenseDocs.push({
        amount: typeof t.amount === 'function' ? t.amount() : t.amount,
        category: t.category,
        merchant: t.merchant,
        paymentMethod: t.paymentMethod,
        date: monthsAgo(m, t.day),
        recurring: ['Rent', 'Internet', 'Gym', 'Mobile/Internet', 'Subscriptions'].includes(t.category),
        recurringFrequency: ['Rent', 'Internet', 'Gym', 'Mobile/Internet', 'Subscriptions'].includes(t.category)
          ? 'monthly'
          : null,
      });
    });
  }
  // A couple of one-off larger purchases so charts have some texture.
  expenseDocs.push(
    { amount: 32000, category: 'Clothing', merchant: 'Khaadi', paymentMethod: 'Credit Card', date: monthsAgo(4, 19) },
    { amount: 18500, category: 'Courses', merchant: 'Coursera', paymentMethod: 'Credit Card', date: monthsAgo(2, 11) },
    { amount: 15000, category: 'Gifts', merchant: 'Eid gift', paymentMethod: 'Cash', date: monthsAgo(1, 15) },
    { amount: 9000, category: 'Charity', merchant: 'Edhi Foundation', paymentMethod: 'Bank Transfer', date: monthsAgo(0, 5) }
  );
  await Expense.insertMany(expenseDocs);

  // --- Budgets: current month --------------------------------------
  const now = new Date();
  await Budget.insertMany([
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Groceries', limit: 35000 },
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Fuel', limit: 45000 },
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Gym', limit: 6000 },
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Entertainment', limit: 8000 },
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Restaurants', limit: 12000 },
    { month: now.getMonth() + 1, year: now.getFullYear(), category: 'Subscriptions', limit: 2500 },
  ]);

  // --- Investments + transactions -------------------------------------
  const ogdc = await Investment.create({
    name: 'Oil & Gas Development Company', symbol: 'OGDC', type: 'PSX Stock',
    institution: 'AKD Securities', currentPrice: 178,
  });
  const meezan = await Investment.create({
    name: 'Meezan Islamic Fund', type: 'Mutual Fund', institution: 'Al Meezan Investments', currentPrice: 1,
  });
  const sukuk = await Investment.create({
    name: 'GoP Ijarah Sukuk', type: 'Sukuk', institution: 'State Bank of Pakistan', currentPrice: 1,
  });
  const gold = await Investment.create({
    name: 'Physical Gold (tola)', type: 'Gold', institution: 'Personal locker', currentPrice: 285000,
  });
  const savings = await Investment.create({
    name: 'National Savings Certificate', type: 'National Savings', institution: 'CDNS', currentPrice: 1,
  });

  async function buy(investment, quantity, price, date, fees = 0) {
    const totalAmount = roundMoney(quantity * price + fees);
    const txn = await InvestmentTransaction.create({
      investment: investment._id, type: 'buy', quantity, price, fees, totalAmount, date,
    });
    investment.totalInvested = roundMoney(investment.totalInvested + quantity * price + fees);
    const newQty = roundMoney(investment.quantity + quantity, 6);
    investment.averageBuyPrice = roundMoney(
      (investment.averageBuyPrice * investment.quantity + quantity * price + fees) / newQty,
      4
    );
    investment.quantity = newQty;
    await investment.save();
    return txn;
  }

  await buy(ogdc, 150, 152, monthsAgo(5, 10), 350);
  await buy(ogdc, 50, 165, monthsAgo(2, 6), 150);
  await buy(meezan, 40000, 1, monthsAgo(4, 1));
  await buy(sukuk, 100000, 1, monthsAgo(5, 15));
  await buy(gold, 2, 255000, monthsAgo(4, 20), 1000);
  await buy(savings, 300000, 1, monthsAgo(5, 1));

  await InvestmentTransaction.create({
    investment: ogdc._id, type: 'dividend', dividendPerShare: 4.5, quantity: 150,
    totalAmount: 675, date: monthsAgo(1, 25), notes: 'Interim dividend',
  });
  ogdc.totalDividends = roundMoney(ogdc.totalDividends + 675);
  await ogdc.save();

  // --- Goals -----------------------------------------------------------
  await Goal.insertMany([
    { name: 'Emergency Fund', category: 'Emergency Fund', targetAmount: 600000, currentAmount: 300000, monthlyContribution: 25000, priority: 'high', targetDate: monthsAgo(-8) },
    { name: 'New Car', category: 'New Car', targetAmount: 1500000, currentAmount: 350000, monthlyContribution: 40000, priority: 'medium', targetDate: monthsAgo(-14) },
    { name: 'Umrah / Vacation', category: 'Vacation', targetAmount: 250000, currentAmount: 90000, monthlyContribution: 15000, priority: 'low', targetDate: monthsAgo(-6) },
  ]);

  // --- Assets & liabilities --------------------------------------------
  await Asset.insertMany([
    { name: 'Meezan Bank Current Account', type: 'Bank Account', value: 180000 },
    { name: 'Cash on hand', type: 'Cash', value: 25000 },
    { name: 'Honda Civic 2021', type: 'Vehicle', value: 7800000 },
  ]);
  await Liability.insertMany([
    { name: 'Meezan Credit Card', type: 'Credit Card', amount: 45000, interestRate: 0 },
    { name: 'Car financing (Meezan Auto)', type: 'Car Financing', amount: 1200000, interestRate: 8.5 },
  ]);

  // --- Net worth history (6 monthly snapshots trending upward) --------
  let base = 6250000;
  const snapshots = [];
  for (let m = 5; m >= 0; m -= 1) {
    base = roundMoney(base + rand(35000, 95000));
    const liabilities = roundMoney(1300000 - (5 - m) * 15000);
    snapshots.push({
      date: monthsAgo(m, 28),
      totalAssets: roundMoney(base + liabilities),
      totalLiabilities: liabilities,
      netWorth: base,
      breakdown: { cash: 205000, investments: roundMoney(base * 0.18), otherAssets: roundMoney(base * 0.7), liabilities },
    });
  }
  await NetWorthSnapshot.insertMany(snapshots);

  // --- Recurring transaction definitions -------------------------------
  const nextMonth1st = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await RecurringTransaction.insertMany([
    { transactionType: 'income', amount: SALARY, category: 'Salary', description: 'Monthly salary', frequency: 'monthly', nextDate: nextMonth1st },
    { transactionType: 'expense', amount: 65000, category: 'Rent', description: 'Monthly rent', paymentMethod: 'Bank Transfer', frequency: 'monthly', nextDate: nextMonth1st },
    { transactionType: 'expense', amount: 4500, category: 'Internet', description: 'StormFiber', paymentMethod: 'Bank Transfer', frequency: 'monthly', nextDate: nextMonth1st },
    { transactionType: 'expense', amount: 6000, category: 'Gym', description: "Gold's Gym membership", paymentMethod: 'Bank Transfer', frequency: 'monthly', nextDate: nextMonth1st },
  ]);

  console.log('\nSeed complete:');
  console.log(`  Income records:        ${incomeDocs.length}`);
  console.log(`  Expense records:       ${expenseDocs.length}`);
  console.log(`  Investments:           5 (OGDC, Meezan Islamic Fund, Sukuk, Gold, National Savings)`);
  console.log(`  Net worth snapshots:   ${snapshots.length}`);
  console.log(`  Login: ${owner.email} / the password set in ADMIN_PASSWORD (or your existing password if this account already existed)\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
