const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenCookie, clearTokenCookie } = require('../utils/generateToken');
const { required, isValidEmail, ValidationError } = require('../utils/validators');

// POST /api/auth/login
async function login(req, res) {
  required(['email', 'password'], req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Generic message either way — this is a single-user app, but there's no
  // reason to confirm/deny whether an email matches the owner account.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  sendTokenCookie(res, user._id);
  const safeUser = user.toObject();
  delete safeUser.password;
  res.json({ user: safeUser });
}

// POST /api/auth/logout
function logout(req, res) {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
}

// GET /api/auth/me
function me(req, res) {
  const safeUser = req.user.toObject();
  delete safeUser.password;
  res.json({ user: safeUser });
}

// PUT /api/auth/password
async function changePassword(req, res) {
  required(['currentPassword', 'newPassword'], req.body);
  const { currentPassword, newPassword } = req.body;

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
}

// POST /api/auth/forgot-password
// There's no email service configured for a single-user local app, so the
// reset link is logged to the server console instead of emailed. Swap this
// for a real mail provider before deploying somewhere you can't see stdout.
async function forgotPassword(req, res) {
  required(['email'], req.body);
  if (!isValidEmail(req.body.email)) {
    throw new ValidationError('Invalid email address');
  }

  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });

  if (user) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    console.log(`\n[Password Reset] Requested for ${user.email}.\nReset link (valid 1 hour): ${resetUrl}\n`);
  }

  // Same response whether or not the account exists.
  res.json({ message: 'If that email is registered, a reset link has been generated (check the server console).' });
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res) {
  required(['password'], req.body);
  if (req.body.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return res.status(400).json({ message: 'Reset link is invalid or has expired' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendTokenCookie(res, user._id);
  res.json({ message: 'Password reset — you are now logged in' });
}

module.exports = { login, logout, me, changePassword, forgotPassword, resetPassword };
