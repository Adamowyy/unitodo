// auth/routes.js — login, registration and password change endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');
const { generateToken, requireAuth } = require('./index');
const { validateUsername, validatePassword } = require('../lib/validate');

const BCRYPT_ROUNDS = 12;

// Cookie settings
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 3600 * 1000,
  sameSite: 'lax',
  secure: isProduction
};

// Rate limiters, the message is resolved per request so it follows the UI language
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 login attempts
  message: (req) => req.t('error.rate_login'),
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,                    // 3 accounts per IP per hour
  message: (req) => req.t('error.rate_register'),
  standardHeaders: true,
  legacyHeaders: false
});

// Renders a login/register style page with an error message key already translated
function renderForm(req, res, view, titleKey, errorKey) {
  const t = res.locals.t;
  res.render('layout', {
    title: `${t(titleKey)} — UniTodo`,
    view,
    error: errorKey ? t(errorKey) : null,
    user: null
  });
}

// GET /login
router.get('/login', (req, res) => {
  renderForm(req, res, 'login', 'page.login', null);
});

// POST /login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return renderForm(req, res, 'login', 'page.login', usernameError);
  }

  try {
    const user = await getOne('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return renderForm(req, res, 'login', 'page.login', 'error.invalid_credentials');
    }
    const token = generateToken(user.id);
    res.cookie('token', token, cookieOptions);
    res.redirect('/');
  } catch (err) {
    renderForm(req, res, 'login', 'page.login', 'error.server');
  }
});

// GET /register
router.get('/register', (req, res) => {
  renderForm(req, res, 'register', 'page.register', null);
});

// POST /register
router.post('/register', registerLimiter, async (req, res) => {
  const { username, password } = req.body;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return renderForm(req, res, 'register', 'page.register', usernameError);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return renderForm(req, res, 'register', 'page.register', passwordError);
  }

  try {
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const result = await run(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username.trim(), hash]
    );
    const token = generateToken(result.rows[0].id);
    res.cookie('token', token, cookieOptions);
    res.redirect('/');
  } catch (err) {
    if (err.code === '23505') {
      return renderForm(req, res, 'register', 'page.register', 'error.username_taken');
    }
    renderForm(req, res, 'register', 'page.register', 'error.server');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// GET /me — used by the desktop wrapper to check the session
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// GET /change-password — form shown after an administrator reset
router.get('/change-password', requireAuth, (req, res) => {
  renderForm(req, res, 'change-password', 'password.change_title', null);
});

// POST /change-password — stores the new password and clears the flag
router.post('/change-password', requireAuth, async (req, res) => {
  const { new_password, confirm_password } = req.body;

  const passwordError = validatePassword(new_password);
  if (passwordError) {
    return renderForm(req, res, 'change-password', 'password.change_title', passwordError);
  }

  if (new_password !== confirm_password) {
    return renderForm(req, res, 'change-password', 'password.change_title', 'error.password_mismatch');
  }

  try {
    const hash = bcrypt.hashSync(new_password, BCRYPT_ROUNDS);
    await run(
      'UPDATE users SET password_hash = $1, force_password_change = FALSE WHERE id = $2',
      [hash, req.user.id]
    );
    res.redirect('/');
  } catch (err) {
    renderForm(req, res, 'change-password', 'password.change_title', 'error.server_retry');
  }
});

module.exports = router;
