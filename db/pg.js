// db/pg.js — PostgreSQL connection pool for Vercel serverless
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000
    });
  }
  return pool;
}

// Query helper — use for all DB queries
async function query(sql, params = []) {
  const client = getPool();
  const result = await client.query(sql, params);
  return result;
}

// Get one row
async function getOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

// Get all rows
async function getAll(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

// Run insert/update/delete — returns full result
async function run(sql, params = []) {
  return await query(sql, params);
}

module.exports = { getPool, query, getOne, getAll, run };
