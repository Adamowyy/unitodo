const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET /groups/:id/tasks - Lista zadań w grupie (z podzadaniami)
router.get('/groups/:id/tasks', (req, res) => {
  const db = getDb();
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.redirect('/');
  
  const query = req.query.q || '';

  // --- sorting ---
  const sort = req.query.sort || 'created_desc';
  let orderClause;
  switch(sort) {
    case 'priority_desc': orderClause = 'priority DESC, created_at DESC'; break;
    case 'priority_asc':  orderClause = 'priority ASC, created_at DESC'; break;
    case 'due_asc':       orderClause = 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at DESC'; break;
    case 'due_desc':      orderClause = 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date DESC, created_at DESC'; break;
    case 'title_asc':     orderClause = 'title ASC, created_at DESC'; break;
    case 'created_asc':   orderClause = 'created_at ASC'; break;
    default:              orderClause = 'created_at DESC';
  }

  // --- priority filter ---
  const filterPriority = parseInt(req.query.filter_priority) || 0;
  let priorityWhere = '';
  let priorityParam = null;
  if (filterPriority >= 2 && filterPriority <= 4) {
    priorityWhere = 'AND priority >= ?';
    priorityParam = filterPriority;
  }

  // --- status filter ---
  const filterStatus = req.query.filter_status || '';

  // --- hide done column ---
  const hideDone = req.query.hide_done === '1';

  // Build query
  let allItems;
  if (query.trim()) {
    const sql = `SELECT * FROM items WHERE group_id = ? AND type = 'task' ${priorityWhere} AND (title LIKE ? OR content LIKE ?) ORDER BY ${orderClause}`;
    const params = priorityParam
      ? [req.params.id, priorityParam, `%${query.trim()}%`, `%${query.trim()}%`]
      : [req.params.id, `%${query.trim()}%`, `%${query.trim()}%`];
    allItems = db.prepare(sql).all(...params);
  } else {
    const sql = `SELECT * FROM items WHERE group_id = ? AND type = ? ${priorityWhere} ORDER BY ${orderClause}`;
    const params = priorityParam
      ? [req.params.id, 'task', priorityParam]
      : [req.params.id, 'task'];
    allItems = db.prepare(sql).all(...params);
  }

  // Podziel na root taski i podzadania
  const rootTasks = allItems.filter(t => !t.parent_id);
  const subtasks = allItems.filter(t => t.parent_id);

  // Pogrupuj podzadania po parent_id
  const subtasksByParent = {};
  for (const st of subtasks) {
    if (!subtasksByParent[st.parent_id]) subtasksByParent[st.parent_id] = [];
    subtasksByParent[st.parent_id].push(st);
  }

  // Podziel root taski według statusu
  const todoTasks = rootTasks.filter(t => t.status === 'todo' || (!t.status && !t.is_completed));
  const inProgressTasks = rootTasks.filter(t => t.status === 'in_progress');
  const doneTasks = rootTasks.filter(t => t.status === 'done' || t.is_completed);

  res.render('layout', {
    title: `Zadania - ${group.name}`,
    group,
    todoTasks,
    inProgressTasks,
    doneTasks,
    subtasksByParent,
    query,
    sort,
    filter_priority: filterPriority,
    filter_status: filterStatus,
    hideDone,
    view: 'tasks'
  });
});

// POST /groups/:id/tasks - Dodaj zadanie
router.post('/groups/:id/tasks', (req, res) => {
  const db = getDb();
  const { title, content, priority, due_date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Tytuł wymagany' });
  db.prepare('INSERT INTO items (group_id, type, title, content, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    req.params.id, 'task', title.trim(), content || '', parseInt(priority) || 1, 'todo', due_date || null
  );
  res.redirect(`/groups/${req.params.id}/tasks`);
});

// PUT /tasks/:id - Edytuj zadanie
router.put('/tasks/:id', (req, res) => {
  const db = getDb();
  const { title, content, priority, status, due_date } = req.body;
  const task = db.prepare('SELECT group_id FROM items WHERE id = ?').get(req.params.id);
  if (!task) return res.redirect('/');
  
  db.prepare("UPDATE items SET title = ?, content = ?, priority = ?, status = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND type = 'task'").run(
    title, content || '', parseInt(priority) || 1, status || 'todo', due_date || null, req.params.id
  );
  res.redirect(`/groups/${task.group_id}/tasks`);
});

// DELETE /tasks/:id - Usuń zadanie (kaskadowo usuwa podzadania)
router.delete('/tasks/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT group_id FROM items WHERE id = ?').get(req.params.id);
  if (!task) return res.redirect('/');
  // Usuń podzadania najpierw (bo foreign key z ON DELETE CASCADE powinien zadziałać, ale dla bezpieczeństwa)
  db.prepare('DELETE FROM items WHERE parent_id = ?').run(req.params.id);
  db.prepare("DELETE FROM items WHERE id = ? AND type = 'task'").run(req.params.id);
  res.redirect(`/groups/${task.group_id}/tasks`);
});

// POST /tasks/:id/subtasks - Dodaj podzadanie
router.post('/tasks/:id/subtasks', (req, res) => {
  const db = getDb();
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Tytuł podzadania wymagany' });
  
  const parent = db.prepare("SELECT group_id, priority FROM items WHERE id = ? AND type = 'task'").get(req.params.id);
  if (!parent) return res.redirect('/');
  
  db.prepare('INSERT INTO items (group_id, parent_id, type, title, priority, status) VALUES (?, ?, ?, ?, ?, ?)').run(
    parent.group_id, req.params.id, 'task', title.trim(), parent.priority, 'todo'
  );
  res.redirect(`/groups/${parent.group_id}/tasks`);
});

// PUT /tasks/:id/toggle - Przełącz is_completed podzadania
router.put('/tasks/:id/toggle', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.json({ error: 'Not found' });
  
  const newCompleted = item.is_completed ? 0 : 1;
  db.prepare('UPDATE items SET is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newCompleted, req.params.id);
  res.json({ success: true, is_completed: newCompleted });
});

// PUT /tasks/:id/move - Zmień status zadania (drag & drop)
router.put('/tasks/:id/move', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!['todo', 'in_progress', 'done'].includes(status)) return res.json({ error: 'Invalid status' });
  
  db.prepare('UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// PUT /subtasks/:id - Edytuj tytuł podzadania
router.put('/subtasks/:id', (req, res) => {
  const db = getDb();
  const { title } = req.body;
  if (!title || !title.trim()) return res.json({ error: 'Tytuł wymagany' });

  const item = db.prepare('SELECT * FROM items WHERE id = ? AND parent_id IS NOT NULL').get(req.params.id);
  if (!item) return res.json({ error: 'Not found' });

  db.prepare('UPDATE items SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title.trim(), req.params.id);

  // Find the root parent to redirect properly
  const parent = db.prepare('SELECT group_id FROM items WHERE id = ?').get(item.parent_id);
  if (parent) {
    res.redirect(`/groups/${parent.group_id}/tasks`);
  } else {
    res.redirect('/');
  }
});

module.exports = router;
