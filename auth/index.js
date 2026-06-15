// auth/index.js — JWT auth middleware + helpers
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getOne } = require('../db/pg');

const JWT_SECRET = process.env.JWT_SECRET || 'unitodo-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean);

// Check if user is admin
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

// Require admin — must be authenticated AND be an admin
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (!isAdmin(req.user.id)) {
    return res.status(403).render('layout', {
      title: '403 — Brak dostępu',
      view: null,
      body: '<div class="text-center py-16"><h1 class="text-4xl font-bold text-gray-300 dark:text-gray-600 mb-4">403</h1><p class="text-gray-500 dark:text-gray-400">Nie masz uprawnień administratora.</p></div>',
      user: req.user
    });
  }
  next();
}

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

module.exports = { requireAuth, requireAdmin, optionalAuth, generateToken, JWT_SECRET, isAdmin };
