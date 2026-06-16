const express = require('express');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');

// GET / — Dashboard
router.get('/', async (req, res) => {
  const groups = await getAll(
    `SELECT g.*, gm.role,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as member_count
     FROM groups g 
     JOIN group_members gm ON gm.group_id = g.id 
     WHERE gm.user_id = $1 
     ORDER BY g.category, g.created_at DESC`,
    [req.user.id]
  );
  
  // Group by category
  const categories = {};
  groups.forEach(g => {
    const cat = g.category || 'Bez kategorii';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(g);
  });
  
  res.render('layout', {
    title: 'UniTodo',
    view: 'index',
    categories,
    groups
  });
});

// POST /groups — Create
router.post('/groups', async (req, res) => {
  const { name, description, category } = req.body;
  if (!name?.trim()) {
    const groups = await getAll(
      'SELECT g.*, gm.role FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.user_id = $1 ORDER BY g.created_at DESC',
      [req.user.id]
    );
    return res.render('layout', { title: 'UniTodo', view: 'index', groups, error: 'Nazwa grupy jest wymagana' });
  }
  const result = await run(
    'INSERT INTO groups (name, description, owner_id, category) VALUES ($1, $2, $3, $4) RETURNING id',
    [name.trim(), description || '', req.user.id, (category || '').trim()]
  );
  const groupId = result.rows[0].id;
  await run('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [groupId, req.user.id, 'owner']);
  res.redirect('/');
});

// PUT /groups/:id — Update (owner only)
router.put('/groups/:id', async (req, res) => {
  const membership = await getOne(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!membership || membership.role !== 'owner') return res.redirect('/');

  const { name, description, category } = req.body;
  if (!name?.trim()) return res.redirect('/');
  await run('UPDATE groups SET name = $1, description = $2, category = $3 WHERE id = $4', [name.trim(), description || '', (category || '').trim(), req.params.id]);
  res.redirect('/');
});

// DELETE /groups/:id — Delete (owner only)
router.delete('/groups/:id', async (req, res) => {
  const membership = await getOne(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!membership || membership.role !== 'owner') {
    return res.redirect('/');
  }
  await run('DELETE FROM groups WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

// POST /groups/:id/leave — Leave group (non-owner only)
router.post('/groups/:id/leave', async (req, res) => {
  const membership = await getOne(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  // Owner cannot leave — must delete group instead
  if (!membership || membership.role === 'owner') {
    return res.redirect('/');
  }
  await run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]);
  res.redirect('/');
});

// GET /groups/:id/members — List members
router.get('/groups/:id/members', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE id = $1', [req.params.id]);
  if (!group) return res.redirect('/');
  const members = await getAll(
    'SELECT u.id, u.username, gm.role FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY gm.role, u.username',
    [req.params.id]
  );
  res.render('layout', { title: `Członkowie — ${group.name}`, view: 'members', group, members });
});

// POST /groups/:id/invite — Generate/regenerate invite code
router.post('/groups/:id/invite', async (req, res) => {
  const result = await run(
    'UPDATE groups SET invite_code = gen_random_uuid() WHERE id = $1 RETURNING invite_code',
    [req.params.id]
  );
  res.json({ invite_code: result.rows[0].invite_code });
});

// POST /groups/join/:code — Join a group via invite code
router.post('/groups/join/:code', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE invite_code = $1', [req.params.code]);
  if (!group) return res.json({ error: 'Nieprawidłowy kod zaproszenia' });

  // Check if already member
  const existing = await getOne('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [group.id, req.user.id]);
  if (existing) return res.redirect(`/groups/${group.id}/notes`);

  await run('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [group.id, req.user.id, 'member']);
  res.redirect(`/groups/${group.id}/notes`);
});

// DELETE /groups/:id/members/:userId — Remove member (owner only)
router.delete('/groups/:id/members/:userId', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE id = $1', [req.params.id]);
  if (!group) return res.redirect('/');

  // Only owner can remove members
  const membership = await getOne('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!membership || membership.role !== 'owner') return res.redirect(`/groups/${req.params.id}/members`);

  // Don't remove yourself
  if (parseInt(req.params.userId) === req.user.id) return res.redirect(`/groups/${req.params.id}/members`);

  await run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
  res.redirect(`/groups/${req.params.id}/members`);
});

// GET /groups/:id/poll?since=<ISO> — Check for changes since timestamp
router.get('/groups/:id/poll', async (req, res) => {
  const since = req.query.since;
  if (!since) return res.json({ hasChanges: false });

  // Check items
  const itemChanges = await getOne(
    'SELECT COUNT(*) as count FROM items WHERE group_id = $1 AND updated_at > $2',
    [req.params.id, since]
  );
  if (parseInt(itemChanges.count) > 0) return res.json({ hasChanges: true });

  // Check group members
  const memberChanges = await getOne(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND joined_at > $2',
    [req.params.id, since]
  );
  if (parseInt(memberChanges.count) > 0) return res.json({ hasChanges: true });

  res.json({ hasChanges: false });
});

module.exports = router;
