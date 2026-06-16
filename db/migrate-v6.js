// db/migrate-v6.js — Add category column to groups
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v6 migration...');

  try {
    await pool.query("ALTER TABLE groups ADD COLUMN category TEXT DEFAULT ''");
    console.log('  Added category column');
  } catch (e) {
    if (e.code === '42701') {
      console.log('  category already exists, skipping');
    } else {
      throw e;
    }
  }

  console.log('Migration v6 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
