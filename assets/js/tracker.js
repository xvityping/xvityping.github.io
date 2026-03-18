/* ================================================
   XVITYPING — VISITOR & SESSION TRACKER
   tracker.js

   Tracks:
   - Page visits (anonymous, hashed)
   - Session duration (time on site)
   - Typing session results (WPM, acc, lang)
   - Daily aggregates in Firestore
================================================ */

/* ================================================
   TRACKER STATE
================================================ */

const TRACKER = {
  sessionId:    null,   /* unique per page load */
  uid:          null,   /* Firebase anonymous UID */
  pageLoadTime: null,   /* Date.now() on page load */
  initialized:  false,
};

/* ================================================
   INITIALIZE TRACKER
   Called once from app.js after DOM ready
================================================ */

async function initTracker() {
  if (!TRACKING.enabled) return;

  TRACKER.pageLoadTime = Date.now();
  TRACKER.sessionId    = generateSessionId();

  /* Init Firebase */
  const ok = await initFirebase();
  if (!ok) return;

  /* Get anonymous UID */
  TRACKER.uid          = AUTH?.currentUser?.uid || null;
  TRACKER.initialized  = true;

  /* Log this page visit */
  await trackVisit();

  /* Track time when user leaves */
  window.addEventListener('beforeunload', trackPageExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') trackPageExit();
  });
}

/* ================================================
   TRACK PAGE VISIT
================================================ */

async function trackVisit() {
  if (!TRACKER.initialized) return;

  const today    = todayStr();
  const referrer = document.referrer || 'direct';
  const lang     = navigator.language || 'unknown';

  /* Log visitor document */
  await dbLogVisitor({
    sessionId: TRACKER.sessionId,
    uid:       TRACKER.uid,
    date:      today,
    referrer:  referrer.slice(0, 100),
    lang:      lang,
    screen:    `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent.slice(0, 80),
  });

  /* Increment daily visitor count */
  await dbIncrDailyField(today, 'visitors');
}

/* ================================================
   TRACK PAGE EXIT  (time on page)
================================================ */

async function trackPageExit() {
  if (!TRACKER.initialized || !TRACKER.pageLoadTime) return;

  const duration = Math.round((Date.now() - TRACKER.pageLoadTime) / 1000);
  if (duration < 3) return; /* ignore bounces */

  const today = todayStr();
  await dbIncrDailyField(today, 'totalTime', duration);

  /* Prevent double-firing */
  TRACKER.pageLoadTime = null;
}

/* ================================================
   TRACK TYPING SESSION
   Called from timer.js → finishTest()
================================================ */

async function trackSession(wpm, acc, errors, duration, lang, mode) {
  if (!TRACKER.initialized) return;

  const today = todayStr();

  /* Log session document */
  await dbLogSession({
    sessionId: TRACKER.sessionId,
    uid:       TRACKER.uid,
    date:      today,
    wpm:       wpm,
    acc:       acc,
    errors:    errors,
    duration:  duration,
    lang:      lang,
    mode:      String(mode),
  });

  /* Increment daily counters */
  await dbIncrDailyField(today, 'sessions');
  await dbIncrDailyField(today, 'totalTypingTime', duration);

  /* Update rolling average WPM */
  await updateAvgWpm(today, wpm);
}

/* ================================================
   ROLLING AVERAGE WPM UPDATE
================================================ */

async function updateAvgWpm(date, newWpm) {
  if (!DB) return;
  try {
    const ref = DB.collection('daily_stats').doc(date);
    const doc = await ref.get();

    if (!doc.exists) {
      await ref.set({ avgWpm: newWpm, wpmCount: 1 }, { merge: true });
      return;
    }

    const data     = doc.data();
    const count    = (data.wpmCount  || 0) + 1;
    const prevAvg  = data.avgWpm  || 0;
    const newAvg   = Math.round(((prevAvg * (count - 1)) + newWpm) / count);

    await ref.set({ avgWpm: newAvg, wpmCount: count }, { merge: true });
  } catch (e) {
    console.warn('updateAvgWpm failed:', e.message);
  }
}

/* ================================================
   HOOK INTO finishTest()
   tracker.js extends finishTest via a post-hook
================================================ */

const _originalFinishTest = typeof finishTest !== 'undefined' ? finishTest : null;

/* Called from timer.js finishTest() — see timer.js */
async function onTestFinished(wpm, acc, errors, duration, lang, mode) {
  await trackSession(wpm, acc, errors, duration, lang, mode);
}

/* ================================================
   GENERATE SESSION ID
   Lightweight random ID — no personal data
================================================ */

function generateSessionId() {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/* ================================================
   GET TRACKER STATUS  (for admin / debug)
================================================ */

function getTrackerStatus() {
  return {
    enabled:     TRACKING.enabled,
    initialized: TRACKER.initialized,
    hasDb:       !!DB,
    uid:         TRACKER.uid || 'none',
    sessionId:   TRACKER.sessionId || 'none',
  };
}

/* ================================================
   ADMIN — LOAD DASHBOARD DATA
   Called from xvi7admin/js/admin-stats.js
================================================ */

async function loadAdminDashboard() {
  if (!DB) {
    return {
      today:    { visitors: 0, sessions: 0, totalTime: 0, avgWpm: 0 },
      weekly:   { labels: [], data: [] },
      yearly:   { labels: [], data: [] },
      allTime:  { visitors: 0, sessions: 0, totalTime: 0 },
      recent:   [],
    };
  }

  /* Parallel fetch */
  const [today, weekly, yearly, allTime, recent] = await Promise.all([
    dbGetTodayStats(),
    dbGetWeeklyVisitors(),
    dbGetYearlyVisitors(),
    dbGetAllTimeStats(),
    dbGetRecentSessions(10),
  ]);

  return { today, weekly, yearly, allTime, recent };
}
