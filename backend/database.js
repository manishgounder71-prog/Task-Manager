const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Neon in many environments
  }
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create tasks table if not exists
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

    // Create index for faster date queries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
    
    console.log('✅ PostgreSQL Database initialized and ready.');
  } finally {
    client.release();
  }
}

// Helper: run a query and return all rows
async function all(sql, params = []) {
  // Convert SQLite ? to PG $1, $2, etc. (Simplistic version)
  const convertedSql = sql.replace(/\?/g, (_, offset) => {
    let count = (sql.substring(0, offset).match(/\?/g) || []).length + 1;
    return `$${count}`;
  });
  
  const res = await pool.query(convertedSql, params);
  return res.rows;
}

// Helper: run a query and return first row
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

// Helper: run an insert/update/delete
async function run(sql, params = []) {
  const convertedSql = sql.replace(/\?/g, (_, offset) => {
    let count = (sql.substring(0, offset).match(/\?/g) || []).length + 1;
    return `$${count}`;
  });

  const res = await pool.query(convertedSql, params);
  return { lastInsertRowid: res.rows[0]?.id || null };
}

module.exports = { initDB, all, get, run, pool };
