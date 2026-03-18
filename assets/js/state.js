/* ================================================
   XVITYPING — GLOBAL STATE
   state.js
================================================ */

const S = {

  /* ---------- SCREEN ---------- */
  screen: 'home',          // 'home' | 'lessons' | 'lesson-detail' | 'test' | 'results'

  /* ---------- LANGUAGE / TYPE MODE ---------- */
  lang:     'en',          // 'en' | 'bn'
  typeMode: 'en',          // 'en' | 'bn' | 'num' | 'sym' | 'inf'

  /* ---------- THEME ---------- */
  theme: 'dark',           // 'dark' | 'light'

  /* ---------- SOUND ---------- */
  soundOn: true,
  audioCtx: null,

  /* ---------- TIMER ---------- */
  timerMode:  60,          // 60 | 120 | 300 | 'custom' | 'inf'
  timerSec:   60,          // current countdown value
  timerMax:   60,          // max value for progress bar
  customSec:  90,          // saved custom value
  tInterval:  null,        // setInterval ref
  wInterval:  null,        // WPM update interval ref

  /* ---------- TEST RUN STATE ---------- */
  running:   false,
  paused:    false,
  t0:        null,         // Date.now() at test start

  /* ---------- TEXT / CHARS ---------- */
  text:      '',
  chars:     [],           // array of DOM span elements
  idx:       0,            // current char index
  lineHeight: 0,           // px, computed on init
  currentLine: 0,          // which line is active (for 4-line scroll)

  /* ---------- SCORING ---------- */
  mistakes:  0,
  totalKS:   0,            // total keystrokes
  correctKS: 0,            // correct keystrokes
  wpmHistory: [],          // [{ t: sec, wpm: n }]

  /* ---------- LESSON / PART ---------- */
  lesson:     null,        // current lesson object from JSON
  lessonLang: 'en',        // 'en' | 'bn'
  partIdx:    0,           // 0-9 (part index inside lesson)

  /* ---------- CHARTS ---------- */
  wpmChart: null,
  accChart: null,

  /* ---------- KEYBOARD ---------- */
  kbVisible:   true,
  capsOn:      false,
  numLockOn:   true,
  scrollLockOn: false,

  /* ---------- LESSONS DATA (loaded from JSON) ---------- */
  lessonsEN: [],
  lessonsBN: [],

  /* ---------- ACTIVE LESSON FILTER ---------- */
  lessonTab: 'en',         // 'en' | 'bn'
};

/* Freeze the shape (not values) — prevents accidental new keys */
Object.seal(S);
