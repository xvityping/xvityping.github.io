/* ================================================
   XVITYPING ADMIN — CHART BUILDERS
   xvi7admin/js/admin-charts.js
================================================ */

const ADMIN_CHART_INSTANCES = {};

/* ================================================
   COLORS
================================================ */

function adminChartColors() {
  return {
    text:    '#8899b5',
    grid:    'rgba(255,255,255,0.04)',
    tooltip: '#0a1020',
    border:  'rgba(255,255,255,0.06)',
  };
}

/* ================================================
   GENERIC CHART BUILDER
================================================ */

function buildAdminChart(canvasId, type, labels, data, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  /* Destroy existing */
  if (ADMIN_CHART_INSTANCES[canvasId]) {
    ADMIN_CHART_INSTANCES[canvasId].destroy();
    delete ADMIN_CHART_INSTANCES[canvasId];
  }

  const c    = adminChartColors();
  const isBar  = type === 'bar';
  const isLine = type === 'line';

  const alpha = color + (isBar ? '88' : '14');

  const chart = new Chart(canvas.getContext('2d'), {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor:     color,
        backgroundColor: isBar ? color + '88' : color + '14',
        borderWidth:     isBar ? 1.5 : 2.5,
        borderRadius:    isBar ? 5 : 0,
        pointBackgroundColor:  isLine ? color : undefined,
        pointRadius:           isLine ? 3 : undefined,
        pointHoverRadius:      isLine ? 5 : undefined,
        tension:               isLine ? 0.4 : undefined,
        fill:                  isLine ? true : undefined,
        hoverBackgroundColor:  isBar ? color + 'cc' : undefined,
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
          bodyColor:       color,
          borderColor:     color + '44',
          borderWidth:     1,
          padding:         10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} ${label}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: c.text, font: { size: 10 },
            maxRotation: 0, maxTicksLimit: 10,
          },
          grid: { color: c.grid },
        },
        y: {
          ticks:       { color: c.text, font: { size: 10 } },
          grid:        { color: c.grid },
          beginAtZero: true,
        },
      },
    },
  });

  ADMIN_CHART_INSTANCES[canvasId] = chart;
  return chart;
}

/* ================================================
   LANGUAGE PIE CHART
================================================ */

function buildLangPie(canvasId, enCount, bnCount) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (ADMIN_CHART_INSTANCES[canvasId]) {
    ADMIN_CHART_INSTANCES[canvasId].destroy();
    delete ADMIN_CHART_INSTANCES[canvasId];
  }

  const c = adminChartColors();

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels:   ['English', 'Bangla'],
      datasets: [{
        data:            [enCount, bnCount],
        backgroundColor: ['rgba(0,212,177,0.72)', 'rgba(167,139,250,0.72)'],
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
            color: c.text, padding: 14,
            usePointStyle: true, font: { size: 11 },
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

  ADMIN_CHART_INSTANCES[canvasId] = chart;
  return chart;
}

/* ================================================
   DESTROY ALL ADMIN CHARTS
================================================ */

function destroyAdminCharts() {
  Object.values(ADMIN_CHART_INSTANCES).forEach(c => {
    try { c.destroy(); } catch(e) {}
  });
  Object.keys(ADMIN_CHART_INSTANCES).forEach(k => {
    delete ADMIN_CHART_INSTANCES[k];
  });
}
