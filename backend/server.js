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

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize Database
initDB().catch(err => {
  console.error('❌ Failed to initialize database:', err);
});

// Start server ONLY if not in Vercel (CommonJS check)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Daily Task Manager running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
