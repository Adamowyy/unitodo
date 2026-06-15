// db/migrate-v3.js — Add created_by column to items
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v3 migration...');

  try {
    await pool.query('ALTER TABLE items ADD COLUMN created_by INTEGER REFERENCES users(id)');
    console.log('  Added created_by column');
  } catch (e) {
    if (e.code === '42701') {
      console.log('  created_by already exists, skipping');
    } else {
      throw e;
    }
  }

  console.log('Migration v3 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
