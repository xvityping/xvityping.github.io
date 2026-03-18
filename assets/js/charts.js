/* ================================================
   XVITYPING — CHARTS
   charts.js
   Wraps Chart.js — all chart creation lives here
================================================ */

/* ================================================
   CHART DEFAULT COLORS
================================================ */

function chartColors() {
  const dark = S.theme === 'dark';
  return {
    text:    dark ? '#8899b5' : '#4a5878',
    grid:    dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    tooltip: dark ? '#0d1320' : '#ffffff',
    border:  dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

/* ================================================
   WPM LINE CHART  (results screen)
================================================ */

function buildWpmChart() {
  const canvas = el('wpm-canvas');
  if (!canvas) return;

  if (S.wpmChart) { S.wpmChart.destroy(); S.wpmChart = null; }

  const c = chartColors();

  let labels = S.wpmHistory.map(h => h.t + 's');
  let data   = S.wpmHistory.map(h => h.wpm);

  /* Need at least 2 points */
  if (data.length < 2) {
    labels = ['0s', 'end'];
    data   = [0, calcWPM()];
  }

  /* Downsample to max 60 points */
  if (data.length > 60) {
    const step = Math.floor(data.length / 60);
    labels = labels.filter((_, i) => i % step === 0);
    data   = data.filter((_, i) => i % step === 0);
  }

  /* Max WPM for annotation */
  const maxWpm = Math.max(...data, 1);

  S.wpmChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                'WPM',
        data,
        borderColor:          '#00d4b1',
        backgroundColor:      'rgba(0,212,177,0.08)',
        borderWidth:          2.5,
        pointBackgroundColor: '#00d4b1',
        pointBorderColor:     '#00d4b1',
        pointRadius:          data.length > 30 ? 2 : 3,
        pointHoverRadius:     5,
        tension:              0.45,
        fill:                 true,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      animation: { duration: 700, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltip,
          titleColor:      c.text,
          bodyColor:       '#00d4b1',
          borderColor:     'rgba(0,212,177,0.25)',
          borderWidth:     1,
          padding:         10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} WPM`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color:         c.text,
            font:          { size: 10 },
            maxTicksLimit: 10,
            maxRotation:   0,
          },
          grid: { color: c.grid },
        },
        y: {
          ticks: {
            color: c.text,
            font:  { size: 10 },
          },
          grid:        { color: c.grid },
          beginAtZero: true,
          suggestedMax: maxWpm + 10,
        },
      },
    },
  });
}

/* ================================================
   ACCURACY DOUGHNUT CHART  (results screen)
================================================ */

function buildAccChart() {
  const canvas = el('acc-canvas');
  if (!canvas) return;

  if (S.accChart) { S.accChart.destroy(); S.accChart = null; }

  const c       = chartColors();
  const correct = S.correctKS;
  const errors  = S.mistakes;
  const untyped = Math.max(0, S.chars.length - S.idx);

  S.accChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels:   ['Correct', 'Errors', 'Untyped'],
      datasets: [{
        data:            [correct, errors, untyped],
        backgroundColor: [
          'rgba(34,197,94,0.82)',
          'rgba(239,68,68,0.82)',
          'rgba(100,116,139,0.22)',
        ],
        borderColor:  ['#22c55e', '#ef4444', 'transparent'],
        borderWidth:  2,
        hoverOffset:  8,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      cutout:              '68%',
      animation: { duration: 800, easing: 'easeOutBounce' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:          c.text,
            font:           { size: 11 },
            padding:        16,
            usePointStyle:  true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: c.tooltip,
          titleColor:      c.text,
          bodyColor:       c.text,
          borderColor:     c.border,
          borderWidth:     1,
          padding:         10,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
              return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/* ================================================
   ADMIN — VISITORS BAR CHART
================================================ */

function buildAdminVisitorsChart(canvasId, labels, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  const c = chartColors();

  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Visitors',
        data,
        backgroundColor: 'rgba(0,212,177,0.55)',
        borderColor:     '#00d4b1',
        borderWidth:     1.5,
        borderRadius:    5,
        hoverBackgroundColor: 'rgba(0,212,177,0.80)',
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltip,
          titleColor:      c.text,
          bodyColor:       '#00d4b1',
          borderColor:     'rgba(0,212,177,0.25)',
          borderWidth:     1,
        },
      },
      scales: {
        x: {
          ticks: { color: c.text, font: { size: 10 } },
          grid:  { color: c.grid },
        },
        y: {
          ticks:       { color: c.text, font: { size: 10 } },
          grid:        { color: c.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ================================================
   ADMIN — SESSION DURATION LINE CHART
================================================ */

function buildAdminSessionChart(canvasId, labels, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  const c = chartColors();

  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                'Avg Session (min)',
        data,
        borderColor:          '#a78bfa',
        backgroundColor:      'rgba(167,139,250,0.08)',
        borderWidth:          2.5,
        pointBackgroundColor: '#a78bfa',
        pointRadius:          3,
        tension:              0.4,
        fill:                 true,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltip,
          titleColor:      c.text,
          bodyColor:       '#a78bfa',
          borderColor:     'rgba(167,139,250,0.25)',
          borderWidth:     1,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} min`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: c.text, font: { size: 10 } },
          grid:  { color: c.grid },
        },
        y: {
          ticks:       { color: c.text, font: { size: 10 } },
          grid:        { color: c.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ================================================
   ADMIN — WPM DISTRIBUTION RADAR CHART
================================================ */

function buildAdminWpmRadar(canvasId, labels, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  const c = chartColors();

  return new Chart(canvas.getContext('2d'), {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label:           'Avg WPM',
        data,
        borderColor:     '#00d4b1',
        backgroundColor: 'rgba(0,212,177,0.12)',
        pointBackgroundColor: '#00d4b1',
        borderWidth:     2,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          ticks:     { color: c.text, font: { size: 9 }, backdropColor: 'transparent' },
          grid:      { color: c.grid },
          angleLines: { color: c.grid },
          pointLabels: { color: c.text, font: { size: 10 } },
        },
      },
    },
  });
}

/* ================================================
   ADMIN — PIE CHART  (EN vs BN usage)
================================================ */

function buildAdminLangPie(canvasId, enCount, bnCount) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  const c = chartColors();

  return new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels:   ['English', 'Bangla'],
      datasets: [{
        data:            [enCount, bnCount],
        backgroundColor: ['rgba(0,212,177,0.75)', 'rgba(167,139,250,0.75)'],
        borderColor:     ['#00d4b1', '#a78bfa'],
        borderWidth:     2,
        hoverOffset:     6,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:   c.text,
            padding: 14,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: c.tooltip,
          titleColor:      c.text,
          bodyColor:       c.text,
          borderColor:     c.border,
          borderWidth:     1,
        },
      },
    },
  });
}

/* ================================================
   DESTROY ALL CHARTS  (cleanup on screen leave)
================================================ */

function destroyAllCharts() {
  if (S.wpmChart) { S.wpmChart.destroy(); S.wpmChart = null; }
  if (S.accChart) { S.accChart.destroy(); S.accChart = null; }
}
