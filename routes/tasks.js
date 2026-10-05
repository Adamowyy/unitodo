// routes/tasks.js — kanban board, subtasks and emoji reactions
const express = require('express');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');

// GET /groups/:id/tasks
router.get('/groups/:id/tasks', async (req, res) => {
  const group = await getOne(
    `SELECT g.*, gm.role FROM groups g JOIN group_members gm ON gm.group_id = g.id 
     WHERE g.id = $1 AND gm.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!group) return res.redirect('/');

  const query = req.query.q || '';
  const sort = req.query.sort || 'created_desc';
  const filterPriority = parseInt(req.query.filter_priority) || 0;
  const filterStatus = req.query.filter_status || '';
  const hideDone = req.query.hide_done === '1';

  let orderClause;
  switch (sort) {
    case 'priority_desc': orderClause = 'priority DESC, created_at DESC'; break;
    case 'priority_asc': orderClause = 'priority ASC, created_at DESC'; break;
    case 'due_asc': orderClause = 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at DESC'; break;
    case 'due_desc': orderClause = 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date DESC, created_at DESC'; break;
    case 'title_asc': orderClause = 'title ASC, created_at DESC'; break;
    case 'created_asc': orderClause = 'created_at ASC'; break;
    default: orderClause = 'created_at DESC';
  }

  const conditions = ["group_id = $1", "type = 'task'"];
  const params = [req.params.id];
  let paramIdx = 2;

  if (query.trim()) {
    conditions.push(`(title ILIKE $${paramIdx} OR content ILIKE $${paramIdx + 1})`);
    params.push(`%${query.trim()}%`, `%${query.trim()}%`);
    paramIdx += 2;
  }

  if (filterPriority >= 2 && filterPriority <= 4) {
    conditions.push(`priority >= $${paramIdx}`);
    params.push(filterPriority);
    paramIdx++;
  }

  const whereClause = conditions.join(' AND ');
  const sql = `SELECT * FROM items WHERE ${whereClause} ORDER BY ${orderClause}`;
  const allItems = await getAll(sql, params);

  const rootTasks = allItems.filter(t => !t.parent_id);
  const subtasks = allItems.filter(t => t.parent_id);

  const subtasksByParent = {};
  for (const st of subtasks) {
    if (!subtasksByParent[st.parent_id]) subtasksByParent[st.parent_id] = [];
    subtasksByParent[st.parent_id].push(st);
  }

  const todoTasks = rootTasks.filter(t => t.status === 'todo' || (!t.status && !t.is_completed));
  const inProgressTasks = rootTasks.filter(t => t.status === 'in_progress');
  const doneTasks = rootTasks.filter(t => t.status === 'done' || t.is_completed);

  const members = await getAll(
    'SELECT u.id, u.username, gm.role FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY gm.role, u.username',
    [req.params.id]
  );

  // Reactions of every root task on the board
  const allTaskIds = rootTasks.map(t => t.id);
  let reactionsByTask = {};
  if (allTaskIds.length > 0) {
    const allReactions = await getAll(
      'SELECT item_id, emoji, COUNT(*) as count FROM reactions WHERE item_id = ANY($1) GROUP BY item_id, emoji',
      [allTaskIds]
    );
    allReactions.forEach(r => {
      if (!reactionsByTask[r.item_id]) reactionsByTask[r.item_id] = [];
      reactionsByTask[r.item_id].push({ emoji: r.emoji, count: parseInt(r.count) });
    });
  }

  res.render('layout', {
    title: `${res.locals.t('page.tasks')} — ${group.name}`,
    group,
    members,
    todoTasks,
    inProgressTasks,
    doneTasks,
    subtasksByParent,
    reactionsByTask,
    query,
    sort,
    filter_priority: filterPriority,
    filter_status: filterStatus,
    hideDone,
    view: 'tasks'
  });
});

// POST /groups/:id/tasks
router.post('/groups/:id/tasks', async (req, res) => {
  const { title, content, priority, due_date, assigned_to } = req.body;
  if (!title?.trim()) return res.redirect(`/groups/${req.params.id}/tasks`);
  await run(
    "INSERT INTO items (group_id, type, title, content, priority, status, due_date, assigned_to, created_by) VALUES ($1, 'task', $2, $3, $4, 'todo', $5, $6, $7)",
    [req.params.id, title.trim(), content || '', parseInt(priority) || 1, due_date || null, assigned_to ? parseInt(assigned_to) : null, req.user.id]
  );
  res.redirect(`/groups/${req.params.id}/tasks`);
});

// PUT /tasks/:id
router.put('/tasks/:id', async (req, res) => {
  const { title, content, priority, status, due_date, assigned_to } = req.body;
  const task = await getOne('SELECT group_id FROM items WHERE id = $1', [req.params.id]);
  if (!task) return res.redirect('/');
  await run(
    "UPDATE items SET title = $1, content = $2, priority = $3, status = $4, due_date = $5, assigned_to = $6, updated_at = NOW() WHERE id = $7 AND type = 'task'",
    [title, content || '', parseInt(priority) || 1, status || 'todo', due_date || null, assigned_to ? parseInt(assigned_to) : null, req.params.id]
  );
  res.redirect(`/groups/${task.group_id}/tasks`);
});

// DELETE /tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  const task = await getOne("SELECT group_id FROM items WHERE id = $1 AND type = 'task'", [req.params.id]);
  if (!task) return res.redirect('/');
  await run('DELETE FROM items WHERE parent_id = $1', [req.params.id]);
  await run('DELETE FROM items WHERE id = $1', [req.params.id]);
  res.redirect(`/groups/${task.group_id}/tasks`);
});

// POST /tasks/:id/subtasks
router.post('/tasks/:id/subtasks', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.json({ error: req.t('error.title_required') });
  const parent = await getOne("SELECT group_id, priority FROM items WHERE id = $1 AND type = 'task'", [req.params.id]);
  if (!parent) return res.redirect('/');
  await run(
    "INSERT INTO items (group_id, parent_id, type, title, priority, status, created_by) VALUES ($1, $2, 'task', $3, $4, 'todo', $5)",
    [parent.group_id, req.params.id, title.trim(), parent.priority, req.user.id]
  );
  res.redirect(`/groups/${parent.group_id}/tasks`);
});

// PUT /tasks/:id/toggle
router.put('/tasks/:id/toggle', async (req, res) => {
  const item = await getOne('SELECT * FROM items WHERE id = $1', [req.params.id]);
  if (!item) return res.json({ error: 'Not found' });
  const newCompleted = item.is_completed ? 0 : 1;
  await run('UPDATE items SET is_completed = $1, updated_at = NOW() WHERE id = $2', [newCompleted, req.params.id]);
  res.json({ success: true, is_completed: newCompleted });
});

// PUT /tasks/:id/move — status change from drag & drop, assigns the mover
router.put('/tasks/:id/move', async (req, res) => {
  const { status } = req.body;
  if (!['todo', 'in_progress', 'done'].includes(status)) return res.json({ error: 'Invalid status' });
  if (status === 'in_progress' || status === 'done') {
    await run('UPDATE items SET status = $1, assigned_to = $2, updated_at = NOW() WHERE id = $3', [status, req.user.id, req.params.id]);
  } else {
    await run('UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
  }
  res.json({ success: true });
});

// PUT /subtasks/:id
router.put('/subtasks/:id', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.json({ error: req.t('error.title_required') });
  const item = await getOne('SELECT * FROM items WHERE id = $1 AND parent_id IS NOT NULL', [req.params.id]);
  if (!item) return res.json({ error: 'Not found' });
  await run('UPDATE items SET title = $1, updated_at = NOW() WHERE id = $2', [title.trim(), req.params.id]);
  const parent = await getOne('SELECT group_id FROM items WHERE id = $1', [item.parent_id]);
  res.redirect(`/groups/${parent.group_id}/tasks`);
});

// DELETE /subtasks/:id
router.delete('/subtasks/:id', async (req, res) => {
  const item = await getOne('SELECT * FROM items WHERE id = $1 AND parent_id IS NOT NULL', [req.params.id]);
  if (item) {
    await run('DELETE FROM items WHERE id = $1', [req.params.id]);
    const parent = await getOne('SELECT group_id FROM items WHERE id = $1', [item.parent_id]);
    res.redirect(`/groups/${parent.group_id}/tasks`);
  } else {
    res.redirect('/');
  }
});

// POST /tasks/:id/react — toggle one emoji reaction
router.post('/tasks/:id/react', async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.json({ success: false });

  const existing = await getOne(
    'SELECT id FROM reactions WHERE user_id = $1 AND item_id = $2 AND emoji = $3',
    [req.user.id, req.params.id, emoji]
  );

  if (existing) {
    await run('DELETE FROM reactions WHERE id = $1', [existing.id]);
  } else {
    await run(
      'INSERT INTO reactions (user_id, item_id, emoji) VALUES ($1, $2, $3)',
      [req.user.id, req.params.id, emoji]
    );
  }

  const counts = await getAll(
    'SELECT emoji, COUNT(*) as count FROM reactions WHERE item_id = $1 GROUP BY emoji',
    [req.params.id]
  );
  res.json({ success: true, reactions: counts });
});

module.exports = router;
