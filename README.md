# Daily Routine & Task Manager 🚀

A premium, modern daily task manager built with a stunning 3D glassmorphism UI. It combines productivity tracking with visual elegance and AI-driven insights.

## ✨ Features
- **3D Interactive Pie Chart**: Real-time progress visualization with continuous dynamic motion and 3D tilts.
- **Activity Heatmap**: Track your consistency over the last year with a detailed GitHub-style contributions graph.
- **AI Productivity Assistant**: Integration with **NVIDIA's Qwen 2.5** (via NVAPI) for motivating suggestions and workspace chat.
- **Smart Date Scheduling**: Organize tasks by date with a structured bento-grid layout.
- **Cloud Persistence**: Fully migrated to **PostgreSQL (Supabase)** for professional, scalable data storage.
- **GSD Methodology**: Integrated the **Get Shit Done** development framework for structured, spec-driven updates.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS (Custom Glassmorphism), JavaScript (ES6+), FontAwesome.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (Supabase) – *formerly SQLite*.
- **AI Engine**: NVIDIA AI (Qwen 2.5 120B).

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended).
- A [Supabase](https://supabase.com/) project (PostgreSQL).
- An [NVIDIA AI Foundation](https://build.nvidia.com/) API key.

### 2. Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/manishgounder71-prog/Task-Manager.git
   cd Task-Manager
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 3. Configuration
1. Rename `.env.example` to `.env`.
2. Update the environment variables with your own keys:
   - `DATABASE_URL`: Your Supabase connection string.
   - `NVIDIA_API_KEY`: Your NVIDIA AI API key.
   - `PIXELA_USERNAME`: (Optional) Your Pixe.la username for habit tracking.

### 4. Running the App
Start the server:
```bash
npm start
```
Open your browser at `http://localhost:3000`.

## 📜 Development
This project uses the **GSD (Get Shit Done)** methodology.
- Check the `docs/` folder for technical runbooks.
- Review `SPEC.md` and `ROADMAP.md` for project goals and milestones.

---
Built with ❤️ by [Your Name / Team]