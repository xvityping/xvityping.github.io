/* ================================================
   XVITYPING — THEME
   theme.js
================================================ */

/* ================================================
   APPLY THEME
================================================ */

function applyTheme(theme) {
  S.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  storageSetTheme(theme);
  updateThemeIcon(theme);
  updateChartColors();   // re-render charts if visible
}

/* ================================================
   TOGGLE
================================================ */

function toggleTheme() {
  applyTheme(S.theme === 'dark' ? 'light' : 'dark');
}

/* ================================================
   UPDATE ICON  (sun / moon SVG swap)
================================================ */

function updateThemeIcon(theme) {
  const icon = document.getElementById('thm-icon');
  if (!icon) return;

  if (theme === 'light') {
    /* Moon — switch to dark */
    icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    `;
  } else {
    /* Sun — switch to light */
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"     x2="12" y2="3"/>
      <line x1="12" y1="21"    x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12"   x2="3"  y2="12"/>
      <line x1="21" y1="12"   x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    `;
  }
}

/* ================================================
   UPDATE CHART COLORS when theme changes
================================================ */

function updateChartColors() {
  if (S.screen !== 'results') return;
  if (S.wpmChart) {
    const tc = S.theme === 'dark' ? '#8899b5' : '#4a5878';
    const gc = S.theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    S.wpmChart.options.scales.x.ticks.color = tc;
    S.wpmChart.options.scales.y.ticks.color = tc;
    S.wpmChart.options.scales.x.grid.color  = gc;
    S.wpmChart.options.scales.y.grid.color  = gc;
    S.wpmChart.update('none');
  }
  if (S.accChart) {
    const tc = S.theme === 'dark' ? '#8899b5' : '#4a5878';
    S.accChart.options.plugins.legend.labels.color = tc;
    S.accChart.update('none');
  }
}
