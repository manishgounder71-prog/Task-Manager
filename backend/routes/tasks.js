const express = require('express');
const router = express.Router();
const db = require('../database');
const fetch = require('node-fetch');

// Pixe.la configuration
const PIXELA_USERNAME = process.env.PIXELA_USERNAME;
const PIXELA_TOKEN = process.env.PIXELA_TOKEN;
const PIXELA_GRAPH_ID = process.env.PIXELA_GRAPH_ID;

// Helper: Get local YYYY-MM-DD
function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper: Update Pixe.la graph
async function updatePixela(date) {
  if (!PIXELA_USERNAME || PIXELA_USERNAME === 'your_username' || !PIXELA_TOKEN) {
    console.log('⚠️  Pixe.la not configured, skipping graph update');
    return;
  }
  try {
    const formattedDate = date.replace(/-/g, '');
    const result = await db.get(
      'SELECT COUNT(*) as count FROM tasks WHERE date = ? AND is_done = TRUE',
      [date]
    );
    const quantity = String(result ? result.count : 0);

    await fetch(
      `https://pixe.la/v1/users/${PIXELA_USERNAME}/graphs/${PIXELA_GRAPH_ID}/${formattedDate}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-TOKEN': PIXELA_TOKEN,
        },
        body: JSON.stringify({ quantity }),
      }
    );
    console.log(`📊 Pixe.la updated for ${date}: ${quantity} tasks done`);
  } catch (error) {
    console.error('❌ Pixe.la update failed:', error.message);
  }
}

// GET /api/tasks/health — diagnostic endpoint
router.get('/health', async (req, res) => {
  try {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const dbUrlPrefix = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET';
    
    // Try a simple DB query
    const result = await db.get('SELECT 1 as ok');
    
    res.json({
      status: 'ok',
      database: 'connected',
      dbUrlConfigured: hasDbUrl,
      dbUrlPrefix: dbUrlPrefix,
      testQuery: result,
      env: process.env.VERCEL ? 'vercel' : 'local',
      nodeEnv: process.env.NODE_ENV || 'not set',
      localTime: new Date().toLocaleString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'failed',
      dbUrlConfigured: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      error: error.message,
      code: error.code,
      env: process.env.VERCEL ? 'vercel' : 'local'
    });
  }
});

// GET /api/tasks/stats
router.get('/stats', async (req, res) => {
  try {
    const total = (await db.get('SELECT COUNT(*) as count FROM tasks')) || { count: 0 };
    const completed = (await db.get('SELECT COUNT(*) as count FROM tasks WHERE is_done = TRUE')) || { count: 0 };
    
    const todayDate = getLocalToday();
    const todayTotal = (await db.get('SELECT COUNT(*) as count FROM tasks WHERE date = ?', [todayDate])) || { count: 0 };
    const todayDone = (await db.get('SELECT COUNT(*) as count FROM tasks WHERE date = ? AND is_done = TRUE', [todayDate])) || { count: 0 };

    const dates = await db.all(
      `SELECT DISTINCT date FROM tasks WHERE date <= ? ORDER BY date DESC`,
      [todayDate]
    );

    let streak = 0;
    for (const row of dates) {
      const dayTotal = (await db.get('SELECT COUNT(*) as count FROM tasks WHERE date = ?', [row.date])) || { count: 0 };
      const dayDone = (await db.get('SELECT COUNT(*) as count FROM tasks WHERE date = ? AND is_done = TRUE', [row.date])) || { count: 0 };
      if (dayTotal.count > 0 && Number(dayTotal.count) === Number(dayDone.count)) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      total: Number(total.count),
      completed: Number(completed.count),
      todayTotal: Number(todayTotal.count),
      todayCompleted: Number(todayDone.count),
      streak,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', detail: error.message });
  }
});

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });

    const tasks = await db.all(
      'SELECT * FROM tasks WHERE date = ? ORDER BY is_done ASC, created_at ASC',
      [date]
    );
    // Convert is_done to boolean for frontend
    res.json(tasks.map(t => ({ ...t, is_done: !!t.is_done })));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', detail: error.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title, description, date } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });

    // Server-side duplicate check: same title (case-insensitive) on the same date
    const existing = await db.get(
      'SELECT id FROM tasks WHERE date = ? AND LOWER(title) = LOWER(?)',
      [date, title.trim()]
    );
    if (existing) {
      return res.status(409).json({ error: 'This task is already added for this date!' });
    }

    // Insert and get the ID
    const insertResult = await db.run(
      'INSERT INTO tasks (title, description, date) VALUES (?, ?, ?)',
      [title.trim(), description || '', date]
    );

    const newId = insertResult.lastInsertRowid;
    const now = new Date().toISOString();
    
    // Return the task directly without fetching
    return res.status(201).json({
      id: newId,
      title: title.trim(),
      description: description || '',
      date,
      is_done: false,
      created_at: now,
      updated_at: now
    });
  } catch (error) {
    console.error('Error creating task:', error);
    const errorMsg = error && error.message ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create task', detail: errorMsg });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_done } = req.body;

    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedDone = is_done !== undefined ? is_done : !!existing.is_done;

    await db.run(
      `UPDATE tasks SET title = ?, description = ?, is_done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [updatedTitle, updatedDesc, updatedDone, id]
    );

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

    // Update Pixe.la when marking done
    if (is_done !== undefined && is_done && !existing.is_done) {
      updatePixela(task.date);
    }

    res.json({ ...task, is_done: !!task.is_done });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task', detail: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    updatePixela(existing.date);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task', detail: error.message });
  }
});

// GET /api/tasks/history?days=30
router.get('/history', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);

    // Build a list of the last N date strings
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(dateStr);
    }

    // Fetch aggregated DB rows in one query
    const startDate = dates[0];
    const rows = await db.all(
      `SELECT date,
              COUNT(*) AS total,
              SUM(CASE WHEN is_done = TRUE THEN 1 ELSE 0 END) AS completed
       FROM tasks
       WHERE date >= ?
       GROUP BY date`,
      [startDate]
    );

    // Index DB rows by date
    const byDate = {};
    rows.forEach(r => { byDate[r.date] = r; });

    // Fill in all days (even zeros)
    const history = dates.map(date => ({
      date,
      total:     byDate[date] ? byDate[date].total     : 0,
      completed: byDate[date] ? byDate[date].completed : 0,
    }));

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history', detail: error.message });
  }
});

// POST /api/tasks/ai/suggest
router.post('/ai/suggest', async (req, res) => {
  try {
    const todayDate = getLocalToday();
    const tasks = await db.all('SELECT title, is_done FROM tasks WHERE date = ?', [todayDate]);
    
    if (tasks.length === 0) {
      return res.json({ suggestion: "You haven't added any tasks for today yet. Start by adding a few goals!" });
    }

    // Check if API key is configured
    if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
      return res.json({ suggestion: "AI suggestions are not configured. Add your NVIDIA_API_KEY to enable this feature!" });
    }

    const taskSummary = tasks.map(t => `- ${t.title} (${t.is_done ? 'Done' : 'Pending'})`).join('\n');
    const prompt = `Here is my task list for today:\n${taskSummary}\n\nBased on these tasks, please give me a short, motivating one-sentence suggestion or insight to boost my productivity. Keep it under 25 words.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API Error:', response.status, errorText);
      return res.json({ suggestion: "AI service is temporarily unavailable. Please try again later!" });
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content.trim();
    
    res.json({ suggestion });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.json({ suggestion: "AI suggestion is taking a moment. Try again in a few seconds!" });
  }
});

// POST /api/tasks/ai/chat
router.post('/ai/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Check if API key is configured
    if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
      return res.json({ answer: "AI chat is not configured. Add your NVIDIA_API_KEY to enable this feature!" });
    }

    const todayDate = getLocalToday();
    const tasks = await db.all('SELECT title, is_done FROM tasks WHERE date = ?', [todayDate]);
    
    const taskSummary = tasks.length > 0 
      ? tasks.map(t => `- ${t.title} (${t.is_done ? 'Done' : 'Pending'})`).join('\n')
      : "No tasks recorded for today yet.";

    const prompt = `System Context: You are a workspace productivity assistant.
User's tasks for today:
${taskSummary}

User's Question: ${question}

Please provide a concise, helpful response (under 50 words) based on their tasks and productivity principles.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API Error:', response.status, errorText);
      return res.json({ answer: "AI service is temporarily unavailable. Please try again later!" });
    }

    const data = await response.json();
    const answer = data.choices[0].message.content.trim();
    
    res.json({ answer });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.json({ answer: "AI chat is taking a moment. Try again in a few seconds!" });
  }
});

module.exports = router;
