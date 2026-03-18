/* ================================================
   XVITYPING — STATS & RESULTS
   stats.js
================================================ */

/* ================================================
   CORE CALCULATIONS
================================================ */

/* Words Per Minute — standard: 5 chars = 1 word */
function calcWPM() {
  if (!S.t0) return 0;
  const mins = (Date.now() - S.t0) / 60000;
  if (mins <= 0) return 0;
  return Math.max(0, Math.round((S.correctKS / 5) / mins));
}

/* Accuracy — correct keystrokes / total keystrokes */
function calcAcc() {
  if (S.totalKS === 0) return 100;
  return Math.max(0, Math.round((S.correctKS / S.totalKS) * 100));
}

/* Characters Per Minute */
function calcCPM() {
  if (!S.t0) return 0;
  const mins = (Date.now() - S.t0) / 60000;
  if (mins <= 0) return 0;
  return Math.round(S.correctKS / mins);
}

/* ================================================
   SHOW RESULTS SCREEN
================================================ */

function showResults(wpm, acc, cpm, errs, elapsed, isNewBest) {
  /* Fill result hero */
  setText('r-wpm',  wpm);
  setText('r-acc',  acc + '%');
  setText('r-err',  errs);
  setText('r-time', formatTime(elapsed));
  setText('r-chars', S.correctKS);
  setText('r-cpm',  cpm);

  /* Best badge */
  const bestWrap = el('best-wrap');
  if (bestWrap) bestWrap.style.display = isNewBest ? 'block' : 'none';

  /* Lesson complete badge */
  const lessonBadge = el('lesson-complete-badge');
  if (lessonBadge && S.lesson) {
    const done = storageIsLessonDone(S.lesson.id);
    lessonBadge.classList.toggle('show', done);
  } else if (lessonBadge) {
    lessonBadge.classList.remove('show');
  }

  /* Breakdown grid items */
  setText('rb-wpm',      wpm);
  setText('rb-acc',      acc + '%');
  setText('rb-cpm',      cpm);
  setText('rb-errors',   errs);
  setText('rb-correct',  S.correctKS);
  setText('rb-total-ks', S.totalKS);
  setText('rb-time',     formatTime(elapsed));
  setText('rb-mode',     timerModeLabel());

  /* Navigate */
  nav('results');
}

/* ================================================
   FORMAT TIME  (seconds → "1:23" or "45s")
================================================ */

function formatTime(sec) {
  if (sec < 60) return sec + 's';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ================================================
   TIMER MODE LABEL
================================================ */

function timerModeLabel() {
  if (S.timerMode === 'inf')    return '∞';
  if (S.timerMode === 'custom') return S.customSec + 's';
  return S.timerMode + 's';
}

/* ================================================
   HOME STATS STRIP
================================================ */

function updateHomeStats() {
  const best  = storageGetBest();
  const tests = storageGetTests();
  const done  = storageGetDoneCount();
  const total = storageGetTotalTime();

  animateCount('h-wpm',     best.wpm  || 0);
  animateCount('h-acc',     best.acc  || 0, '%');
  animateCount('h-tests',   tests);
  animateCount('h-lessons', done);
  setText('h-time', formatTotalTime(total));
}

/* ================================================
   FORMAT TOTAL TIME
================================================ */

function formatTotalTime(sec) {
  if (sec < 60)   return sec + 's';
  if (sec < 3600) return Math.floor(sec / 60) + 'm';
  return (sec / 3600).toFixed(1) + 'h';
}

/* ================================================
   ANIMATED NUMBER COUNTER
================================================ */

function animateCount(id, target, suffix = '') {
  const el_   = el(id);
  if (!el_) return;

  const start    = 0;
  const duration = 600;
  const step     = 16;
  const steps    = duration / step;
  const inc      = (target - start) / steps;
  let   current  = start;

  el_.classList.add('counting');

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      current = target;
      clearInterval(timer);
      el_.classList.remove('counting');
    }
    el_.textContent = Math.round(current) + suffix;
  }, step);
}

/* ================================================
   LESSONS PROGRESS BAR
================================================ */

function updateLessonsProgress() {
  const list  = S.lessonTab === 'bn' ? S.lessonsBN : S.lessonsEN;
  const total = list.length * 10; /* 10 parts per lesson */
  let   done  = 0;

  list.forEach(lesson => {
    done += storageGetLessonProgress(lesson.id);
  });

  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const fill  = el('lp-fill');
  const pctEl = el('lp-pct');
  const label = el('lp-label');

  if (fill)  fill.style.width   = pct + '%';
  if (pctEl) pctEl.textContent  = pct + '%';
  if (label) label.textContent  =
    `${done} / ${total} ${S.lang === 'bn' ? 'অংশ সম্পন্ন' : 'parts done'}`;
}

/* ================================================
   BUILD WPM OVER TIME CHART
================================================ */

function buildWpmChart() {
  const canvas = el('wpm-canvas');
  if (!canvas) return;

  if (S.wpmChart) { S.wpmChart.destroy(); S.wpmChart = null; }

  const dark = S.theme === 'dark';
  const tc   = dark ? '#8899b5' : '#4a5878';
  const gc   = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';

  let labels = S.wpmHistory.map(h => h.t + 's');
  let data   = S.wpmHistory.map(h => h.wpm);

  /* Ensure at least 2 points */
  if (data.length < 2) {
    labels = ['0s', 'end'];
    data   = [0, calcWPM()];
  }

  /* Downsample if too many points (>60) */
  if (data.length > 60) {
    const step = Math.floor(data.length / 60);
    labels = labels.filter((_, i) => i % step === 0);
    data   = data.filter((_, i) => i % step === 0);
  }

  S.wpmChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'WPM',
        data,
        borderColor:     '#00d4b1',
        backgroundColor: 'rgba(0,212,177,0.08)',
        borderWidth:     2.5,
        pointBackgroundColor: '#00d4b1',
        pointRadius:     3,
        pointHoverRadius: 5,
        tension:         0.45,
        fill:            true,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? '#0d1320' : '#fff',
          titleColor:      tc,
          bodyColor:       '#00d4b1',
          borderColor:     'rgba(0,212,177,0.25)',
          borderWidth:     1,
        },
      },
      scales: {
        x: {
          ticks: { color: tc, font: { size: 10 }, maxTicksLimit: 10 },
          grid:  { color: gc },
        },
        y: {
          ticks:       { color: tc, font: { size: 10 } },
          grid:        { color: gc },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ================================================
   BUILD ACCURACY DOUGHNUT CHART
================================================ */

function buildAccChart() {
  const canvas = el('acc-canvas');
  if (!canvas) return;

  if (S.accChart) { S.accChart.destroy(); S.accChart = null; }

  const dark     = S.theme === 'dark';
  const tc       = dark ? '#8899b5' : '#4a5878';
  const correct  = S.correctKS;
  const errors   = S.mistakes;
  const untyped  = Math.max(0, S.chars.length - S.idx);

  S.accChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels:   ['Correct', 'Errors', 'Untyped'],
      datasets: [{
        data:            [correct, errors, untyped],
        backgroundColor: [
          'rgba(34,197,94,0.80)',
          'rgba(239,68,68,0.80)',
          'rgba(100,116,139,0.25)',
        ],
        borderColor:     ['#22c55e', '#ef4444', 'transparent'],
        borderWidth:     2,
        hoverOffset:     6,
      }],
    },
    options: {
      responsive: true,
      cutout:     '68%',
      animation:  { duration: 800 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:    tc,
            font:     { size: 11 },
            padding:  16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: dark ? '#0d1320' : '#fff',
          titleColor:      tc,
          bodyColor:       tc,
          borderColor:     'rgba(255,255,255,0.06)',
          borderWidth:     1,
        },
      },
    },
  });
}

/* ================================================
   WPM HISTORY MINI BARS
================================================ */

function buildWpmHistoryBars() {
  const list = el('wh-list');
  if (!list || S.wpmHistory.length === 0) return;

  const maxWpm = Math.max(...S.wpmHistory.map(h => h.wpm), 1);

  /* Sample last 10 snapshots */
  const sample = S.wpmHistory.slice(-10);

  list.innerHTML = sample.map(h => `
    <div class="wh-item">
      <span class="wh-time">${h.t}s</span>
      <div class="wh-bar-wrap">
        <div class="wh-bar" style="width:${Math.round((h.wpm/maxWpm)*100)}%"></div>
      </div>
      <span class="wh-wpm">${h.wpm}</span>
    </div>
  `).join('');
}

/* ================================================
   RECENT SCORES  (home screen)
================================================ */

function buildRecentScores() {
  const list  = el('recent-list');
  if (!list) return;

  const scores = storageGetRecent().slice(0, 5);

  if (scores.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${S.lang === 'bn' ? 'এখনো কোনো রেজাল্ট নেই' : 'No results yet — take a test!'}</p>
      </div>`;
    return;
  }

  list.innerHTML = scores.map(s => `
    <div class="recent-item">
      <span class="recent-wpm">${s.wpm}</span>
      <div class="recent-meta">
        <span class="rm-mode">${s.acc}% · ${s.lang === 'bn' ? 'বাংলা' : 'EN'} · ${timerModeLabelFromMode(s.mode)}</span>
        <span class="rm-date">${s.date || ''}</span>
      </div>
    </div>
  `).join('');
}

function timerModeLabelFromMode(mode) {
  if (mode === 'inf')    return '∞';
  if (mode === 'custom') return 'custom';
  return mode + 's';
}

/* ================================================
   UTILITY HELPERS
================================================ */

function setText(id, val) {
  const el_ = el(id);
  if (el_) el_.textContent = val;
}
