const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET /groups/:id/notes - Lista notatek w grupie
router.get('/groups/:id/notes', (req, res) => {
  const db = getDb();
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.redirect('/');
  const query = req.query.q || '';
  let notes;
  if (query.trim()) {
    notes = db.prepare("SELECT * FROM items WHERE group_id = ? AND type = 'note' AND (title LIKE ? OR content LIKE ?) ORDER BY created_at DESC")
      .all(req.params.id, `%${query.trim()}%`, `%${query.trim()}%`);
  } else {
    notes = db.prepare('SELECT * FROM items WHERE group_id = ? AND type = ? ORDER BY created_at DESC').all(req.params.id, 'note');
  }
  res.render('layout', {
    title: `Notatki - ${group.name}`,
    group,
    notes,
    query,
    view: 'notes'
  });
});

// POST /groups/:id/notes - Dodaj notatkę
router.post('/groups/:id/notes', (req, res) => {
  const db = getDb();
  const { title, content } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Tytuł wymagany' });
  db.prepare('INSERT INTO items (group_id, type, title, content) VALUES (?, ?, ?, ?)').run(req.params.id, 'note', title.trim(), content || '');
  res.redirect(`/groups/${req.params.id}/notes`);
});

// PUT /notes/:id - Edytuj notatkę
router.put('/notes/:id', (req, res) => {
  const db = getDb();
  const { title, content } = req.body;
  db.prepare("UPDATE items SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND type = 'note'").run(title, content || '', req.params.id);
  const item = db.prepare('SELECT group_id FROM items WHERE id = ?').get(req.params.id);
  res.redirect(`/groups/${item.group_id}/notes`);
});

// DELETE /notes/:id - Usuń notatkę
router.delete('/notes/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT group_id FROM items WHERE id = ?').get(req.params.id);
  if (item) {
    db.prepare("DELETE FROM items WHERE id = ? AND type = 'note'").run(req.params.id);
    res.redirect(`/groups/${item.group_id}/notes`);
  } else {
    res.redirect('/');
  }
});

module.exports = router;
