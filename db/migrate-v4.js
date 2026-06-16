// db/migrate-v4.js — Add 'comment' to items type check constraint
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v4 migration...');

  // Drop old constraint and add new one with 'comment'
  await pool.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check');
  await pool.query("ALTER TABLE items ADD CONSTRAINT items_type_check CHECK (type IN ('note', 'task', 'comment'))");
  console.log('  Updated items_type_check to include comment');

  console.log('Migration v4 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
