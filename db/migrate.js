// db/migrate.js — One-shot schema migration for PostgreSQL (Neon/Vercel)
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running migration...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      invite_code UUID UNIQUE DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'member' CHECK(role IN ('owner', 'member')),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      parent_id INTEGER DEFAULT NULL REFERENCES items(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('note', 'task')),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 4),
      status TEXT DEFAULT NULL CHECK(status IN ('todo', 'in_progress', 'done', NULL)),
      due_date TEXT DEFAULT NULL,
      is_completed INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_items_group ON items(group_id);
    CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_groups_invite ON groups(invite_code);
  `);

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
