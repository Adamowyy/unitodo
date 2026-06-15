// auth/index.js — JWT auth middleware + helpers
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getOne } = require('../db/pg');

const JWT_SECRET = process.env.JWT_SECRET || 'unitodo-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

// Require auth — redirect to login if no valid token
async function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getOne('SELECT id, username FROM users WHERE id = $1', [decoded.userId]);
    if (!user) throw new Error('User not found');
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.redirect('/login');
  }
}

// Optional auth — sets req.user if token present, but doesn't block
async function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await getOne('SELECT id, username FROM users WHERE id = $1', [decoded.userId]);
    } catch (err) { /* ignore invalid token */ }
  }
  next();
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

module.exports = { requireAuth, optionalAuth, generateToken, JWT_SECRET };
