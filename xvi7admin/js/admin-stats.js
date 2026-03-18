/* ================================================
   XVITYPING ADMIN — STATS LOADER
   xvi7admin/js/admin-stats.js
================================================ */

/* Active panel */
let activePanel = 'overview';

/* Cached chart instances */
const adminCharts = {};

/* ================================================
   INIT
================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();
  await loadDashboard();
});

/* ================================================
   LOAD FULL DASHBOARD DATA
================================================ */

async function loadDashboard() {
  updateLastUpdated('Loading…');

  try {
    const data = await loadAdminDashboard();
    renderOverview(data);
    renderSessionsTable(data.recent, 'sessions-table-wrap');
    updateLastUpdated(new Date().toLocaleTimeString());
  } catch (e) {
    console.error('Dashboard load failed:', e);
    updateLastUpdated('Error — check Firebase config');
  }
}

/* ================================================
   RENDER OVERVIEW PANEL
================================================ */

function renderOverview(data) {
  const today   = data.today   || {};
  const allTime = data.allTime || {};
  const weekly  = data.weekly  || { labels:[], data:[] };

  /* Today stats */
  setText('sc-today-visitors', today.visitors  || 0);
  setText('sc-today-sessions', today.sessions  || 0);
  setText('sc-today-time',     fmtMins(today.totalTime || 0));
  setText('sc-today-wpm',      today.avgWpm    || '--');

  /* All-time stats */
  setText('sc-all-visitors', allTime.visitors  || 0);
  setText('sc-all-sessions', allTime.sessions  || 0);
  setText('sc-all-time',     fmtHours(allTime.totalTime || 0));

  /* Weekly total */
  const weekTotal = (weekly.data || []).reduce((a,b) => a+b, 0);
  setText('sc-week-visitors', weekTotal);

  /* Charts */
  buildAdminChart('visitors-week-chart', 'bar', weekly.labels, weekly.data, 'Visitors', '#00d4b1');

  /* Session duration (mock from daily stats) */
  const sessionData = (data.dailyStats || []).slice(-7).map(d =>
    d.sessions > 0 ? Math.round((d.totalTime || 0) / d.sessions / 60) : 0
  );
  const sessionLabels = (data.dailyStats || []).slice(-7).map(d => d.date?.slice(5) || '');
  if (sessionLabels.length === 0) {
    buildAdminChart('session-chart', 'line', weekly.labels,
      weekly.data.map(() => 0), 'Avg Min', '#a78bfa');
  } else {
    buildAdminChart('session-chart', 'line', sessionLabels, sessionData, 'Avg Min', '#a78bfa');
  }

  /* Language pie — pull from sessions */
  const enCount = (data.recent || []).filter(s => s.lang === 'en').length;
  const bnCount = (data.recent || []).filter(s => s.lang === 'bn').length;
  buildLangPie('lang-pie-chart', enCount || 1, bnCount || 0);
}

/* ================================================
   RENDER SESSIONS TABLE
================================================ */

function renderSessionsTable(sessions, wrapperId) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  if (!sessions || sessions.length === 0) {
    wrap.innerHTML = `<div class="admin-empty">No sessions recorded yet</div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>WPM</th>
          <th>Accuracy</th>
          <th>Errors</th>
          <th>Duration</th>
          <th>Language</th>
          <th>Mode</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map(s => `
          <tr>
            <td><span class="td-wpm">${s.wpm || 0}</span></td>
            <td><span class="td-acc">${s.acc || 0}%</span></td>
            <td><span class="td-err">${s.errors || 0}</span></td>
            <td>${fmtSecs(s.duration || 0)}</td>
            <td>
              <span class="lang-pill ${s.lang || 'en'}">
                ${s.lang === 'bn' ? 'বাংলা' : 'English'}
              </span>
            </td>
            <td>${s.mode || '--'}</td>
            <td style="color:var(--text-muted)">${s.date || '--'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ================================================
   SHOW PANEL
================================================ */

function showPanel(name) {
  /* Hide all panels */
  ['overview','visitors','sessions','weekly','yearly'].forEach(p => {
    const el = document.getElementById(`panel-${p}`);
    if (el) el.style.display = 'none';
  });

  /* Show target */
  const target = document.getElementById(`panel-${name}`);
  if (target) target.style.display = 'block';

  /* Update sidebar active state */
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  event?.target?.closest('.sb-item')?.classList.add('active');

  activePanel = name;
  updatePageTitle(name);

  /* Load panel-specific data */
  if (name === 'visitors')  loadVisitorsPeriod(30);
  if (name === 'sessions')  loadAllSessions();
  if (name === 'weekly')    loadWeeklyPanel();
  if (name === 'yearly')    loadYearlyPanel();
}

/* ================================================
   VISITORS PANEL
================================================ */

async function loadVisitorsPeriod(days, btn) {
  if (btn) {
    document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  const data = await dbGetDailyStats(days);
  const labels = data.map(d => d.date?.slice(5) || '');
  const vals   = data.map(d => d.visitors || 0);
  buildAdminChart('visitors-detail-chart', 'bar', labels, vals, 'Visitors', '#00d4b1');
}

/* ================================================
   SESSIONS PANEL
================================================ */

async function loadAllSessions() {
  const sessions = await dbGetRecentSessions(50);
  renderSessionsTable(sessions, 'all-sessions-wrap');
}

/* ================================================
   WEEKLY PANEL
================================================ */

async function loadWeeklyPanel() {
  const data = await dbGetDailyStats(7);

  const labels   = data.map(d => d.date?.slice(5) || '');
  const visitors = data.map(d => d.visitors  || 0);
  const sessions = data.map(d => d.sessions  || 0);
  const wpms     = data.map(d => d.avgWpm    || 0);

  buildAdminChart('weekly-visitors-chart', 'bar',  labels, visitors, 'Visitors', '#00d4b1');
  buildAdminChart('weekly-sessions-chart', 'bar',  labels, sessions, 'Sessions', '#22c55e');
  buildAdminChart('weekly-wpm-chart',      'line', labels, wpms,     'Avg WPM',  '#a78bfa');

  /* Weekly stat cards */
  const wrap = document.getElementById('weekly-stats');
  if (wrap) {
    const totV = visitors.reduce((a,b)=>a+b,0);
    const totS = sessions.reduce((a,b)=>a+b,0);
    const avgW = wpms.filter(Boolean).length
      ? Math.round(wpms.filter(Boolean).reduce((a,b)=>a+b,0) / wpms.filter(Boolean).length)
      : 0;

    wrap.innerHTML = `
      <div class="stat-card">
        <div class="sc-label">Week Visitors</div>
        <span class="sc-val">${totV}</span>
        <span class="sc-sub">Last 7 days</span>
      </div>
      <div class="stat-card">
        <div class="sc-label">Week Sessions</div>
        <span class="sc-val g">${totS}</span>
        <span class="sc-sub">Typing tests</span>
      </div>
      <div class="stat-card">
        <div class="sc-label">Week Avg WPM</div>
        <span class="sc-val y">${avgW}</span>
        <span class="sc-sub">Across all users</span>
      </div>
    `;
  }
}

/* ================================================
   YEARLY PANEL
================================================ */

async function loadYearlyPanel() {
  const { labels, data } = await dbGetYearlyVisitors();
  buildAdminChart('yearly-chart', 'bar', labels, data, 'Visitors', '#00d4b1');
}

/* ================================================
   UTILITIES
================================================ */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateLastUpdated(msg) {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = `Updated: ${msg}`;
}

function updatePageTitle(panel) {
  const titles = {
    overview: ['Dashboard',  'Overview of site activity'],
    visitors: ['Visitors',   'Visitor analytics and trends'],
    sessions: ['Sessions',   'Typing session records'],
    weekly:   ['This Week',  'Last 7 days breakdown'],
    yearly:   ['Yearly',     'Last 12 months overview'],
  };
  const [title, sub] = titles[panel] || ['Dashboard', ''];
  setText('page-title', title);
  setText('page-sub', sub);
}

function fmtMins(secs) {
  return secs < 60 ? secs + 's' : Math.floor(secs / 60) + 'm';
}

function fmtHours(secs) {
  if (secs < 60)   return secs + 's';
  if (secs < 3600) return Math.floor(secs / 60) + 'm';
  return (secs / 3600).toFixed(1) + 'h';
}

function fmtSecs(secs) {
  if (secs < 60) return secs + 's';
  return Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
}
