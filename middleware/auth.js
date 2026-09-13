const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    console.log('--- AUTH DEBUG ---');

    console.log('Cookies:', req.cookies);
    console.log('Authorization:', req.headers.authorization);

    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('Token exists:', !!token);

    if (!token) {
      console.log('❌ NO TOKEN');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded JWT:', decoded);

    const user = await User.findById(decoded.id);

    console.log('User found:', !!user);

    if (!user) {
      console.log('❌ USER NOT FOUND:', decoded.id);
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('✅ AUTH SUCCESS:', user.email);

    req.user = user;
    next();
  } catch (err) {
    console.log('❌ AUTH ERROR:', err.message);

    return res.status(401).json({
      message: 'Session expired or invalid. Please log in again.',
    });
  }
}

module.exports = { protect };