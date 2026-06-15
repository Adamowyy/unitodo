// db/migrate-v2.js — Add assigned_to column
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v2 migration...');

  try {
    await pool.query(`ALTER TABLE items ADD COLUMN assigned_to INTEGER REFERENCES users(id)`);
    console.log('  Added assigned_to column');
  } catch (e) {
    if (e.code === '42701') {
      console.log('  assigned_to already exists, skipping');
    } else {
      throw e;
    }
  }

  console.log('Migration v2 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
