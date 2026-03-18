/* ================================================
   XVITYPING — ROUTER / SCREEN NAVIGATION
   router.js
================================================ */

/* All valid screen IDs */
const SCREENS = ['home', 'lessons', 'lesson-detail', 'test', 'results'];

/* Nav pill → screen mapping */
const NAV_MAP = {
  'home':          0,
  'lessons':       1,
  'lesson-detail': 1,   // lessons tab stays active
  'test':          2,
  'results':       2,   // test tab stays active
};

/* ================================================
   MAIN NAV FUNCTION
================================================ */

function nav(screen, opts = {}) {
  if (!SCREENS.includes(screen)) {
    console.warn('Unknown screen:', screen);
    return;
  }

  /* Stop test if navigating away from test screen */
  if (S.running && screen !== 'test') {
    doStop();
  }

  const prev = S.screen;
  S.screen = screen;

  /* Hide all screens */
  SCREENS.forEach(id => {
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.remove('active');
  });

  /* Show target screen */
  const target = document.getElementById('screen-' + screen);
  if (target) {
    target.classList.add('active');
    /* Scroll to top of content */
    target.scrollIntoView ? window.scrollTo(0, 0) : null;
  }

  /* Update nav pills */
  updateNavPills(screen);

  /* Update back button */
  updateBackBtn(screen);

  /* Screen-specific actions */
  onScreenEnter(screen, prev, opts);
}

/* ================================================
   UPDATE NAV PILLS
================================================ */

function updateNavPills(screen) {
  const pills = document.querySelectorAll('.nav-pill');
  const mPills = document.querySelectorAll('.mobile-nav-pill');
  const idx = NAV_MAP[screen] ?? -1;

  pills.forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });

  mPills.forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });
}

/* ================================================
   BACK BUTTON VISIBILITY
================================================ */

function updateBackBtn(screen) {
  const btn = document.getElementById('back-btn');
  if (!btn) return;

  /* Show back button on non-home screens */
  if (screen === 'home') {
    btn.classList.remove('visible');
  } else {
    btn.classList.add('visible');
  }
}

/* ================================================
   BACK BUTTON CLICK — smart routing
================================================ */

function goBack() {
  switch (S.screen) {
    case 'lesson-detail':
      nav('lessons');
      break;
    case 'test':
      if (S.lesson) nav('lesson-detail');
      else nav('home');
      break;
    case 'results':
      if (S.lesson) nav('lesson-detail');
      else nav('home');
      break;
    case 'lessons':
      nav('home');
      break;
    default:
      nav('home');
  }
}

/* ================================================
   ON SCREEN ENTER — side effects per screen
================================================ */

function onScreenEnter(screen, prev, opts) {
  switch (screen) {

    case 'home':
      updateHomeStats();
      break;

    case 'lessons':
      /* Reset to list view (hide lesson-detail) */
      const detailEl = document.getElementById('screen-lesson-detail');
      if (detailEl) detailEl.classList.remove('active');
      buildLessonsGrid(S.lessonTab);
      updateLessonsProgress();
      break;

    case 'lesson-detail':
      if (opts.lesson) {
        S.lesson = opts.lesson;
        S.lessonLang = opts.lesson.lang || 'en';
        buildPartsGrid(opts.lesson);
      }
      break;

    case 'test':
      /* Focus ghost input so typing works immediately */
      setTimeout(() => {
        const gi = document.getElementById('ghost-input');
        if (gi) gi.focus();
      }, 100);

      /* If arriving from lesson-detail with a specific part */
      if (opts.lesson && opts.partIdx !== undefined) {
        S.lesson  = opts.lesson;
        S.partIdx = opts.partIdx;
        S.lang    = opts.lesson.lang || 'en';
        setLang(S.lang);
        /* Set timer to 2 min for lessons */
        setTimerMode(120);
        initTest(opts.lesson.parts[opts.partIdx].text);
        updateLessonInfoBar();
      } else if (!S.text) {
        /* Quick / custom test — fetch text */
        fetchText();
      }

      /* Rebuild keyboard for current lang */
      buildKb();
      break;

    case 'results':
      /* Charts built after a short delay (canvas needs to be visible) */
      setTimeout(() => {
        buildWpmChart();
        buildAccChart();
      }, 320);
      break;
  }
}

/* ================================================
   SHORTCUT NAVIGATION HELPERS
================================================ */

function quickTest() {
  S.lesson  = null;
  S.partIdx = 0;
  setTimerMode(typeof S.timerMode === 'number' ? S.timerMode : 60);
  nav('test');
  fetchText();
}

function customTest() {
  S.lesson  = null;
  S.partIdx = 0;
  nav('test');
  fetchText();
}

function startLesson(lesson) {
  /* Switch language if needed */
  if (lesson.lang && lesson.lang !== S.lang) {
    setLang(lesson.lang);
  }
  nav('lesson-detail', { lesson });
}

function startPart(lesson, partIdx) {
  if (S.running || S.paused) doStop();
  nav('test', { lesson, partIdx });
}

/* ================================================
   MOBILE MENU TOGGLE
================================================ */

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.remove('open');
}

/* Close menu when clicking outside */
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('hamburger-btn');
  if (!menu || !burger) return;
  if (!menu.contains(e.target) && !burger.contains(e.target)) {
    menu.classList.remove('open');
  }
});
