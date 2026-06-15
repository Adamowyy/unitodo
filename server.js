require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - method override przez _method w POST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
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

// Routes
const indexRouter = require('./routes/index');
const notesRouter = require('./routes/notes');
const tasksRouter = require('./routes/tasks');

app.use('/', indexRouter);
app.use('/', notesRouter);
app.use('/', tasksRouter);

// 404
app.use((req, res) => {
  res.status(404).render('layout', { 
    title: '404', 
    body: '<h1 class="text-2xl font-bold">404 - Strona nie znaleziona</h1><a href="/" class="text-blue-500 hover:underline mt-4 inline-block">Powrót</a>' 
  });
});

app.listen(PORT, () => {
  console.log(`UniTodo running on http://localhost:${PORT}`);
});
