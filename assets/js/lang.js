/* ================================================
   XVITYPING — LANGUAGE & TYPE MODE
   lang.js
================================================ */

/* ================================================
   SET LANGUAGE  (en | bn)
================================================ */

function setLang(lang) {
  /* Stop current test if running */
  if (S.running || S.paused) doStop();

  S.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  storageSetLang(lang);

  /* Sync type mode */
  S.typeMode = lang === 'bn' ? 'bn' : 'en';

  updateLangUI();
  buildKb();

  /* Rebuild lesson tabs to match language */
  if (S.screen === 'lessons') {
    S.lessonTab = lang;
    buildLessonsGrid(lang);
    updateLessonsProgress();
    syncLessonTabs(lang);
  }

  /* Reload test text in new language */
  if (S.screen === 'test' && !S.lesson) {
    fetchText();
  }

  toast(
    lang === 'bn'
      ? 'বাংলা মোড — Unijoy Layout সক্রিয়'
      : 'English mode activated',
    'i'
  );
}

/* ================================================
   SET TYPE MODE  (en | bn | num | sym | inf)
================================================ */

function setTypeMode(mode) {
  if (S.running || S.paused) doStop();
  S.typeMode = mode;

  /* Auto-switch lang for bn mode */
  if (mode === 'bn' && S.lang !== 'bn') {
    S.lang = 'bn';
    document.documentElement.setAttribute('data-lang', 'bn');
    storageSetLang('bn');
    buildKb();
  } else if (mode !== 'bn' && S.lang === 'bn') {
    S.lang = 'en';
    document.documentElement.setAttribute('data-lang', 'en');
    storageSetLang('en');
    buildKb();
  }

  updateTypeModeUI(mode);

  /* Set infinity timer if inf mode */
  if (mode === 'inf') {
    setTimerMode('inf');
  }

  /* Reload text */
  if (S.screen === 'test') fetchText();
}

/* ================================================
   UPDATE LANGUAGE UI
================================================ */

function updateLangUI() {
  const isBn = S.lang === 'bn';

  /* Header toggle buttons */
  const btnEn = document.getElementById('btn-en');
  const btnBn = document.getElementById('btn-bn');
  if (btnEn) btnEn.classList.toggle('active', !isBn);
  if (btnBn) btnBn.classList.toggle('active',  isBn);

  /* Keyboard layout badge */
  const badge = document.getElementById('kb-layout-badge');
  if (badge) {
    badge.textContent = isBn ? 'Unijoy Layout' : 'QWERTY';
    badge.classList.toggle('bijoy', isBn);
  }

  /* Keyboard switch shortcut hint */
  const hint = document.getElementById('kb-switch-hint');
  if (hint) {
    hint.textContent = isBn
      ? 'Ctrl+Alt+V — English এ যান'
      : 'Ctrl+Alt+V — বাংলায় যান';
  }

  /* Lock indicators in header */
  updateLockIndicators();
}

/* ================================================
   UPDATE TYPE MODE BUTTONS (test screen)
================================================ */

function updateTypeModeUI(mode) {
  document.querySelectorAll('.tto-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  /* Also update header lang toggle if mode is en/bn */
  if (mode === 'en' || mode === 'bn') updateLangUI();
}

/* ================================================
   SYNC LESSON FILTER TABS
================================================ */

function syncLessonTabs(lang) {
  document.querySelectorAll('.ltab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.lang === lang);
  });
}

/* ================================================
   LOCK KEY INDICATORS  (CapsLock / NumLock / ScrollLock)
================================================ */

function updateLockIndicators() {
  updateSingleIndicator('ind-caps',   S.capsOn,       'caps-on');
  updateSingleIndicator('ind-num',    S.numLockOn,    'on');
  updateSingleIndicator('ind-scroll', S.scrollLockOn, 'on');

  /* Also update inside keyboard header */
  updateSingleIndicator('kb-ind-caps',   S.capsOn,       'caps-on');
  updateSingleIndicator('kb-ind-num',    S.numLockOn,    'on');
  updateSingleIndicator('kb-ind-scroll', S.scrollLockOn, 'on');
}

function updateSingleIndicator(id, isOn, activeClass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle(activeClass, isOn);
}

/* ================================================
   DETECT CAPS LOCK STATE from keydown event
================================================ */

function detectLockKeys(e) {
  /* CapsLock */
  if (e.getModifierState) {
    const caps   = e.getModifierState('CapsLock');
    const num    = e.getModifierState('NumLock');
    const scroll = e.getModifierState('ScrollLock');

    let changed = false;
    if (caps   !== S.capsOn)       { S.capsOn = caps;           changed = true; }
    if (num    !== S.numLockOn)    { S.numLockOn = num;         changed = true; }
    if (scroll !== S.scrollLockOn) { S.scrollLockOn = scroll;   changed = true; }

    if (changed) updateLockIndicators();
  }
}

/* ================================================
   KEYBOARD SHORTCUT — Ctrl + Alt + V  → toggle lang
================================================ */

function handleLangShortcut(e) {
  /* Ctrl + Alt + V */
  if (e.ctrlKey && e.altKey && e.key === 'v') {
    e.preventDefault();
    const newLang = S.lang === 'en' ? 'bn' : 'en';
    setLang(newLang);
    return true;
  }
  return false;
}

/* ================================================
   HERO SUB TEXT (language-aware)
================================================ */

function updateHeroText() {
  const sub = document.getElementById('hero-sub');
  if (!sub) return;
  sub.textContent = S.lang === 'bn'
    ? 'Unijoy বাংলা লেআউট সহ গঠিত পাঠ, রিয়েল-টাইম বিশ্লেষণ এবং অসীম অনুশীলন।'
    : 'Master touch typing with structured lessons, real-time analytics, and Unijoy Bangla support.';
}
