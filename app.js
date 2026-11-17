require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { initApp } = require('./bootstrap');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const investmentTransactionRoutes = require('./routes/investmentTransactionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const netWorthRoutes = require('./routes/netWorthRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

// Vercel supplies X-Forwarded-For through its proxy. Trust only that hop so
// Express (and express-rate-limit) can resolve the client IP safely.
app.set('trust proxy', process.env.VERCEL ? 1 : false);

app.use(helmet());

// CLIENT_URL can be a single origin or a comma-separated list (handy for
// pairing a production frontend with Vercel preview-deployment URLs).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/health checks).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Ensures a DB connection (and the one-time owner-account bootstrap) exists
// before any route touches the database. Cheap on warm serverless
// invocations and on the local server, since both are memoized/cached —
// see bootstrap.js and config/db.js.
app.use(async (req, res, next) => {
  try {
    await initApp();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/investment-transactions', investmentTransactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/net-worth', netWorthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recurring', recurringRoutes);
// Triggered by Vercel Cron in production (see vercel.json) or manually in
// local dev — not behind user JWT auth, protected by CRON_SECRET instead.
app.use('/api/cron', cronRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
