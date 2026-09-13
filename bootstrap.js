const connectDB = require('./config/db');
const User = require('./models/User');

// Memoized per warm instance so repeated calls (once per serverless
// invocation) don't re-run the countDocuments() check forever — only the
// first call on a given warm instance actually does the work.
let ownerEnsured = false;

/**
 * This app deliberately has no public registration endpoint anywhere in
 * the codebase — the only account is created here, once, from env vars.
 * If a user already exists, this is a no-op, so it's safe to call on
 * every boot (local) or every request (serverless).
 */
async function ensureOwnerAccount() {
  if (ownerEnsured) return;

  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    ownerEnsured = true;
    return;
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      '\n[Setup] No user exists yet and ADMIN_EMAIL/ADMIN_PASSWORD are not set — ' +
        'the app has no way to log in. Set them (as env vars in production) and retry.\n'
    );
    return; // deliberately NOT marking ownerEnsured, so the next request retries
  }

  await User.create({
    email: ADMIN_EMAIL.toLowerCase().trim(),
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME || 'Owner',
  });
  console.log(`\n[Setup] Owner account created for ${ADMIN_EMAIL}. Change the password from Settings after your first login.\n`);
  ownerEnsured = true;
}

/** Called before handling any request, in both local and serverless deployments. */
async function initApp() {
  await connectDB();
  await ensureOwnerAccount();
}

module.exports = { initApp, ensureOwnerAccount };
