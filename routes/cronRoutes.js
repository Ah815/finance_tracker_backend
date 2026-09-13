const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { generateDueTransactions } = require('../services/recurringService');
const { createSnapshotNow } = require('../controllers/netWorthController');

const router = express.Router();

/**
 * GET /api/cron/daily
 *
 * Does what the local server's node-cron job used to do in-process:
 * generates any due recurring income/expenses and records a net-worth
 * snapshot. node-cron can't run on Vercel (no long-lived process to hold
 * the schedule), so this is invoked instead by Vercel Cron — see the
 * `crons` entry in vercel.json — on the same daily schedule.
 *
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when
 * a CRON_SECRET env var is set on the project, which is how this confirms
 * the request actually came from Vercel Cron and not a random visitor. If
 * CRON_SECRET isn't set, the check is skipped (fine for local testing, but
 * set it in production).
 */
router.get(
  '/daily',
  asyncHandler(async (req, res) => {
    if (process.env.CRON_SECRET) {
      const expected = `Bearer ${process.env.CRON_SECRET}`;
      if (req.headers.authorization !== expected) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    const created = await generateDueTransactions();
    const snapshot = await createSnapshotNow();

    res.json({
      message: `Generated ${created.length} recurring transaction(s) and recorded a net worth snapshot`,
      generatedCount: created.length,
      snapshotId: snapshot._id,
    });
  })
);

module.exports = router;
