require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes (loaded after DB is ready)
app.use('/api/tasks', require('./routes/tasks'));

// Serve index.html for root and all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// DB initialization — must complete before handling requests on Vercel
let dbReady = initDB().catch(err => {
  console.error('❌ Failed to initialize database:', err);
});

// Start server ONLY if not in Vercel
if (!process.env.VERCEL) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Daily Task Manager running at http://localhost:${PORT}`);
    });
  });
}

// Export for Vercel serverless
module.exports = app;
