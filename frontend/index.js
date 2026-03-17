/* ============================================
   Daily Tasks — Frontend JS
   ============================================ */

const API_BASE = '/api/tasks';

// ─── State ───────────────────────────────────
let currentDate = todayStr();
let allTasks = [];
let activeFilter = 'all';

// ─── Interactive Effects ─────────────────────
window.handleBentoHover = function(e, el) {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  el.style.setProperty('--mouse-x', `${x}px`);
  el.style.setProperty('--mouse-y', `${y}px`);
};

// ─── Helpers ─────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return `Today — ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
  if (date.getTime() === yesterday.getTime()) return `Yesterday — ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
  if (date.getTime() === tomorrow.getTime()) return `Tomorrow — ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = type === 'success' ? `✅ ${msg}` : `❌ ${msg}`;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ─── API ─────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

async function fetchTasks(date) {
  return apiFetch(`${API_BASE}?date=${date}`);
}

async function createTask(title, description, date) {
  return apiFetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify({ title, description, date }),
  });
}

async function updateTask(id, data) {
  return apiFetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function deleteTask(id) {
  return apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
}

async function fetchStats() {
  return apiFetch(`${API_BASE}/stats`);
}

// ─── Rendering ───────────────────────────────
function getFilteredTasks() {
  if (activeFilter === 'active') return allTasks.filter(t => !t.is_done);
  if (activeFilter === 'done') return allTasks.filter(t => t.is_done);
  return allTasks;
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');

  loadingState.style.display = 'none';
  list.innerHTML = '';

  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(task => {
      list.appendChild(createTaskElement(task));
    });
  }

  updateProgress();
}

function createTaskElement(task) {
  const item = document.createElement('div');
  item.className = `task-item${task.is_done ? ' done' : ''}`;
  item.dataset.id = task.id;

  item.innerHTML = `
    <label class="task-checkbox">
      <input type="checkbox" ${task.is_done ? 'checked' : ''} aria-label="Mark complete">
      <span class="checkmark"></span>
    </label>
    <div class="task-content">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
    </div>
    <div class="task-actions">
      <button class="action-btn edit" title="Edit task" aria-label="Edit">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="action-btn delete" title="Delete task" aria-label="Delete">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6M14 11v6"></path>
        </svg>
      </button>
    </div>
  `;

  // Checkbox toggle
  const checkbox = item.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => handleToggleDone(task.id, checkbox.checked, item));

  // Edit button
  item.querySelector('.action-btn.edit').addEventListener('click', () => openEditModal(task));

  // Delete button
  item.querySelector('.action-btn.delete').addEventListener('click', () => handleDelete(task.id, item));

  // Mouse-position glow for task item (DataStore bento effect)
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    item.style.setProperty('--mx', x + '%');
    item.style.setProperty('--my', y + '%');
  });

  return item;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function updateProgress() {
  const total = allTasks.length;
  const done = allTasks.filter(t => t.is_done).length;
  
  // Header progress (original)
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressCount = document.getElementById('progressCount');

  if (progressSection && progressFill && progressText && progressCount) {
    if (total === 0) {
      progressSection.style.display = 'none';
    } else {
      progressSection.style.display = 'block';
      const pct = Math.round((done / total) * 100);
      progressFill.style.width = `${pct}%`;
      progressText.textContent = `${pct}% complete`;
      progressCount.textContent = `${done}/${total} tasks`;
    }
  }

  // Bento & Pie Chart updates
  renderPieChart(done, total);
  updateBentoTasks();
}

/**
 * Updates the 3D circular progress pie in the bento grid
 */
function renderPieChart(done, total) {
  const pieFace = document.getElementById('progressPie3D');
  const pieRemaining = document.getElementById('progressPie3DRemaining');
  const pieEdge = document.getElementById('progressPie3DEdge');
  const percentText = document.getElementById('progressPiePercent');
  const statsText = document.getElementById('progressPieStats');
  if (!pieFace || !percentText || !statsText) return;

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const circumference = 722; // r=115, 2*PI*115 ≈ 722
  const offset = circumference - (pct / 100) * circumference;
  
  // Dynamic color selection for the 'real' look (Reference-inspired)
  let mainColor = '#818cf8'; // Indigo
  let remainingColor = 'rgba(255,255,255,0.05)';
  
  if (pct >= 100) {
    mainColor = '#10b981'; // Emerald/Green
  } else if (pct > 75) {
    mainColor = '#60a5fa'; // Blue
  } else if (pct > 40) {
    mainColor = '#818cf8'; // Indigo
    remainingColor = 'rgba(244, 63, 94, 0.1)'; // Slight red tint for remaining
  } else if (pct > 0) {
    mainColor = '#f59e0b'; // Amber
    remainingColor = 'rgba(244, 63, 94, 0.15)'; // Red background
  } else {
    mainColor = '#64748b'; // Slate
  }

  // Update segments
  pieFace.style.strokeDasharray = `${circumference}`;
  pieFace.style.strokeDashoffset = `${offset}`;
  pieFace.style.stroke = mainColor;
  
  if (pieRemaining) {
    pieRemaining.style.stroke = remainingColor;
  }
  
  // Update 3D edge
  if (pieEdge) {
    pieEdge.style.strokeDasharray = `${circumference}`;
    pieEdge.style.strokeDashoffset = `${offset}`;
    pieEdge.style.stroke = pct > 0 ? 'rgba(0,0,0,0.6)' : 'transparent';
  }
  
  // Pulse animation for the percentage text when it changes
  if (percentText.textContent !== `${pct}%`) {
    percentText.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.1)', filter: 'brightness(1.5)' },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ], { duration: 400, easing: 'ease-out' });
  }

  percentText.textContent = `${pct}%`;
  statsText.textContent = `${done}/${total} Tasks`;

  // Also update the sparkline
  renderProgressLineGraph(pct);
}

/**
 * Generates and updates a dynamic progress trend sparkline
 */
let progressHistory = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Keep track of the last 10 'states'
function renderProgressLineGraph(currentPct) {
  const path = document.getElementById('sparklinePath');
  const fill = document.getElementById('sparklineFill');
  const trend = document.getElementById('trendDirection');
  if (!path || !fill) return;

  // Add current state to history if it has changed
  if (progressHistory[progressHistory.length - 1] !== currentPct) {
    progressHistory.push(currentPct);
    if (progressHistory.length > 12) progressHistory.shift();
  }

  const width = 200; // Relative SVG width
  const height = 96; // Relative SVG height (was 48)
  const step = width / (progressHistory.length - 1);
  
  let d = `M 0 ${height - (progressHistory[0] / 100) * height}`;
  let fillD = `M 0 ${height} L 0 ${height - (progressHistory[0] / 100) * height}`;

  for (let i = 1; i < progressHistory.length; i++) {
    const x = i * step;
    const y = height - (progressHistory[i] / 100) * height;
    d += ` L ${x} ${y}`;
    fillD += ` L ${x} ${y}`;
  }

  fillD += ` L ${width} ${height} Z`;

  path.setAttribute('d', d);
  fill.setAttribute('d', fillD);

  // Update trend text
  if (trend) {
    const last = progressHistory[progressHistory.length - 1];
    const prev = progressHistory[progressHistory.length - 2] || 0;
    if (last > prev) {
      trend.textContent = 'Increasing';
      trend.className = 'text-[10px] text-emerald-400 font-mono';
    } else if (last < prev) {
      trend.textContent = 'Decreasing';
      trend.className = 'text-[10px] text-rose-400 font-mono';
    } else {
      trend.textContent = 'Stable';
      trend.className = 'text-[10px] text-slate-500 font-mono';
    }
  }
}

/**
 * Updates the small preview list in the "Smart Scheduling" bento card
 */
function updateBentoTasks() {
  const bentoList = document.getElementById('bentoTasksList');
  const bentoStats = document.getElementById('bentoHeaderStats');
  if (!bentoList || !bentoStats) return;

  const remaining = allTasks.filter(t => !t.is_done).length;
  bentoStats.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;

  // Use a larger subset for the preview to populate the table
  const previewTasks = allTasks.slice(0, 10);
  
  if (previewTasks.length === 0) {
    bentoList.innerHTML = '<div class="text-slate-500 text-xs italic px-3 py-4 text-center">No tasks planned for today...</div>';
    return;
  }

  bentoList.innerHTML = previewTasks.map(t => `
    <div class="grid grid-cols-12 gap-3 px-3 py-2.5 bg-white/2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all group/row">
      <div class="col-span-8 flex items-center gap-3 min-width-0">
        <div class="w-1.5 h-1.5 rounded-full ${t.is_done ? 'bg-slate-600' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'} flex-shrink-0"></div>
        <span class="text-xs ${t.is_done ? 'text-slate-500 line-through' : 'text-slate-200'} truncate font-medium">${escapeHtml(t.title)}</span>
      </div>
      <div class="col-span-4 flex items-center justify-end">
        <div class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${t.is_done ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}">
          ${t.is_done ? 'Completed' : 'Active'}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Handles generating AI suggestions
 */
async function handleGenerateAI() {
  const btn = document.getElementById('generateAI');
  const textArea = document.getElementById('aiResponseText');
  
  if (!btn || !textArea) return;

  try {
    const originalBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin text-xl">⏳</span>`;
    textArea.innerHTML = `"Peering into your workspace... one moment."`;

    const data = await apiFetch('/api/tasks/ai/suggest', { method: 'POST' });
    
    textArea.style.opacity = '0';
    textArea.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      textArea.textContent = data.suggestion ? `"${data.suggestion}"` : `"Could not find any tasks to analyze. Try adding some first!"`;
      textArea.style.opacity = '1';
    }, 300);

    btn.innerHTML = originalBtn;
  } catch (err) {
    textArea.innerHTML = `"The AI is a bit shy today. Please try again later."`;
    showToast('AI suggestion failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

/**
 * Handles the interactive Ask AI chat
 */
async function handleAskAI() {
  const input = document.getElementById('aiChatInput');
  const btn = document.getElementById('askAI');
  const textArea = document.getElementById('aiResponseText');
  if (!input || !btn || !textArea) return;

  const question = input.value.trim();
  if (!question) return;

  const originalBtnContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin text-xs">⏳</span>`;
  textArea.innerHTML = `"Thinking about your question..."`;

  try {
    const response = await fetch('/api/tasks/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) throw new Error('Chat failed');
    
    const data = await response.json();
    textArea.innerHTML = data.answer ? `"${data.answer}"` : `"The AI couldn't find an answer. Try rephrasing?"`;
    input.value = '';
  } catch (err) {
    textArea.innerHTML = `"Connection lost with the digital brain. Try again?"`;
    showToast('AI Chat failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnContent;
  }
}


// ─── Date Navigation ─────────────────────────
function updateDateUI() {
  const dateText = document.getElementById('dateText');
  const datePicker = document.getElementById('datePicker');
  const todayBtn = document.getElementById('todayBtn');

  datePicker.value = currentDate;
  dateText.textContent = formatDisplayDate(currentDate);
  // No date-text CSS class needed in new design — just keep text updated
  const isToday = currentDate === todayStr();
  todayBtn.classList.toggle('hidden', isToday);
}

function shiftDate(days) {
  const [year, month, day] = currentDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  currentDate = d.toISOString().split('T')[0];
  loadTasks();
}

// ─── Actions ─────────────────────────────────
async function handleToggleDone(id, isDone, itemEl) {
  try {
    const updated = await updateTask(id, { is_done: isDone });
    const task = allTasks.find(t => t.id === id);
    if (task) task.is_done = updated.is_done;
    // Animate class change
    itemEl.classList.toggle('done', !!updated.is_done);
    itemEl.querySelector('.task-title').style.textDecoration = updated.is_done ? 'line-through' : '';
    showToast(updated.is_done ? 'Task marked complete!' : 'Task marked incomplete');
    updateProgress();
    await refreshStats();
    if (graphLoaded) loadGraph();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function handleDelete(id, itemEl) {
  try {
    itemEl.style.opacity = '0';
    itemEl.style.transform = 'translateX(30px)';
    setTimeout(() => itemEl.remove(), 300);
    await deleteTask(id);
    allTasks = allTasks.filter(t => t.id !== id);
    updateProgress();
    if (allTasks.length === 0) document.getElementById('emptyState').style.display = 'block';
    showToast('Task deleted');
    await refreshStats();
    if (graphLoaded) loadGraph();
  } catch (e) {
    showToast(e.message, 'error');
    itemEl.style.opacity = '';
    itemEl.style.transform = '';
  }
}

// ─── Edit Modal ───────────────────────────────
function openEditModal(task) {
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTitle').value = task.title;
  document.getElementById('editDescription').value = task.description || '';
  document.getElementById('editModal').classList.add('active');
  document.getElementById('editTitle').focus();
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

// ─── Load & Refresh ───────────────────────────
async function loadTasks() {
  const list = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');

  list.innerHTML = '';
  emptyState.style.display = 'none';
  loadingState.style.display = 'block';
  document.getElementById('progressSection').style.display = 'none';

  updateDateUI();

  try {
    allTasks = await fetchTasks(currentDate);
    renderTasks();
  } catch (e) {
    loadingState.style.display = 'none';
    showToast('Failed to load tasks. Is the server running?', 'error');
  }

  await refreshStats();
}

async function refreshStats() {
  try {
    const stats = await fetchStats();
    document.getElementById('streakCount').textContent = stats.streak;
    document.getElementById('completedCount').textContent = `${stats.todayCompleted}/${stats.todayTotal}`;
    // hero section stats
    const hs = document.getElementById('heroStreak');
    const ht = document.getElementById('heroToday');
    if (hs) hs.innerHTML = `${stats.streak}<span class="text-slate-500 font-normal ml-1">day streak</span>`;
    if (ht) ht.innerHTML = `${stats.todayCompleted}/${stats.todayTotal}<span class="text-slate-500 font-normal ml-1">today</span>`;
  } catch (_) {}
}
// ─── Daily Record Graph Logic ───────────────
let graphLoaded = false;
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const OPACITIES = [0.05, 0.18, 0.38, 0.62, 0.92];

async function loadGraph() {
  try {
    // Fetch 365 days for heatmap, 30 days for bar chart
    const [yearHistory, monthHistory] = await Promise.all([
      apiFetch('/api/tasks/history?days=365'),
      apiFetch('/api/tasks/history?days=30'),
    ]);
    renderHeatmap(yearHistory);
    renderBarChart(monthHistory);

    // Bar chart stats (30-day)
    const total30 = monthHistory.reduce((s, d) => s + d.total, 0);
    const done30  = monthHistory.reduce((s, d) => s + d.completed, 0);
    const rate30  = total30 > 0 ? Math.round((done30 / total30) * 100) : 0;
    setEl('statTotal', total30);
    setEl('statDone',  done30);
    setEl('statRate',  `${rate30}%`);
  } catch (e) { console.error('loadGraph error', e); }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderHeatmap(history) {
  const grid    = document.getElementById('heatmap');
  const months  = document.getElementById('heatmapMonths');
  const tooltip = document.getElementById('heatmapTooltip');
  const tDate   = document.getElementById('tooltipDate');
  const tStats  = document.getElementById('tooltipStats');
  if (!grid || !months) return;

  grid.innerHTML   = '';
  months.innerHTML = '';

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split('T')[0];

  // We want to show roughly 1 year (53 weeks to ensure enough space)
  const WEEKS = 53;
  const totalCells = WEEKS * 7;

  // Align: The last cell in the last column should be the next Saturday (to fill the grid)
  // Or simpler: find today's DOW and pad so 'today' is in the right place
  // GitHub style: Rows are Sun (0) to Sat (6).
  // Let's find the Sunday of the week 52 weeks ago.
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalCells - 1));
  // Adjust startDate to the preceding Sunday
  const startDow = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDow);

  const allDates = [];
  const iterDate = new Date(startDate);
  for (let i = 0; i < totalCells; i++) {
    allDates.push(iterDate.toISOString().split('T')[0]);
    iterDate.setDate(iterDate.getDate() + 1);
  }

  const byDate = {};
  history.forEach(r => { byDate[r.date] = r; });

  // Stats: Max Streak and Current Streak
  let maxStreak = 0, currentStreak = 0, tempStreak = 0, activeDays = 0, peakCompleted = 0;
  // Sort historical data keys to iterate chronologically for streak
  const sortedDates = Object.keys(byDate).sort();

  // For streak, we need to check ALL historical data, not just the visible 1 year
  // But for the heatmap display, we use allDates.
  // Actually, let's just use allDates for the summary stats to keep it consistent with the "Daily Record"
  allDates.forEach(date => {
    const d = byDate[date];
    if (d && d.completed > 0) {
      activeDays++;
      peakCompleted = Math.max(peakCompleted, d.completed);
      tempStreak++;
    } else {
      if (date < todayStr) {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
      }
    }
  });
  maxStreak = Math.max(maxStreak, tempStreak);

  // Current Streak (consecutive days leading to today)
  let cStreak = 0;
  for (let i = allDates.length - 1; i >= 0; i--) {
    const date = allDates[i];
    if (date > todayStr) continue; // skip future padding
    const d = byDate[date];
    if (d && d.completed > 0) {
      cStreak++;
    } else {
      if (date < todayStr) break; // streak broken
      // if today has 0 completed, the streak might still be alive if yesterday was active
    }
  }
  currentStreak = cStreak;

  setEl('hmStatActive',  activeDays);
  setEl('hmStatPeak',    peakCompleted ? peakCompleted : '0');
  setEl('hmStatStreak',  currentStreak > 0 ? `${currentStreak}d` : (maxStreak > 0 ? `${maxStreak}d` : '0d'));

  // Month Labels
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const firstIdx = w * 7;
    const firstDate = allDates[firstIdx];
    const monthLabel = document.createElement('div');
    monthLabel.style.minWidth = '14px';
    monthLabel.style.flexShrink = '0';
    if (firstDate) {
      const mNum = parseInt(firstDate.split('-')[1]) - 1;
      if (mNum !== lastMonth) {
        monthLabel.textContent = MONTHS_SHORT[mNum];
        lastMonth = mNum;
      }
    }
    months.appendChild(monthLabel);

    const col = document.createElement('div');
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    col.style.gap = '3px';
    col.style.flexShrink = '0';

    for (let d = 0; d < 7; d++) {
      const idx  = w * 7 + d;
      const date = allDates[idx];
      const data = byDate[date] || { total: 0, completed: 0 };

      let level = 0;
      if (data.total > 0 && data.completed > 0) {
        const rate = data.completed / data.total;
        if (rate < 0.25)      level = 1;
        else if (rate < 0.5)  level = 2;
        else if (rate < 0.8)  level = 3;
        else                  level = 4;
      }

      const cell = document.createElement('div');
      cell.style.width        = '14px';
      cell.style.height       = '14px';
      cell.style.borderRadius = '3px';
      cell.style.flexShrink   = '0';
      cell.style.transition   = 'transform 0.15s, box-shadow 0.15s';

      const isToday = (date === todayStr);
      const isFuture = (date > todayStr);
      const opacity = isFuture ? 0.02 : OPACITIES[level];

      cell.style.background = `rgba(255,255,255,${opacity})`;
      if (isToday) {
        cell.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.4)';
      }

      if (!isFuture) {
        cell.addEventListener('mouseenter', (e) => {
          const dt = new Date(date + 'T00:00:00');
          const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
          const [, m, dn] = date.split('-');
          tDate.textContent  = `${dayName}, ${MONTHS_SHORT[parseInt(m)-1]} ${parseInt(dn)}`;
          tStats.textContent = data.total > 0
            ? `${data.completed}/${data.total} tasks completed (${Math.round(data.completed/data.total*100)}%)`
            : 'No tasks recorded';
          tooltip.style.opacity = '1';
          tooltip.style.left = (e.clientX + 14) + 'px';
          tooltip.style.top  = (e.clientY - 44) + 'px';
          cell.style.transform  = 'scale(1.3)';
          cell.style.zIndex     = '10';
        });
        cell.addEventListener('mousemove', (e) => {
          tooltip.style.left = (e.clientX + 14) + 'px';
          tooltip.style.top  = (e.clientY - 44) + 'px';
        });
        cell.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
          cell.style.transform  = '';
          cell.style.zIndex     = '';
        });
      }
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
}

function renderBarChart(history) {
  const svg       = document.getElementById('barChartSvg');
  const labelsEl  = document.getElementById('barLabels');
  if (!svg) return;
  svg.innerHTML   = '';
  labelsEl.innerHTML = '';

  const W = svg.getBoundingClientRect().width || 500;
  const H = 160;
  const n = history.length;
  const gap  = 3;
  const barW = Math.max(1, (W - gap * (n - 1)) / n);
  const maxT = Math.max(...history.map(d => d.total), 1);

  history.forEach((day, i) => {
    const x      = i * (barW + gap);
    const totalH = (day.total / maxT) * (H - 16);
    const doneH  = (day.completed / maxT) * (H - 16);

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', x); bg.setAttribute('y', H - totalH);
    bg.setAttribute('width', barW); bg.setAttribute('height', totalH);
    bg.setAttribute('fill', 'rgba(255,255,255,0.1)'); bg.setAttribute('rx', 3);
    svg.appendChild(bg);

    if (doneH > 0) {
      const done = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      done.setAttribute('x', x); done.setAttribute('y', H - doneH);
      done.setAttribute('width', barW); done.setAttribute('height', doneH);
      done.setAttribute('fill', 'rgba(255,255,255,0.85)'); done.setAttribute('rx', 3);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      t.textContent = `${day.date}: ${day.completed}/${day.total} done`;
      done.appendChild(t);
      svg.appendChild(done);
    }
  });

  [0, Math.floor((n - 1) / 2), n - 1].forEach(i => {
    const d = history[i];
    if (!d) return;
    const [, m, dn] = d.date.split('-');
    const span = document.createElement('span');
    span.className = 'text-[10px] text-slate-600 font-medium';
    span.textContent = `${m}/${dn}`;
    labelsEl.appendChild(span);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  // Initial load
  loadTasks();

  // Date navigation
  document.getElementById('prevDay').addEventListener('click', () => shiftDate(-1));
  document.getElementById('nextDay').addEventListener('click', () => shiftDate(1));
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = todayStr();
    loadTasks();
  });

  // Click on date text to open date picker
  document.getElementById('dateText').addEventListener('click', () => {
    document.getElementById('datePicker').showPicker?.();
    document.getElementById('datePicker').click();
  });

  // Date picker change
  document.getElementById('datePicker').addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      loadTasks();
    }
  });

  // Add task form
  document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('taskTitle');
    const descEl = document.getElementById('taskDescription');
    const title = titleEl.value.trim();
    const description = descEl.value.trim();

    if (!title) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
      const task = await createTask(title, description, currentDate);
      allTasks.unshift(task);
      titleEl.value = '';
      descEl.value = '';
      renderTasks();
      showToast('Task added!');
      await refreshStats();
      if (graphLoaded) loadGraph();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Task`;
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Edit form submit
  document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('editTaskId').value);
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();

    if (!title) return;

    try {
      const updated = await updateTask(id, { title, description });
      const task = allTasks.find(t => t.id === id);
      if (task) { task.title = updated.title; task.description = updated.description; }
      renderTasks();
      closeEditModal();
      showToast('Task updated!');
      if (graphLoaded) loadGraph();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeEditModal);
  document.getElementById('modalCancel').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
  });

  // Keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditModal();
  });

  // ─── Cursor Glow (DataStore effect) ──────────
  const cursorGlow = document.getElementById('cursor-glow');
  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top  = e.clientY + 'px';
    });
  }

  // ─── Load + Refresh ──────────────────────────
  const graphSection = document.getElementById('daily-record');
  if (graphSection) {
    const graphObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !graphLoaded) {
          graphLoaded = true;
          loadGraph();
        }
      });
    }, { threshold: 0.05 });
    graphObserver.observe(graphSection);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshGraph');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.6s ease';
      await loadGraph();
      setTimeout(() => { refreshBtn.style.transform = ''; }, 700);
    });
  }

  // AI Suggestion button
  const aiBtn = document.getElementById('generateAI');
  if (aiBtn) {
    aiBtn.addEventListener('click', handleGenerateAI);
  }

  // Ask AI button
  const askBtn = document.getElementById('askAI');
  const chatInput = document.getElementById('aiChatInput');
  if (askBtn && chatInput) {
    askBtn.addEventListener('click', handleAskAI);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAskAI();
    });
  }
});
