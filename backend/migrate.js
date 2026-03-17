const { initDB: initSQLite, all: allSQLite } = require('./database');
const { initDB: initPG, pool: pgPool } = require('./database_pg');

async function migrate() {
  console.log('🚀 Starting Migration: SQLite -> PostgreSQL');
  
  try {
    // Init both
    const sqliteDB = await initSQLite();
    await initPG();

    // 1. Get all tasks from SQLite
    const tasks = allSQLite("SELECT * FROM tasks");
    console.log(`📦 Found ${tasks.length} tasks in SQLite.`);

    if (tasks.length === 0) {
      console.log('✅ Nothing to migrate.');
      return;
    }

    // 2. Insert into PostgreSQL
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      for (const task of tasks) {
        console.log(`  ➡ Migrating: ${task.title}`);
        await client.query(`
          INSERT INTO tasks (id, title, description, date, is_done, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            date = EXCLUDED.date,
            is_done = EXCLUDED.is_done,
            updated_at = EXCLUDED.updated_at
        `, [
          task.id,
          task.title,
          task.description,
          task.date,
          task.is_done === 1, // Convert 0/1 to boolean
          task.created_at,
          task.updated_at
        ]);
      }
      
      await client.query('COMMIT');
      console.log('✅ Migration successful!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed during insertion:', err);
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('❌ Initialization failed:', err);
  } finally {
    await pgPool.end();
    process.exit(0);
  }
}

migrate();
