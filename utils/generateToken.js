const jwt = require('jsonwebtoken');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function cookieMaxAgeMs() {
  const raw = process.env.JWT_EXPIRES_IN || '7d';
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unitMs;
}

/**
 * Local dev: frontend and backend share localhost, so `lax` + non-secure
 * works fine. A split deployment (frontend and backend on two different
 * Vercel projects/domains, as in production here) is a cross-site request
 * from the browser's point of view, which requires `SameSite=None` — and
 * browsers require `Secure` on any cookie that sets SameSite=None, so that
 * gets forced on automatically rather than left as a footgun.
 * Set COOKIE_SAMESITE=none and COOKIE_SECURE=true in the backend's Vercel
 * env vars to enable this.
 */
function cookieOptions() {
  const sameSite = process.env.COOKIE_SAMESITE || 'lax';
  const secure = sameSite === 'none' ? true : process.env.COOKIE_SECURE === 'true';
  return { httpOnly: true, secure, sameSite };
}

function sendTokenCookie(res, userId) {
  const token = signToken(userId);
  res.cookie('token', token, { ...cookieOptions(), maxAge: cookieMaxAgeMs() });
  return token;
}

function clearTokenCookie(res) {
  res.clearCookie('token', cookieOptions());
}

module.exports = { signToken, sendTokenCookie, clearTokenCookie };
