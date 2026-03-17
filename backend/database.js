const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let dbInitialized = false;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // Serverless-friendly settings
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function initDB() {
  if (dbInitialized) return;
  
  const p = getPool();
  const client = await p.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        date TEXT NOT NULL,
        is_done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
    
    dbInitialized = true;
    console.log('✅ PostgreSQL Database initialized and ready.');
  } finally {
    client.release();
  }
}

// Convert SQLite ? placeholders to PG $1, $2, etc.
function convertPlaceholders(sql) {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => `$${++paramIndex}`);
}

// Helper: run a query and return all rows
async function all(sql, params = []) {
  await initDB(); // Ensure DB is initialized before any query
  const res = await getPool().query(convertPlaceholders(sql), params);
  return res.rows;
}

// Helper: run a query and return first row
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

// Helper: run an insert/update/delete
async function run(sql, params = []) {
  await initDB();
  const res = await getPool().query(convertPlaceholders(sql), params);
  return { lastInsertRowid: res.rows[0]?.id || null };
}

module.exports = { initDB, all, get, run, getPool };
