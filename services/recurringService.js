const RecurringTransaction = require('../models/RecurringTransaction');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { addByFrequency } = require('../utils/date');

/**
 * Finds every active recurring transaction whose nextDate has arrived,
 * materializes it as a real Income/Expense document, and rolls nextDate
 * forward. Safe to call repeatedly (e.g. on server boot, on a daily cron
 * tick, or from a "sync" button in the UI) — it only ever acts on
 * transactions that are actually due.
 */
async function generateDueTransactions(now = new Date()) {
  const due = await RecurringTransaction.find({ active: true, nextDate: { $lte: now } });
  const created = [];

  for (const rt of due) {
    // A recurring item might be many periods overdue (e.g. server was off) —
    // catch it up, generating one record per elapsed period, capped so a
    // long-dormant recurring item can't generate an unbounded backlog.
    let cursor = rt.nextDate;
    let guard = 0;
    while (cursor <= now && guard < 366) {
      const payload = {
        amount: rt.amount,
        category: rt.category,
        date: cursor,
        description: rt.description || `Recurring: ${rt.category}`,
        recurring: true,
        recurringFrequency: rt.frequency,
      };

      if (rt.transactionType === 'income') {
        created.push(await Income.create({ ...payload, source: rt.description || 'Recurring' }));
      } else {
        created.push(
          await Expense.create({ ...payload, paymentMethod: rt.paymentMethod || 'Bank Transfer' })
        );
      }

      cursor = addByFrequency(cursor, rt.frequency);
      guard += 1;
    }

    rt.nextDate = cursor;
    await rt.save();
  }

  return created;
}

module.exports = { generateDueTransactions };
