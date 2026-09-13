/**
 * Market data service — intentionally NOT wired to any live provider yet.
 *
 * The spec is explicit that prices must stay manual for now and that this
 * concern must stay decoupled from the Investment model (no hard-coded
 * prices, no aggressive scraping). Every function here throws
 * NotImplemented so the rest of the app can call through this single
 * seam later without every caller needing to change.
 *
 * To wire up a real provider later:
 *   1. Implement the functions below against a licensed/legitimate
 *      PSX or market-data API.
 *   2. Have investmentController's "refresh prices" action (currently
 *      absent — prices are updated manually via PUT /api/investments/:id)
 *      call getPortfolioMarketValue() / getStockPrice() instead of
 *      trusting the stored currentPrice.
 *   3. Nothing in models/Investment.js or the controllers needs to change
 *      — they only ever read `currentPrice` off the document.
 */

class NotImplementedError extends Error {
  constructor(fn) {
    super(`marketDataService.${fn}() is not implemented yet. Prices are manual for now — see services/marketDataService.js.`);
    this.statusCode = 501;
  }
}

async function getStockPrice(_symbol) {
  throw new NotImplementedError('getStockPrice');
}

async function getMarketIndices() {
  throw new NotImplementedError('getMarketIndices');
}

async function getETFPrice(_symbol) {
  throw new NotImplementedError('getETFPrice');
}

async function getHistoricalPrice(_symbol, _date) {
  throw new NotImplementedError('getHistoricalPrice');
}

async function getPortfolioMarketValue(_holdings) {
  throw new NotImplementedError('getPortfolioMarketValue');
}

module.exports = {
  getStockPrice,
  getMarketIndices,
  getETFPrice,
  getHistoricalPrice,
  getPortfolioMarketValue,
};
