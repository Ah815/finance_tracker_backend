const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { clearTokenCookie } = require('../utils/generateToken');

async function protect(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      // The token is well-formed but points at a user that no longer
      // exists (e.g. the DB was reseeded, creating a fresh account with a
      // new id). Clear the stale cookie here so the browser stops sending
      // it — otherwise a client-side "cookie present -> assume logged in"
      // check (like proxy.js's optimistic /login redirect) can loop
      // forever against a cookie that will never become valid again.
      clearTokenCookie(res);
      return res.status(401).json({ message: 'Not authenticated' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Covers expired/invalid/tampered tokens (jwt.verify throwing) — same
    // reasoning as above, clear it so it stops being resent.
    clearTokenCookie(res);
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { protect };