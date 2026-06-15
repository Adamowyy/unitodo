// auth/routes.js — Login & register endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');
const { generateToken, requireAuth } = require('./index');

// GET /login
router.get('/login', (req, res) => {
  res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: null, user: null });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await getOne('SELECT * FROM users WHERE username = $1', [username?.trim()]);
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.render('layout', { title: 'Logowanie — UniTodo', view: 'login', error: 'Nieprawidłowa nazwa użytkownika lub hasło', user: null });
    }
    const token = generateToken(user.id);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000, sameSite: 'lax' });
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
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: 'Wypełnij wszystkie pola', user: null });
  }
  if (password.trim().length < 4) {
    return res.render('layout', { title: 'Rejestracja — UniTodo', view: 'register', error: 'Hasło musi mieć min. 4 znaki', user: null });
  }
  try {
    const hash = bcrypt.hashSync(password.trim(), 10);
    const result = await run(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username.trim(), hash]
    );
    const token = generateToken(result.rows[0].id);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000, sameSite: 'lax' });
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
