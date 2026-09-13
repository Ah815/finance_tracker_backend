const InvestmentTransaction = require('../models/InvestmentTransaction');
const Investment = require('../models/Investment');
const { required, isOneOf, ValidationError } = require('../utils/validators');
const { roundMoney, weightedAverageBuyPrice } = require('../utils/calculations');

// GET /api/investment-transactions?investment=&type=&page=&limit=
async function getTransactions(req, res) {
  const { investment, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (investment) filter.investment = investment;
  if (type) filter.type = type;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    InvestmentTransaction.find(filter)
      .populate('investment', 'name symbol type')
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    InvestmentTransaction.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
}

/**
 * Applies a transaction's financial effect onto its parent Investment
 * document. This is the one place that mutates portfolio aggregates, so
 * every buy/sell/dividend/deposit stays consistent regardless of entry
 * point.
 */
function applyTransactionToInvestment(investment, txn) {
  const costs = roundMoney(txn.fees + txn.taxes);

  switch (txn.type) {
    case 'buy': {
      const newAvg = weightedAverageBuyPrice(
        investment.quantity,
        investment.averageBuyPrice,
        txn.quantity,
        txn.price,
        costs
      );
      investment.totalInvested = roundMoney(investment.totalInvested + txn.quantity * txn.price + costs);
      investment.quantity = roundMoney(investment.quantity + txn.quantity, 6);
      investment.averageBuyPrice = newAvg;
      if (!investment.currentPrice) investment.currentPrice = txn.price;
      break;
    }
    case 'sell': {
      if (txn.quantity > investment.quantity) {
        throw new ValidationError(
          `Cannot sell ${txn.quantity} units — only ${investment.quantity} are held. Short positions aren't supported.`
        );
      }
      const costBasis = roundMoney(investment.averageBuyPrice * txn.quantity);
      const proceeds = roundMoney(txn.quantity * txn.price - costs);
      const gain = roundMoney(proceeds - costBasis);

      investment.realizedGainLoss = roundMoney(investment.realizedGainLoss + gain);
      investment.quantity = roundMoney(investment.quantity - txn.quantity, 6);
      investment.totalInvested = roundMoney(investment.totalInvested - costBasis);
      if (investment.quantity <= 0) {
        investment.quantity = 0;
        investment.totalInvested = 0;
      }
      break;
    }
    case 'dividend': {
      const total = txn.totalAmount || roundMoney(txn.dividendPerShare * investment.quantity);
      investment.totalDividends = roundMoney(investment.totalDividends + total);
      break;
    }
    case 'deposit': {
      // For non-unit assets (National Savings, Term Deposits, etc.) a
      // deposit is a straight lump-sum addition: no share quantity/price.
      investment.totalInvested = roundMoney(investment.totalInvested + txn.totalAmount);
      investment.quantity = investment.quantity || 1;
      investment.currentPrice = roundMoney(
        investment.currentPrice
          ? investment.currentPrice + txn.totalAmount / investment.quantity
          : txn.totalAmount / investment.quantity
      );
      break;
    }
    default:
      throw new ValidationError(`Unknown transaction type: ${txn.type}`);
  }

  return investment;
}

function computeTotalAmount(body) {
  if (body.totalAmount !== undefined) return roundMoney(body.totalAmount);
  const quantity = Number(body.quantity) || 0;
  const price = Number(body.price) || 0;
  const fees = Number(body.fees) || 0;
  const taxes = Number(body.taxes) || 0;

  if (body.type === 'dividend') {
    return roundMoney((Number(body.dividendPerShare) || 0) * quantity || 0);
  }
  if (body.type === 'sell') {
    return roundMoney(quantity * price - fees - taxes);
  }
  return roundMoney(quantity * price + fees + taxes); // buy / deposit
}

// POST /api/investment-transactions
async function createTransaction(req, res) {
  required(['investment', 'type', 'date'], req.body);
  isOneOf(req.body.type, InvestmentTransaction.TYPES, 'type');

  const investment = await Investment.findById(req.body.investment);
  if (!investment) return res.status(404).json({ message: 'Investment not found' });

  const totalAmount = computeTotalAmount(req.body);

  const txn = await InvestmentTransaction.create({
    investment: investment._id,
    type: req.body.type,
    quantity: req.body.quantity || 0,
    price: req.body.price || 0,
    fees: req.body.fees || 0,
    taxes: req.body.taxes || 0,
    dividendPerShare: req.body.dividendPerShare || 0,
    totalAmount,
    date: req.body.date,
    notes: req.body.notes || '',
  });

  applyTransactionToInvestment(investment, txn);
  await investment.save();

  res.status(201).json({ transaction: txn, investment });
}

// DELETE /api/investment-transactions/:id
// Reverses the transaction's effect before deleting it, so the holding
// stays consistent with its remaining transaction history.
async function deleteTransaction(req, res) {
  const txn = await InvestmentTransaction.findById(req.params.id);
  if (!txn) return res.status(404).json({ message: 'Transaction not found' });

  const investment = await Investment.findById(txn.investment);
  if (investment) {
    const reversed = { ...txn.toObject() };
    reversed.type = { buy: 'sell', sell: 'buy', dividend: null, deposit: null }[txn.type];
    if (reversed.type) {
      try {
        applyTransactionToInvestment(investment, reversed);
      } catch (err) {
        // If reversing a "sell" as a "buy" would be inconsistent for any
        // reason, fall back to leaving the aggregate as-is rather than
        // blocking the delete — but tell the user via the response.
        await txn.deleteOne();
        return res.json({
          message: 'Transaction deleted, but portfolio totals could not be automatically reversed. Please review this holding.',
        });
      }
    } else if (txn.type === 'dividend') {
      investment.totalDividends = roundMoney(investment.totalDividends - txn.totalAmount);
    } else if (txn.type === 'deposit') {
      investment.totalInvested = roundMoney(investment.totalInvested - txn.totalAmount);
    }
    await investment.save();
  }

  await txn.deleteOne();
  res.json({ message: 'Transaction deleted' });
}

module.exports = { getTransactions, createTransaction, deleteTransaction };
