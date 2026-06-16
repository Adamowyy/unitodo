// db/migrate-v5.js — Create reactions table
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v5 migration...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, item_id, emoji)
    )
  `);
  console.log('  Created reactions table');

  await pool.query('CREATE INDEX IF NOT EXISTS idx_reactions_item ON reactions(item_id)');
  console.log('  Created reactions index');

  console.log('Migration v5 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
