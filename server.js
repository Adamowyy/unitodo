require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Method override
app.use((req, res, next) => {
  if (req.body && req.body._method) {
    req.method = req.body._method.toUpperCase();
    delete req.body._method;
  }
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Auth routes (no auth required)
const authRoutes = require('./auth/routes');
app.use('/', authRoutes);

// Public pages (no auth required)
app.get('/privacy', (req, res) => {
  res.render('layout', { title: 'Polityka prywatności — UniTodo', view: 'privacy', user: req.user || null });
});

// Make user available to all views
const { isAdmin } = require('./auth');
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAdmin = req.user ? isAdmin(req.user.id) : false;
  next();
});

// Protected routes
const { requireAuth } = require('./auth');
const indexRouter = require('./routes/index');
const notesRouter = require('./routes/notes');
const tasksRouter = require('./routes/tasks');
const adminRouter = require('./routes/admin');

app.use('/', requireAuth, indexRouter);
app.use('/', requireAuth, notesRouter);
app.use('/', requireAuth, tasksRouter);
app.use('/admin', requireAuth, adminRouter);

// 404
app.use((req, res) => {
  res.status(404).render('layout', {
    title: '404',
    view: '404',
    user: req.user || null
  });
});

// Only start server if not on Vercel
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`UniTodo running on http://localhost:${PORT}`);
  });
}

module.exports = app;
