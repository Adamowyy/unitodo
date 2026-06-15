const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'todos.db');

let db = null;

function getDb() {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb();
  }
  return db;
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      type TEXT NOT NULL CHECK(type IN ('note', 'task')),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 4),
      status TEXT DEFAULT NULL CHECK(status IN ('todo', 'in_progress', 'done', NULL)),
      is_completed INTEGER DEFAULT 0,
      due_date TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE CASCADE
    );
  `);

  // Migrations
  try {
    db.exec('ALTER TABLE items ADD COLUMN due_date TEXT DEFAULT NULL');
  } catch (e) {
    // Column already exists — ignore
  }
}

module.exports = { getDb, initDb };
