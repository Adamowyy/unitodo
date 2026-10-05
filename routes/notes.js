// routes/notes.js — notes, their comments and search
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
      `SELECT i.*, u.username as author FROM items i 
       LEFT JOIN users u ON u.id = i.created_by
       WHERE i.group_id = $1 AND i.type = 'note' AND (i.title ILIKE $2 OR i.content ILIKE $3) 
       ORDER BY i.created_at DESC`,
      [req.params.id, `%${query.trim()}%`, `%${query.trim()}%`]
    );
  } else {
    notes = await getAll(
      `SELECT i.*, u.username as author FROM items i 
       LEFT JOIN users u ON u.id = i.created_by
       WHERE i.group_id = $1 AND i.type = 'note' 
       ORDER BY i.created_at DESC`,
      [req.params.id]
    );
  }

  // Comments of every note on the page
  let comments = [];
  if (notes.length > 0) {
    const noteIds = notes.map(n => n.id);
    comments = await getAll(
      `SELECT i.*, u.username as author FROM items i 
       LEFT JOIN users u ON u.id = i.created_by
       WHERE i.parent_id = ANY($1) AND i.type = 'comment' 
       ORDER BY i.created_at ASC`,
      [noteIds]
    );
  }
  const commentsByNote = {};
  comments.forEach(c => {
    if (!commentsByNote[c.parent_id]) commentsByNote[c.parent_id] = [];
    commentsByNote[c.parent_id].push(c);
  });

  const members = await getAll(
    'SELECT u.id, u.username, gm.role FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY gm.role, u.username',
    [req.params.id]
  );

  res.render('layout', {
    title: `${res.locals.t('page.notes')} — ${group.name}`,
    group,
    notes,
    commentsByNote,
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
    "INSERT INTO items (group_id, type, title, content, created_by) VALUES ($1, 'note', $2, $3, $4)",
    [req.params.id, title.trim(), content || '', req.user.id]
  );
  res.redirect(`/groups/${req.params.id}/notes`);
});

// POST /notes/:id/comments — add a comment
router.post('/notes/:id/comments', async (req, res) => {
  try {
    const note = await getOne("SELECT group_id FROM items WHERE id = $1 AND type = 'note'", [req.params.id]);
    if (!note) return res.redirect('/');

    const { content } = req.body;
    if (content?.trim()) {
      // The stored title is a fixed marker, the UI never shows it
      await run(
        "INSERT INTO items (group_id, parent_id, type, title, content, created_by) VALUES ($1, $2, 'comment', 'Comment', $3, $4)",
        [note.group_id, req.params.id, content.trim(), req.user.id]
      );
    }

    res.redirect(303, '/groups/' + note.group_id + '/notes');
  } catch (err) {
    console.error('Comment error:', err.message);
    res.redirect('/');
  }
});

// DELETE /comments/:id — delete a comment
router.delete('/comments/:id', async (req, res) => {
  const comment = await getOne("SELECT i.*, i.group_id FROM items i WHERE i.id = $1 AND i.type = 'comment'", [req.params.id]);
  if (comment) {
    await run('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.redirect('/groups/' + comment.group_id + '/notes');
  } else {
    res.redirect('/');
  }
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
    await run('DELETE FROM items WHERE id = $1 OR (parent_id = $1 AND type = $2)', [req.params.id, 'comment']);
    res.redirect(`/groups/${item.group_id}/notes`);
  } else {
    res.redirect('/');
  }
});

module.exports = router;
