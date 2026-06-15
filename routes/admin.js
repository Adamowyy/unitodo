// routes/admin.js — Admin panel
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');
const { requireAdmin } = require('../auth');

// All routes require admin
router.use(requireAdmin);

// GET /admin — Dashboard with stats
router.get('/', async (req, res) => {
  const stats = {};
  
  // Total users
  const userCount = await getOne('SELECT COUNT(*) as count FROM users');
  stats.totalUsers = parseInt(userCount.count);
  
  // Total groups
  const groupCount = await getOne('SELECT COUNT(*) as count FROM groups');
  stats.totalGroups = parseInt(groupCount.count);
  
  // Total items (tasks + notes)
  const itemCount = await getOne('SELECT COUNT(*) as count FROM items');
  stats.totalItems = parseInt(itemCount.count);
  
  // Recent users (last 20)
  stats.recentUsers = await getAll(
    'SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 20'
  );
  
  // User registrations per day (last 7 days)
  stats.dailyRegistrations = await getAll(`
    SELECT DATE(created_at) as day, COUNT(*) as count 
    FROM users 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at) 
    ORDER BY day DESC
  `);
  
  res.render('layout', {
    title: 'Admin — UniTodo',
    view: 'admin',
    stats,
    user: req.user
  });
});

// POST /admin/users/:id/reset-password — Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  const newPassword = Math.random().toString(36).slice(-10);
  const hash = bcrypt.hashSync(newPassword, 12);
  
  await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  
  res.render('layout', {
    title: 'Admin — UniTodo',
    view: 'admin',
    resetPassword: newPassword,
    resetUser: req.params.id,
    stats: await getStats(),
    user: req.user
  });
});

// POST /admin/users/:id/delete — Delete user and all their data
router.post('/users/:id/delete', async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Don't delete yourself
  if (userId === req.user.id) {
    const stats = await getStats();
    return res.render('layout', {
      title: 'Admin — UniTodo',
      view: 'admin',
      error: 'Nie możesz usunąć samego siebie.',
      stats,
      user: req.user
    });
  }
  
  // Delete user's items, memberships, groups they own, then the user
  await run('DELETE FROM items WHERE group_id IN (SELECT id FROM groups WHERE owner_id = $1)', [userId]);
  await run('DELETE FROM items WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = $1)', [userId]);
  await run('DELETE FROM group_members WHERE group_id IN (SELECT id FROM groups WHERE owner_id = $1)', [userId]);
  await run('DELETE FROM group_members WHERE user_id = $1', [userId]);
  await run('DELETE FROM groups WHERE owner_id = $1', [userId]);
  await run('DELETE FROM users WHERE id = $1', [userId]);
  
  const stats = await getStats();
  res.render('layout', {
    title: 'Admin — UniTodo',
    view: 'admin',
    success: `Użytkownik #${userId} został usunięty.`,
    stats,
    user: req.user
  });
});

async function getStats() {
  const userCount = await getOne('SELECT COUNT(*) as count FROM users');
  const groupCount = await getOne('SELECT COUNT(*) as count FROM groups');
  const itemCount = await getOne('SELECT COUNT(*) as count FROM items');
  const recentUsers = await getAll(
    'SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 20'
  );
  const dailyRegistrations = await getAll(`
    SELECT DATE(created_at) as day, COUNT(*) as count 
    FROM users 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at) 
    ORDER BY day DESC
  `);
  return {
    totalUsers: parseInt(userCount.count),
    totalGroups: parseInt(groupCount.count),
    totalItems: parseInt(itemCount.count),
    recentUsers,
    dailyRegistrations
  };
}

module.exports = router;
