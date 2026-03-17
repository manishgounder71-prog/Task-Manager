# 📋 Daily Routine & Task Manager — Complete Documentation

> A premium, full-stack daily task management application featuring a 3D glassmorphism UI, AI-powered productivity insights, real-time progress visualization, and cloud-hosted PostgreSQL persistence.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/manishgounder71-prog/Task-Manager.git)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com)

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Frontend](#-frontend-documentation)
6. [Backend](#-backend-documentation)
7. [Database](#-database-documentation)
8. [API Reference](#-api-reference)
9. [AI Integration](#-ai-integration)
10. [Environment & Configuration](#-environment--configuration)
11. [Deployment](#-deployment)
12. [Security](#-security)
13. [Getting Started](#-getting-started)
14. [Development](#-development)
15. [Roadmap](#-roadmap)

---

## 🎯 Project Overview

**Daily Routine & Task Manager** is a production-grade, single-page web application designed to help users organize, track, and optimize their daily tasks. It goes beyond basic to-do lists by offering:

- **Visual Progress Tracking** with a 3D animated pie chart, sparkline graphs, and a GitHub-style activity heatmap.
- **AI-Powered Coaching** using NVIDIA's Qwen 2.5 model for motivational suggestions and interactive Q&A.
- **Cloud Persistence** with PostgreSQL (Supabase) for reliable, scalable data storage.
- **Premium Design** with glassmorphism, particle effects, 3D parallax, and micro-animations.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────┐
│                   CLIENT                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ index.   │  │ index.   │  │ index.   │    │
│  │ html     │  │ css      │  │ js       │    │
│  │ (SPA)    │  │ (Styles) │  │ (Logic)  │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│         │              │             │        │
│         └──────────────┴─────────────┘        │
│                    │                          │
│              fetch('/api/...')                 │
└────────────────────┬──────────────────────────┘
                     │ HTTP (JSON)
┌────────────────────┴──────────────────────────┐
│                   SERVER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ server.  │  │ routes/  │  │database. │    │
│  │ js       │→ │ tasks.js │→ │ js       │    │
│  │ (Express)│  │ (Router) │  │ (pg Pool)│    │
│  └──────────┘  └──────────┘  └──────────┘    │
│         │              │             │        │
│         │              │    ┌────────┘        │
│         │              │    │                 │
└─────────┬──────────────┴────┴─────────────────┘
          │                   │
          │ NVIDIA API        │ PostgreSQL
          ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ NVIDIA AI    │    │ Supabase         │
│ (Qwen 2.5)  │    │ (PostgreSQL DB)  │
└──────────────┘    └──────────────────┘
```

### Request Flow
1. **User Action** → Frontend sends `fetch()` to `/api/tasks/*`
2. **Express Router** → `server.js` routes to `routes/tasks.js`
3. **Database Layer** → `database.js` executes parameterized SQL via `pg` Pool
4. **Response** → JSON returned to frontend → UI re-rendered

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose | Version |
|---|---|---|
| **HTML5** | Page structure & semantic markup | — |
| **Tailwind CSS** | Utility-first responsive styling | CDN (latest) |
| **Vanilla CSS** | Custom animations, glassmorphism, particles | Custom |
| **JavaScript (ES6+)** | Application logic, DOM manipulation, API calls | Vanilla |
| **Inter (Google Fonts)** | Typography | Variable weights (300–800) |
| **FontAwesome** | Icons (via CDN) | — |

### Backend
| Technology | Purpose | Version |
|---|---|---|
| **Node.js** | JavaScript runtime | v16+ |
| **Express.js** | HTTP server & REST API framework | ^4.18.2 |
| **cors** | Cross-Origin Resource Sharing middleware | ^2.8.5 |
| **dotenv** | Environment variable management | ^16.3.1 |
| **node-fetch** | HTTP client for NVIDIA API calls | ^2.7.0 |
| **pg** | PostgreSQL client (connection pooling) | ^8.20.0 |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Supabase** | Managed PostgreSQL hosting with SSL |

### AI
| Technology | Purpose |
|---|---|
| **NVIDIA AI (Qwen 2.5 120B)** | Productivity suggestions & interactive chat |

### DevOps & Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Serverless deployment platform |
| **Git / GitHub** | Version control & repository hosting |
| **Pixe.la** | Optional habit-tracking graph API |

---

## 📁 Project Structure

```
daily-routine/
├── backend/
│   ├── server.js           # Express server entry point
│   ├── database.js         # PostgreSQL connection pool & query helpers
│   ├── database_sqlite.js  # Legacy SQLite adapter (deprecated)
│   ├── migrate.js          # Database migration utilities
│   └── routes/
│       └── tasks.js        # All API route handlers
├── frontend/
│   ├── index.html          # Single-page application (806 lines)
│   ├── index.css           # Custom animations & DataStore theme (294 lines)
│   └── index.js            # Application logic & rendering (961 lines)
├── docs/
│   ├── runbook.md          # Operational runbook
│   ├── model-selection-playbook.md
│   └── token-optimization-guide.md
├── .env                    # Environment variables (GITIGNORED)
├── .env.example            # Template for environment setup
├── .gitignore              # Security: excludes .env, node_modules, *.db
├── package.json            # Dependencies & scripts
├── vercel.json             # Vercel deployment configuration
├── SPEC.md                 # Project specification
├── ROADMAP.md              # Development roadmap
└── README.md               # This documentation
```

---

## 🎨 Frontend Documentation

### Single-Page Application (SPA)
The entire UI lives in `frontend/index.html` (806 lines). There is no framework — it's built with **vanilla JavaScript** for maximum performance and zero build step.

### Core Sections

| Section | Description | Key Elements |
|---|---|---|
| **Hero** | Landing section with animated orbs and call-to-action | Gradient background, floating animation |
| **Features Grid** | Bento-grid layout showcasing app capabilities | Glass cards with hover glow effects |
| **Dashboard** | Main task management interface | Task list, add form, filter buttons |
| **Daily Progress** | Real-time completion tracking | 3D SVG pie chart, sparkline graph |
| **Smart Scheduling** | Date-based task navigation | Date picker, prev/next arrows, "Today" button |
| **AI Assistant** | AI-powered productivity coaching | Suggestion generator, interactive chat input |
| **Activity Heatmap** | GitHub-style yearly contribution grid | Color-coded cells, streak stats, tooltips |
| **Daily Record** | Historical bar chart of task completion | SVG bar chart with date labels |
| **CTA & Footer** | Call-to-action and site footer | Animated gradient buttons |

### Design System

#### Glassmorphism
```css
.glass-card {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
}
```

#### Color Palette
| Color | Hex | Usage |
|---|---|---|
| Background | `#030712` (gray-950) | Page background |
| Surface | `rgba(255,255,255,0.03)` | Card backgrounds |
| Border | `rgba(255,255,255,0.08)` | Card borders |
| Text Primary | `#ffffff` | Headings |
| Text Secondary | `#94a3b8` (slate-400) | Body text |
| Accent Indigo | `#818cf8` | Progress, highlights |
| Accent Emerald | `#10b981` | Success states |
| Accent Rose | `#f43f5e` | Warnings, delete |

#### Animations (in `index.css`)

| Animation | Duration | Purpose |
|---|---|---|
| `orb-float` | 20s | Background orb movement |
| `slide-up` | 1s | Entrance animation for sections |
| `task-in` | 0.3s | New task item appearance |
| `toast-in` | 0.3s | Toast notification slide-up |
| `particle-float` | 3–6s | Floating particles behind pie chart |
| `shimmer` | 2s | Reflective shimmer on progress elements |
| `path-draw` | 1.5s | Sparkline self-drawing effect |
| `pulse-glow` | 3s | Pulsing neon glow on 100% completion |
| `spin` | — | Loading spinner rotation |

#### 3D Parallax Tilt
The "Daily Progress" card responds to mouse movement with a 3D perspective transform:
```javascript
pieContainer.style.transform = 
  `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
```

#### Particle System
15 floating particles are dynamically created behind the pie chart:
```javascript
function initParticles() {
  // Creates div elements with random sizes (2-6px)
  // Animated via CSS @keyframes particle-float
  // Random delays for organic feel
}
```

### JavaScript Architecture (`index.js` — 961 lines)

#### State Management
```javascript
const API_BASE = '/api/tasks';  // Base URL for all API calls
let currentDate = todayStr();   // Currently selected date (YYYY-MM-DD)
let allTasks = [];              // In-memory task array
let activeFilter = 'all';      // Filter: 'all' | 'active' | 'done'
```

#### Key Functions

| Function | Lines | Purpose |
|---|---|---|
| `apiFetch(url, options)` | 90–100 | Centralized HTTP client with error handling |
| `fetchTasks(date)` | 102–104 | Load tasks for a specific date |
| `renderTasks()` | 135–155 | Render task list to DOM |
| `createTaskElement(task)` | 157–205 | Build individual task DOM node |
| `updateProgress()` | 214–243 | Update header progress bar + bento pie |
| `updatePieChart(completed, total)` | 248–293 | Animate 3D SVG pie chart with counter |
| `renderProgressLineGraph(pct)` | 298–380 | Draw/animate sparkline trend graph |
| `shiftDate(days)` | 473–479 | Navigate to prev/next day |
| `loadGraph()` | 560–575 | Fetch history and render heatmap + bar chart |
| `renderHeatmap(history)` | 585–760 | Build GitHub-style activity grid |
| `renderBarChart(history)` | 762–808 | Draw SVG bar chart |
| `handleGenerateAI()` | 383–419 | Trigger AI productivity suggestion |
| `handleAskAI()` | 424–457 | Send question to AI chat |

---

## ⚙️ Backend Documentation

### Server (`backend/server.js` — 47 lines)

The Express server handles three responsibilities:
1. **Static File Serving** — Serves the `frontend/` directory
2. **API Routing** — Routes `/api/tasks/*` to the task router
3. **SPA Fallback** — All other routes serve `index.html`

#### Middleware Stack
```
Request → cors() → express.json() → static files → API routes → SPA fallback → Error handler
```

#### Vercel Compatibility
```javascript
// Only start HTTP listener when running locally
if (!process.env.VERCEL) {
  dbReady.then(() => app.listen(PORT));
}
// Export app for Vercel's serverless runtime
module.exports = app;
```

### Database Layer (`backend/database.js` — 68 lines)

#### Connection Pool
Uses `pg.Pool` with SSL for Supabase connectivity:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

#### Query Helpers
The database module provides three helper functions that automatically convert SQLite-style `?` placeholders to PostgreSQL `$1, $2, ...` format:

| Function | Returns | Use Case |
|---|---|---|
| `all(sql, params)` | `Row[]` | SELECT queries returning multiple rows |
| `get(sql, params)` | `Row \| null` | SELECT queries returning one row |
| `run(sql, params)` | `{ lastInsertRowid }` | INSERT / UPDATE / DELETE operations |

### Route Handlers (`backend/routes/tasks.js` — 297 lines)

All routes are mounted at `/api/tasks`:

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/api/tasks?date=YYYY-MM-DD` | `router.get('/')` | Fetch all tasks for a date |
| `POST` | `/api/tasks` | `router.post('/')` | Create a new task |
| `PUT` | `/api/tasks/:id` | `router.put('/:id')` | Update a task (title, description, is_done) |
| `DELETE` | `/api/tasks/:id` | `router.delete('/:id')` | Delete a task |
| `GET` | `/api/tasks/stats` | `router.get('/stats')` | Get overall and daily statistics |
| `GET` | `/api/tasks/history?days=N` | `router.get('/history')` | Get aggregated history (up to 365 days) |
| `POST` | `/api/tasks/ai/suggest` | `router.post('/ai/suggest')` | Generate AI productivity suggestion |
| `POST` | `/api/tasks/ai/chat` | `router.post('/ai/chat')` | Interactive AI chat Q&A |

---

## 🗄️ Database Documentation

### Provider
**Supabase** — Managed PostgreSQL with automatic SSL, web dashboard, and connection pooling.

### Connection String Format
```
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

### Schema

#### `tasks` Table

| Column | Type | Default | Constraints | Description |
|---|---|---|---|---|
| `id` | `SERIAL` | Auto-increment | `PRIMARY KEY` | Unique task identifier |
| `title` | `TEXT` | — | `NOT NULL` | Task title/name |
| `description` | `TEXT` | `''` | — | Optional task description |
| `date` | `TEXT` | — | `NOT NULL` | Task date (`YYYY-MM-DD` format) |
| `is_done` | `BOOLEAN` | `FALSE` | — | Completion status |
| `created_at` | `TIMESTAMPTZ` | `CURRENT_TIMESTAMP` | — | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `CURRENT_TIMESTAMP` | — | Last modification timestamp |

#### Indexes

| Index Name | Column | Purpose |
|---|---|---|
| `idx_tasks_date` | `date` | Optimizes date-based queries (primary access pattern) |

### Example Queries

```sql
-- Get all tasks for today
SELECT * FROM tasks WHERE date = '2026-03-18' ORDER BY is_done ASC, created_at ASC;

-- Get completion stats
SELECT COUNT(*) AS total,
       SUM(CASE WHEN is_done = TRUE THEN 1 ELSE 0 END) AS completed
FROM tasks WHERE date >= '2026-01-01'
GROUP BY date;

-- Calculate streak
SELECT DISTINCT date FROM tasks WHERE date <= '2026-03-18' ORDER BY date DESC;
```

### Accessing the Database

1. **Supabase Dashboard**: [supabase.com](https://supabase.com) → Table Editor → `tasks`
2. **Supabase SQL Editor**: Run raw SQL queries directly
3. **CLI Tools**: Connect via `psql`, DBeaver, TablePlus, or pgAdmin using your connection string
4. **Application API**: `GET /api/tasks?date=2026-03-18` returns JSON

---

## 📡 API Reference

### `GET /api/tasks?date=YYYY-MM-DD`
Fetch all tasks for a specific date.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Date in `YYYY-MM-DD` format |

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Complete documentation",
    "description": "Write comprehensive README",
    "date": "2026-03-18",
    "is_done": false,
    "created_at": "2026-03-18T10:00:00.000Z",
    "updated_at": "2026-03-18T10:00:00.000Z"
  }
]
```

---

### `POST /api/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "date": "2026-03-18"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "date": "2026-03-18",
  "is_done": false,
  "created_at": "2026-03-18T12:00:00.000Z",
  "updated_at": "2026-03-18T12:00:00.000Z"
}
```

---

### `PUT /api/tasks/:id`
Update an existing task. All fields are optional (partial update).

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "is_done": true
}
```

**Response:** `200 OK` — Returns the full updated task object.

---

### `DELETE /api/tasks/:id`
Delete a task by ID.

**Response:** `200 OK`
```json
{ "message": "Task deleted successfully" }
```

---

### `GET /api/tasks/stats`
Get overall and daily completion statistics.

**Response:** `200 OK`
```json
{
  "total": 45,
  "completed": 32,
  "todayTotal": 5,
  "todayCompleted": 3,
  "streak": 7
}
```

---

### `GET /api/tasks/history?days=N`
Get aggregated daily completion history.

**Query Parameters:**
| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `days` | `number` | 30 | 365 | Number of days to look back |

**Response:** `200 OK`
```json
[
  { "date": "2026-03-16", "total": 4, "completed": 4 },
  { "date": "2026-03-17", "total": 6, "completed": 3 },
  { "date": "2026-03-18", "total": 5, "completed": 2 }
]
```

---

### `POST /api/tasks/ai/suggest`
Generate an AI-powered productivity suggestion based on today's tasks.

**Response:** `200 OK`
```json
{
  "suggestion": "Focus on your hardest task first — momentum builds from conquering challenges early!"
}
```

---

### `POST /api/tasks/ai/chat`
Ask the AI a productivity question with context from today's tasks.

**Request Body:**
```json
{ "question": "How should I prioritize my remaining tasks?" }
```

**Response:** `200 OK`
```json
{
  "answer": "Start with 'Complete documentation' as it has the highest impact. Then tackle smaller tasks for quick wins."
}
```

---

## 🤖 AI Integration

### Provider
**NVIDIA AI Foundation** — [build.nvidia.com](https://build.nvidia.com/)

### Model
**Qwen 2.5 120B (A10B variant)**
- Model ID: `qwen/qwen3.5-122b-a10b`
- Max tokens: 100 (suggestions) / 150 (chat)
- Temperature: 0.7

### API Endpoint
```
POST https://integrate.api.nvidia.com/v1/chat/completions
```

### How It Works
1. **Suggestion**: Fetches today's task list → builds a prompt → asks for a one-sentence motivational insight (≤25 words)
2. **Chat**: Takes user's question + today's task context → returns a concise, actionable answer (≤50 words)

### Authentication
Requires `NVIDIA_API_KEY` in environment variables, passed as `Authorization: Bearer <key>`.

---

## 🔧 Environment & Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `NVIDIA_API_KEY` | **Yes** | NVIDIA AI API key for suggestions & chat |
| `PIXELA_USERNAME` | No | Pixe.la username for habit tracking |
| `PIXELA_TOKEN` | No | Pixe.la authentication token |
| `PIXELA_GRAPH_ID` | No | Pixe.la graph identifier |
| `VERCEL` | Auto | Set automatically by Vercel runtime |

### Setup
```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env
```

---

## 🚀 Deployment

### Vercel (Production)

The project includes a `vercel.json` that routes all requests through the Express server:

```json
{
  "version": 2,
  "builds": [
    { "src": "backend/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/server.js" },
    { "src": "/(.*)", "dest": "backend/server.js" }
  ]
}
```

**Steps:**
1. Push your code to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com)
3. Add environment variables under **Settings → Environment Variables**:
   - `DATABASE_URL`
   - `NVIDIA_API_KEY`
4. Deploy — Vercel auto-builds on every push

### Local Development
```bash
npm install
npm start
# → http://localhost:3000
```

---

## 🔒 Security

| Measure | Implementation |
|---|---|
| **API Key Protection** | All secrets stored in `.env`, never committed |
| **`.gitignore`** | Excludes `.env`, `node_modules/`, `*.db`, `*.sqlite` |
| **`.env.example`** | Template with placeholder values for safe sharing |
| **SSL Database** | `ssl: { rejectUnauthorized: false }` for Supabase |
| **Input Validation** | Server-side checks for required fields |
| **Error Handling** | Global error middleware prevents stack trace leaks |
| **CORS** | Enabled via `cors()` middleware |
| **Parameterized Queries** | All SQL uses `$1, $2` placeholders (no SQL injection) |

---

## 🏁 Getting Started

### Prerequisites
- **Node.js** v16 or higher
- **npm** (comes with Node.js)
- A **Supabase** project ([supabase.com](https://supabase.com))
- An **NVIDIA AI** API key ([build.nvidia.com](https://build.nvidia.com/))

### Quick Start
```bash
# 1. Clone
git clone https://github.com/manishgounder71-prog/Task-Manager.git
cd Task-Manager

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your DATABASE_URL and NVIDIA_API_KEY

# 4. Run
npm start
# Open http://localhost:3000
```

---

## 🛠️ Development

### NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node backend/server.js` | Start the production server |
| `npm run dev` | `node backend/server.js` | Start in development mode |

### Dependencies

| Package | Purpose |
|---|---|
| `express` | Web server framework |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variable loading |
| `pg` | PostgreSQL driver |
| `node-fetch` | HTTP client for external APIs |
| `sql.js` | Legacy SQLite support (deprecated) |

---

## 🗺️ Roadmap

### ✅ Completed
- Task CRUD with date-based organization
- 3D animated pie chart with parallax tilt
- Floating particle system
- Self-drawing sparkline graphs
- GitHub-style activity heatmap
- AI productivity suggestions & chat
- PostgreSQL migration (Supabase)
- Vercel deployment
- Security hardening

### 🔮 Planned
- User authentication & accounts
- Drag-and-drop task reordering
- Task categories & tags
- Recurring task templates
- Personalized AI productivity reports
- Dark/Light theme toggle
- Mobile PWA support
- Export data (CSV/JSON)

---

## 📄 License

This project is built for personal productivity and learning purposes.

---

Built with ❤️ by **Manish Gounder**