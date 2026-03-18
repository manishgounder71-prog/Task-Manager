const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let sqliteDb = null;
let SQL = null;
let dbInitialized = false;
let dbType = 'postgres'; 

const dbFilePath = path.join(__dirname, 'tasks.db');

async function initDB() {
  if (dbInitialized) return;
  console.log('📦 Database System Revision: 2026-03-18-v3 (Auto-Fallback Enabled)');

  if (process.env.DATABASE_URL) {
    dbType = 'postgres';
    try {
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
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL. Check your DATABASE_URL.');
      throw err;
    }
  } else {
    dbType = 'sqlite';
    console.warn('⚠️ DATABASE_URL not set. Falling back to SQLite (Non-persistent on Render).');
    
    SQL = await require('sql.js')();
    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      sqliteDb = new SQL.Database(fileBuffer);
    } else {
      sqliteDb = new SQL.Database();
    }

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        date TEXT NOT NULL,
        is_done INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )
    `);
    sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
    
    saveSQLiteDB();
    dbInitialized = true;
    console.log('✅ SQLite Database initialized and ready.');
  }
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

function saveSQLiteDB() {
  if (dbType === 'sqlite' && sqliteDb) {
    const data = sqliteDb.export();
    fs.writeFileSync(dbFilePath, Buffer.from(data));
  }
}

function convertPlaceholders(sql) {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => `$${++paramIndex}`);
}

async function all(sql, params = []) {
  await initDB();
  if (dbType === 'postgres') {
    const res = await getPool().query(convertPlaceholders(sql), params);
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare(sql.replace(/RETURNING\s+\w+/gi, ''));
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  await initDB();
  if (dbType === 'postgres') {
    // Add RETURNING id if not already present
    const needsReturning = !sql.toLowerCase().includes('returning');
    const query = needsReturning ? sql + ' RETURNING id' : sql;
    const res = await getPool().query(convertPlaceholders(query), params);
    return { lastInsertRowid: res.rows[0]?.id || null };
  } else {
    // Strip 'RETURNING id' or similar for SQLite
    const sqliteSql = sql.replace(/RETURNING\s+\w+/gi, '');
    sqliteDb.run(sqliteSql, params);
    saveSQLiteDB();
    const result = sqliteDb.exec('SELECT last_insert_rowid() as id');
    const rowid = (result.length > 0 && result[0].values.length > 0)
      ? result[0].values[0][0]
      : null;
    return { lastInsertRowid: rowid };
  }
}

module.exports = { initDB, all, get, run, getPool };
