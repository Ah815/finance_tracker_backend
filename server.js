// Local development entry point ONLY. On Vercel, api/index.js exports
// app.js directly as a serverless function instead — this file's
// app.listen() and node-cron scheduling don't run there (see
// DEPLOYMENT.md for why, and routes/cronRoutes.js for the Vercel Cron
// replacement).
require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { initApp } = require('./bootstrap');
const { generateDueTransactions } = require('./services/recurringService');
const { createSnapshotNow } = require('./controllers/netWorthController');

function scheduleJobs() {
  // Runs once a day at 00:05 — catches up any due recurring income/expenses
  // and records a net-worth snapshot for the history chart.
  cron.schedule('5 0 * * *', async () => {
    try {
      const created = await generateDueTransactions();
      if (created.length) console.log(`[cron] Generated ${created.length} recurring transaction(s).`);
    } catch (err) {
      console.error('[cron] Failed to generate recurring transactions:', err.message);
    }

    try {
      await createSnapshotNow();
    } catch (err) {
      console.error('[cron] Failed to record net worth snapshot:', err.message);
    }
  });
}

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initApp(); // connects DB + bootstraps the owner account, fails fast if misconfigured
    await generateDueTransactions(); // catch up anything due since the server was last running
    scheduleJobs();

    app.listen(PORT, () => {
      console.log(`Finance tracker API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
