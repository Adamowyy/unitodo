const express = require('express');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');

// GET /groups/:id/notes
router.get('/groups/:id/notes', async (req, res) => {
  const group = await getOne(
    `SELECT g.*, gm.role FROM groups g JOIN group_members gm ON gm.group_id = g.id 
     WHERE g.id = $1 AND gm.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!group) return res.redirect('/');

  const query = req.query.q || '';
  let notes;
  if (query.trim()) {
    notes = await getAll(
      "SELECT * FROM items WHERE group_id = $1 AND type = 'note' AND (title ILIKE $2 OR content ILIKE $3) ORDER BY created_at DESC",
      [req.params.id, `%${query.trim()}%`, `%${query.trim()}%`]
    );
  } else {
    notes = await getAll(
      "SELECT * FROM items WHERE group_id = $1 AND type = 'note' ORDER BY created_at DESC",
      [req.params.id]
    );
  }

  // Get members for invite UI
  const members = await getAll(
    'SELECT u.id, u.username, gm.role FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY gm.role, u.username',
    [req.params.id]
  );

  res.render('layout', {
    title: `Notatki — ${group.name}`,
    group,
    notes,
    members,
    query,
    view: 'notes'
  });
});

// POST /groups/:id/notes
router.post('/groups/:id/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim()) return res.redirect(`/groups/${req.params.id}/notes`);
  await run(
    "INSERT INTO items (group_id, type, title, content) VALUES ($1, 'note', $2, $3)",
    [req.params.id, title.trim(), content || '']
  );
  res.redirect(`/groups/${req.params.id}/notes`);
});

// PUT /notes/:id
router.put('/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  await run(
    "UPDATE items SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND type = 'note'",
    [title, content || '', req.params.id]
  );
  const item = await getOne('SELECT group_id FROM items WHERE id = $1', [req.params.id]);
  res.redirect(`/groups/${item.group_id}/notes`);
});

// DELETE /notes/:id
router.delete('/notes/:id', async (req, res) => {
  const item = await getOne("SELECT group_id FROM items WHERE id = $1 AND type = 'note'", [req.params.id]);
  if (item) {
    await run('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.redirect(`/groups/${item.group_id}/notes`);
  } else {
    res.redirect('/');
  }
});

module.exports = router;
