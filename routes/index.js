const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET / - Dashboard z listą grup
router.get('/', (req, res) => {
  const db = getDb();
  const groups = db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all();
  res.render('layout', {
    title: 'UniTodo',
    body: '',
    groups,
    view: 'index'
  });
});

// POST /groups - Dodaj grupę
router.post('/groups', (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nazwa grupy jest wymagana' });
  }
  const result = db.prepare('INSERT INTO groups (name, description) VALUES (?, ?)').run(name.trim(), description || '');
  res.redirect('/');
});

// PUT /groups/:id - Edytuj grupę
router.put('/groups/:id', (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  if (!name || !name.trim()) { return res.status(400).json({ error: "Nazwa grupy jest wymagana" }); }
  db.prepare('UPDATE groups SET name = ?, description = ? WHERE id = ?').run(name, description || '', req.params.id);
  res.redirect('/');
});

// DELETE /groups/:id - Usuń grupę
router.delete('/groups/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.redirect('/');
});

module.exports = router;
