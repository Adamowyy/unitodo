// routes/admin.js — admin panel
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getAll, getOne, run } = require('../db/pg');
const { requireAdmin } = require('../auth');

const BCRYPT_ROUNDS = 12;
const RECENT_USERS_LIMIT = 20;

// Every route below requires an administrator
router.use(requireAdmin);

/** Collects the dashboard counters and the two lists the panel renders. */
async function getStats() {
  const userCount = await getOne('SELECT COUNT(*) as count FROM users');
  const groupCount = await getOne('SELECT COUNT(*) as count FROM groups');
  const itemCount = await getOne('SELECT COUNT(*) as count FROM items');
  const recentUsers = await getAll(
    'SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT $1',
    [RECENT_USERS_LIMIT]
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

/** Renders the panel with the shared title and the given extras. */
function renderPanel(req, res, extras = {}) {
  res.render('layout', {
    title: `${res.locals.t('page.admin')} — UniTodo`,
    view: 'admin',
    stats: extras.stats,
    resetPassword: extras.resetPassword,
    resetUser: extras.resetUser,
    error: extras.error,
    success: extras.success,
    user: req.user
  });
}

// GET /admin — dashboard with stats
router.get('/', async (req, res) => {
  renderPanel(req, res, { stats: await getStats() });
});

// POST /admin/users/:id/reset-password — generate a new password for one user
router.post('/users/:id/reset-password', async (req, res) => {
  const newPassword = Math.random().toString(36).slice(-10);
  const hash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);

  await run(
    'UPDATE users SET password_hash = $1, force_password_change = TRUE WHERE id = $2',
    [hash, req.params.id]
  );

  renderPanel(req, res, {
    resetPassword: newPassword,
    resetUser: req.params.id,
    stats: await getStats()
  });
});

// POST /admin/users/:id/delete — delete a user and everything they created
router.post('/users/:id/delete', async (req, res) => {
  const t = res.locals.t;
  const userId = parseInt(req.params.id);

  // An administrator cannot delete their own account
  if (userId === req.user.id) {
    return renderPanel(req, res, {
      error: t('error.cannot_delete_self'),
      stats: await getStats()
    });
  }

  await run('DELETE FROM items WHERE group_id IN (SELECT id FROM groups WHERE owner_id = $1)', [userId]);
  await run('DELETE FROM items WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = $1)', [userId]);
  await run('DELETE FROM group_members WHERE group_id IN (SELECT id FROM groups WHERE owner_id = $1)', [userId]);
  await run('DELETE FROM group_members WHERE user_id = $1', [userId]);
  await run('DELETE FROM groups WHERE owner_id = $1', [userId]);
  await run('DELETE FROM users WHERE id = $1', [userId]);

  renderPanel(req, res, {
    success: t('admin.deleted', { id: userId }),
    stats: await getStats()
  });
});

module.exports = router;
