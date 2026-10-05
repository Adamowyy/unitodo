// auth/index.js — JWT auth middleware and helpers
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getOne } = require('../db/pg');

const TOKEN_EXPIRY = '7d';
const DEV_SECRET = 'unitodo-dev-secret';
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean);

// A missing secret in production would let anyone sign their own tokens, so the
// app refuses to start instead of falling back to a value that lives in the repo.
function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }
  return DEV_SECRET;
}

const JWT_SECRET = resolveJwtSecret();

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
    const t = res.locals.t;
    return res.status(403).render('layout', {
      title: `${t('error.403_title')} — UniTodo`,
      view: null,
      body: `<div class="text-center py-16"><h1 class="text-4xl font-bold text-gray-300 dark:text-gray-600 mb-4">403</h1><p class="text-gray-500 dark:text-gray-400">${t('error.no_admin_rights')}</p></div>`,
      user: req.user
    });
  }
  next();
}

// Require auth — redirect to login if no valid token.
// If force_password_change is set, only allow /change-password and /logout.
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
    const user = await getOne(
      'SELECT id, username, force_password_change FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!user) throw new Error('User not found');
    req.user = { id: user.id, username: user.username };
    res.locals.user = req.user;
    res.locals.isAdmin = isAdmin(user.id);

    // Force password change — only allow change-password and logout
    if (user.force_password_change) {
      const allowedPaths = ['/change-password', '/logout'];
      if (!allowedPaths.includes(req.path)) {
        if (req.headers.accept?.includes('application/json')) {
          return res.status(403).json({ error: 'Password change required', redirect: '/change-password' });
        }
        return res.redirect('/change-password');
      }
    }

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

module.exports = { requireAuth, requireAdmin, optionalAuth, generateToken, JWT_SECRET, isAdmin, resolveJwtSecret };
