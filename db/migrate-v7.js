// db/migrate-v7.js — Add force_password_change column to users
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running v7 migration...');

  try {
    await pool.query('ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE');
    console.log('  Added force_password_change column');
  } catch (e) {
    if (e.code === '42701') {
      console.log('  force_password_change already exists, skipping');
    } else {
      throw e;
    }
  }

  console.log('Migration v7 complete.');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
