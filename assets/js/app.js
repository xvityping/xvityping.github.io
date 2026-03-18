/* ================================================
   XVITYPING — APP ENTRY POINT
   app.js
   Loads last — all other scripts must be loaded first
================================================ */

/* ================================================
   DOM READY
================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* 1. Load preferences into state */
  storageLoadAll();

  /* 2. Apply theme immediately (no flash) */
  applyTheme(S.theme);
  updateThemeIcon(S.theme);

  /* 3. Apply language */
  document.documentElement.setAttribute('data-lang', S.lang);
  updateLangUI();
  updateHeroText();

  /* 4. Load lesson JSON files */
  await loadLessons();

  /* 5. Build virtual keyboard */
  buildKb();

  /* 6. Build lesson grid (default tab) */
  buildLessonsGrid(S.lang === 'bn' ? 'bn' : 'en');

  /* 7. Build home screen stats + recent scores */
  updateHomeStats();
  buildRecentScores();

  /* 8. Restore sound UI */
  updateSoundUI();

  /* 9. Restore keyboard visibility checkbox */
  const kbChk = el('kb-chk');
  if (kbChk) kbChk.checked = S.kbVisible;

  /* 10. Restore timer mode button */
  highlightTimerBtn(S.timerMode);
  setTimerDisplay();

  /* 11. Register global keydown */
  document.addEventListener('keydown', onKey);

  /* 12. Keep ghost input focused on test screen */
  document.addEventListener('click', () => {
    if (S.screen === 'test') {
      el('ghost-input')?.focus();
    }
  });

  /* 13. Ghost input — clear on any input event */
  el('ghost-input')?.addEventListener('input', e => { e.target.value = ''; });

  /* 14. Custom timer input */
  el('custom-sec')?.addEventListener('change', customTimerChanged);
  el('custom-sec')?.addEventListener('click', e => e.stopPropagation());

  /* 15. Build Bijoy legend */
  buildBijoyLegend();

  /* 16. Init Firebase tracker (non-blocking) */
  initTracker().catch(() => {});

  /* 17. Show home screen */
  nav('home');

  /* 18. Hide loader */
  hideLoader();
});

/* ================================================
   HIDE PAGE LOADER
================================================ */

function hideLoader() {
  const loader = el('page-loader');
  if (!loader) return;
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
}

/* ================================================
   TOAST SYSTEM
================================================ */

function toast(msg, type = 'i', duration = 3000) {
  const container = el('toasts');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.style.setProperty('--toast-duration', duration + 'ms');

  /* Icon per type */
  const icons = {
    s: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    e: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    i: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    w: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    p: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  };

  t.innerHTML = `
    ${icons[type] || icons.i}
    <div class="toast-body">
      <span class="toast-title">${msg}</span>
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  container.appendChild(t);

  /* Auto remove */
  setTimeout(() => {
    t.classList.add('removing');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ================================================
   WINDOW RESIZE — rebuild keyboard
================================================ */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (S.screen === 'test') buildKb();
  }, 300);
});
