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

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Protected routes
const { requireAuth } = require('./auth');
const indexRouter = require('./routes/index');
const notesRouter = require('./routes/notes');
const tasksRouter = require('./routes/tasks');

app.use('/', requireAuth, indexRouter);
app.use('/', requireAuth, notesRouter);
app.use('/', requireAuth, tasksRouter);

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
