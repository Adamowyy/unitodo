// auth/routes.js — Login & register endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');
const { generateToken, requireAuth } = require('./index');

// Cookie settings
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 3600 * 1000,
  sameSite: 'lax',
  secure: isProduction
};

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,                  // 10 prób logowania
  message: 'Za dużo prób logowania. Spróbuj ponownie za 15 minut.',
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 3,                    // 3 konta na IP na godzinę
  message: 'Za dużo rejestracji. Spróbuj ponownie za godzinę.',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation helpers
function validateUsername(username) {
  if (!username || typeof username !== 'string') return 'Nazwa użytkownika jest wymagana';
  const trimmed = username.trim();
  if (trimmed.length < 3) return 'Nazwa użytkownika musi mieć min. 3 znaki';
  if (trimmed.length > 30) return 'Nazwa użytkownika może mieć max. 30 znaków';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Hasło jest wymagane';
  if (password.length < 6) return 'Hasło musi mieć min. 6 znaków';
  if (password.length > 100) return 'Hasło jest za długie';
  return null;
}

// GET /login
router.get('/login', (req, res) => {
  res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: null, user: null });
});

// POST /login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: usernameError, user: null });
  }

  try {
    const user = await getOne('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: 'Nieprawidłowa nazwa użytkownika lub hasło', user: null });
    }
    const token = generateToken(user.id);
    res.cookie('token', token, cookieOptions);
    res.redirect('/');
  } catch (err) {
    res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: 'Błąd serwera', user: null });
  }
});

// GET /register
router.get('/register', (req, res) => {
  res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: null, user: null });
});

// POST /register
router.post('/register', registerLimiter, async (req, res) => {
  const { username, password } = req.body;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: usernameError, user: null });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: passwordError, user: null });
  }

  try {
    const hash = bcrypt.hashSync(password, 12);
    const result = await run(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username.trim(), hash]
    );
    const token = generateToken(result.rows[0].id);
    res.cookie('token', token, cookieOptions);
    res.redirect('/');
  } catch (err) {
    if (err.code === '23505') {
      return res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: 'Nazwa użytkownika jest już zajęta', user: null });
    }
    res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: 'Błąd serwera', user: null });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// GET /me — endpoint dla Electrona do sprawdzenia auth
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

module.exports = router;
