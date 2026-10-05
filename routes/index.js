// routes/index.js — dashboard, groups and membership
const express = require('express');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');

// GET / — dashboard grouped by category
router.get('/', async (req, res) => {
  const groups = await getAll(
    `SELECT g.*, gm.role,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as member_count,
      (SELECT COUNT(*) FROM items WHERE group_id = g.id AND type = 'note') as note_count,
      (SELECT COUNT(*) FROM items WHERE group_id = g.id AND type = 'task' AND status = 'todo' AND parent_id IS NULL) as todo_count,
      (SELECT COUNT(*) FROM items WHERE group_id = g.id AND type = 'task' AND status = 'in_progress' AND parent_id IS NULL) as in_progress_count
     FROM groups g 
     JOIN group_members gm ON gm.group_id = g.id 
     WHERE gm.user_id = $1 
     ORDER BY g.category, g.created_at DESC`,
    [req.user.id]
  );

  // Group by category, the uncategorized bucket is labelled by the view
  const uncategorized = res.locals.t('groups.uncategorized');
  const categories = {};
  groups.forEach(g => {
    const cat = g.category || uncategorized;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(g);
  });

  res.render('layout', {
    title: 'UniTodo',
    view: 'index',
    categories,
    uncategorized,
    groups
  });
});

// POST /groups — create
router.post('/groups', async (req, res) => {
  const { name, description, category } = req.body;
  if (!name?.trim()) {
    const groups = await getAll(
      'SELECT g.*, gm.role FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.user_id = $1 ORDER BY g.created_at DESC',
      [req.user.id]
    );
    return res.render('layout', {
      title: 'UniTodo',
      view: 'index',
      groups,
      error: res.locals.t('error.group_name_required')
    });
  }
  const result = await run(
    'INSERT INTO groups (name, description, owner_id, category) VALUES ($1, $2, $3, $4) RETURNING id',
    [name.trim(), description || '', req.user.id, (category || '').trim()]
  );
  const groupId = result.rows[0].id;
  await run('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [groupId, req.user.id, 'owner']);
  res.redirect('/');
});

// PUT /groups/:id — update (owner only)
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

// DELETE /groups/:id — delete (owner only)
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

// POST /groups/:id/leave — leave (non-owner only)
router.post('/groups/:id/leave', async (req, res) => {
  const membership = await getOne(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  // The owner cannot leave, they have to delete the group instead
  if (!membership || membership.role === 'owner') {
    return res.redirect('/');
  }
  await run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]);
  res.redirect('/');
});

// GET /groups/:id/members — member list
router.get('/groups/:id/members', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE id = $1', [req.params.id]);
  if (!group) return res.redirect('/');
  const members = await getAll(
    'SELECT u.id, u.username, gm.role FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY gm.role, u.username',
    [req.params.id]
  );
  res.render('layout', {
    title: `${res.locals.t('page.members')} — ${group.name}`,
    view: 'members',
    group,
    members
  });
});

// POST /groups/:id/invite — generate or regenerate the invite code
router.post('/groups/:id/invite', async (req, res) => {
  const result = await run(
    'UPDATE groups SET invite_code = gen_random_uuid() WHERE id = $1 RETURNING invite_code',
    [req.params.id]
  );
  res.json({ invite_code: result.rows[0].invite_code });
});

// POST /groups/join/:code — join through an invite code
router.post('/groups/join/:code', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE invite_code = $1', [req.params.code]);
  if (!group) return res.json({ error: res.locals.t('error.invite_code_invalid') });

  // Already a member? Go straight to the group
  const existing = await getOne('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [group.id, req.user.id]);
  if (existing) return res.redirect(`/groups/${group.id}/notes`);

  await run('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [group.id, req.user.id, 'member']);
  res.redirect(`/groups/${group.id}/notes`);
});

// DELETE /groups/:id/members/:userId — remove a member (owner only)
router.delete('/groups/:id/members/:userId', async (req, res) => {
  const group = await getOne('SELECT * FROM groups WHERE id = $1', [req.params.id]);
  if (!group) return res.redirect('/');

  // Only the owner can remove members
  const membership = await getOne('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!membership || membership.role !== 'owner') return res.redirect(`/groups/${req.params.id}/members`);

  // Do not remove yourself
  if (parseInt(req.params.userId) === req.user.id) return res.redirect(`/groups/${req.params.id}/members`);

  await run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
  res.redirect(`/groups/${req.params.id}/members`);
});

// GET /groups/:id/poll?since=<ISO> — has anything changed since that timestamp?
router.get('/groups/:id/poll', async (req, res) => {
  const since = req.query.since;
  if (!since) return res.json({ hasChanges: false });

  const itemChanges = await getOne(
    'SELECT COUNT(*) as count FROM items WHERE group_id = $1 AND updated_at > $2',
    [req.params.id, since]
  );
  if (parseInt(itemChanges.count) > 0) return res.json({ hasChanges: true });

  const memberChanges = await getOne(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND joined_at > $2',
    [req.params.id, since]
  );
  if (parseInt(memberChanges.count) > 0) return res.json({ hasChanges: true });

  res.json({ hasChanges: false });
});

module.exports = router;
