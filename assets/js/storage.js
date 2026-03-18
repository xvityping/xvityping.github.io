/* ================================================
   XVITYPING — LOCAL STORAGE HELPERS
   storage.js
================================================ */

/* ---------- STORAGE KEYS ---------- */
const LS_KEYS = {
  theme:       'xvt_theme',
  lang:        'xvt_lang',
  sound:       'xvt_snd',
  best:        'xvt_best',       // { wpm, acc, cpm }
  tests:       'xvt_tests',      // total test count
  totalTime:   'xvt_totaltime',  // total seconds spent typing
  doneParts:   'xvt_done',       // { "1-3": true, "2-7": true, ... } lessonId-partNum
  recentScores:'xvt_recent',     // array of last 5 scores
  customSec:   'xvt_customsec',
  kbVisible:   'xvt_kb',
  timerMode:   'xvt_timermode',
};

/* ================================================
   READ HELPERS
================================================ */

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Storage write failed:', key, e);
    return false;
  }
}

function lsDel(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

/* ================================================
   THEME
================================================ */

function storageGetTheme() {
  return lsGet(LS_KEYS.theme, 'dark');
}

function storageSetTheme(theme) {
  lsSet(LS_KEYS.theme, theme);
}

/* ================================================
   LANGUAGE
================================================ */

function storageGetLang() {
  return lsGet(LS_KEYS.lang, 'en');
}

function storageSetLang(lang) {
  lsSet(LS_KEYS.lang, lang);
}

/* ================================================
   SOUND
================================================ */

function storageGetSound() {
  return lsGet(LS_KEYS.sound, true);
}

function storageSetSound(on) {
  lsSet(LS_KEYS.sound, on);
}

/* ================================================
   BEST SCORE
================================================ */

function storageGetBest() {
  return lsGet(LS_KEYS.best, { wpm: 0, acc: 0, cpm: 0 });
}

function storageUpdateBest(wpm, acc, cpm) {
  const best = storageGetBest();
  let changed = false;
  if (wpm > best.wpm) { best.wpm = wpm; changed = true; }
  if (acc > best.acc) { best.acc = acc; }
  if (cpm > best.cpm) { best.cpm = cpm; }
  lsSet(LS_KEYS.best, best);
  return changed; // true = new personal best WPM
}

/* ================================================
   TEST COUNTER & TOTAL TIME
================================================ */

function storageIncrTests() {
  const n = lsGet(LS_KEYS.tests, 0) + 1;
  lsSet(LS_KEYS.tests, n);
  return n;
}

function storageGetTests() {
  return lsGet(LS_KEYS.tests, 0);
}

function storageAddTime(seconds) {
  const t = lsGet(LS_KEYS.totalTime, 0) + seconds;
  lsSet(LS_KEYS.totalTime, t);
  return t;
}

function storageGetTotalTime() {
  return lsGet(LS_KEYS.totalTime, 0);
}

/* ================================================
   DONE PARTS  (lessonId-partNum → bool)
================================================ */

function storageGetDone() {
  return lsGet(LS_KEYS.doneParts, {});
}

function storageMarkDone(lessonId, partNum) {
  const done = storageGetDone();
  done[`${lessonId}-${partNum}`] = true;
  lsSet(LS_KEYS.doneParts, done);
}

function storageIsPartDone(lessonId, partNum) {
  const done = storageGetDone();
  return !!done[`${lessonId}-${partNum}`];
}

function storageIsLessonDone(lessonId, totalParts = 10) {
  const done = storageGetDone();
  for (let i = 1; i <= totalParts; i++) {
    if (!done[`${lessonId}-${i}`]) return false;
  }
  return true;
}

function storageGetLessonProgress(lessonId, totalParts = 10) {
  const done = storageGetDone();
  let count = 0;
  for (let i = 1; i <= totalParts; i++) {
    if (done[`${lessonId}-${i}`]) count++;
  }
  return count; // 0-10
}

function storageGetDoneCount() {
  // Count how many lessons are fully complete
  const done = storageGetDone();
  const keys = Object.keys(done);
  const lessonIds = new Set();
  keys.forEach(k => {
    const id = k.split('-')[0];
    lessonIds.add(id);
  });
  // Only count fully done lessons (all 10 parts)
  let count = 0;
  lessonIds.forEach(id => {
    if (storageIsLessonDone(id)) count++;
  });
  return count;
}

/* ================================================
   RECENT SCORES
================================================ */

function storageGetRecent() {
  return lsGet(LS_KEYS.recentScores, []);
}

function storagePushRecent(score) {
  // score = { wpm, acc, errors, time, mode, lang, date }
  const list = storageGetRecent();
  list.unshift(score);
  if (list.length > 10) list.pop();
  lsSet(LS_KEYS.recentScores, list);
}

/* ================================================
   MISC PREFS
================================================ */

function storageGetCustomSec() {
  return lsGet(LS_KEYS.customSec, 90);
}

function storageSetCustomSec(n) {
  lsSet(LS_KEYS.customSec, n);
}

function storageGetKbVisible() {
  return lsGet(LS_KEYS.kbVisible, true);
}

function storageSetKbVisible(v) {
  lsSet(LS_KEYS.kbVisible, v);
}

function storageGetTimerMode() {
  return lsGet(LS_KEYS.timerMode, 60);
}

function storageSetTimerMode(mode) {
  lsSet(LS_KEYS.timerMode, mode);
}

/* ================================================
   LOAD ALL PREFS INTO STATE
================================================ */

function storageLoadAll() {
  S.theme     = storageGetTheme();
  S.lang      = storageGetLang();
  S.soundOn   = storageGetSound();
  S.customSec = storageGetCustomSec();
  S.kbVisible = storageGetKbVisible();

  // Restore timer mode safely
  const savedMode = storageGetTimerMode();
  const validModes = [60, 120, 300, 'custom', 'inf'];
  S.timerMode = validModes.includes(savedMode) ? savedMode : 60;
  S.timerSec  = typeof S.timerMode === 'number' ? S.timerMode : S.customSec;
  S.timerMax  = S.timerSec;
}

/* ================================================
   CLEAR ALL DATA (used in settings / reset)
================================================ */

function storageClearAll() {
  Object.values(LS_KEYS).forEach(k => lsDel(k));
}
