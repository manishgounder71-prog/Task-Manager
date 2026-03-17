const path = require('path');
const fs = require('fs');

let db;
let SQL;
const dbFilePath = path.join(__dirname, 'tasks.db');

async function initDB() {
  SQL = await require('sql.js')();

  // Load existing DB from file or create fresh
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tasks table if not exists
  db.run(`
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

  // Create index for faster date queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);

  saveDB();
  console.log('✅ Database initialized successfully');
  return db;
}

// Persist DB to disk after every write
function saveDB() {
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

// Helper: run a query and return all rows as objects
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object (or null)
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// Helper: run an insert/update/delete and return lastInsertRowid
function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
  // Read last_insert_rowid in the same connection state
  const result = db.exec('SELECT last_insert_rowid() as id');
  const rowid = (result.length > 0 && result[0].values.length > 0)
    ? result[0].values[0][0]
    : null;
  return { lastInsertRowid: rowid };
}

module.exports = { initDB, all, get, run };
