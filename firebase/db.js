/* ================================================
   XVITYPING — FIREBASE DATABASE HELPERS
   firebase/db.js
================================================ */

/* Firestore instance — set by tracker.js after init */
let DB  = null;
let AUTH = null;

/* ================================================
   INIT FIREBASE
================================================ */

async function initFirebase() {
  if (!TRACKING.enabled) return false;

  try {
    /* Load Firebase SDKs from CDN */
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');

    /* Initialize app (avoid duplicate) */
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    DB   = firebase.firestore();
    AUTH = firebase.auth();

    /* Sign in anonymously so rules allow writes */
    await AUTH.signInAnonymously();

    return true;
  } catch (e) {
    console.warn('Firebase init failed — tracking disabled:', e.message);
    DB   = null;
    AUTH = null;
    return false;
  }
}

/* ================================================
   LOAD SCRIPT HELPER
================================================ */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); return;
    }
    const s   = document.createElement('script');
    s.src     = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ================================================
   LOG VISITOR
   Collection: visitors/{autoId}
================================================ */

async function dbLogVisitor(data) {
  if (!DB || !TRACKING.visitors) return;
  try {
    await DB.collection('visitors').add({
      ...data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('dbLogVisitor failed:', e.message);
  }
}

/* ================================================
   LOG SESSION  (typing session result)
   Collection: sessions/{autoId}
================================================ */

async function dbLogSession(data) {
  if (!DB || !TRACKING.sessions) return;
  try {
    await DB.collection('sessions').add({
      ...data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('dbLogSession failed:', e.message);
  }
}

/* ================================================
   UPDATE DAILY STATS
   Document: daily_stats/YYYY-MM-DD
================================================ */

async function dbUpdateDailyStats(date, fields) {
  if (!DB || !TRACKING.dailyStats) return;
  try {
    const ref = DB.collection('daily_stats').doc(date);
    await ref.set(fields, { merge: true });
  } catch (e) {
    console.warn('dbUpdateDailyStats failed:', e.message);
  }
}

/* ================================================
   INCREMENT DAILY FIELD  (atomic counter)
================================================ */

async function dbIncrDailyField(date, field, amount = 1) {
  if (!DB) return;
  try {
    const ref = DB.collection('daily_stats').doc(date);
    await ref.set(
      { [field]: firebase.firestore.FieldValue.increment(amount) },
      { merge: true }
    );
  } catch (e) {
    console.warn('dbIncrDailyField failed:', e.message);
  }
}

/* ================================================
   ADMIN — GET DAILY STATS RANGE
   Returns array of { date, visitors, sessions, totalTime }
================================================ */

async function dbGetDailyStats(days = 30) {
  if (!DB) return [];
  try {
    const snap = await DB
      .collection('daily_stats')
      .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
      .limit(days)
      .get();

    return snap.docs.map(doc => ({ date: doc.id, ...doc.data() })).reverse();
  } catch (e) {
    console.warn('dbGetDailyStats failed:', e.message);
    return [];
  }
}

/* ================================================
   ADMIN — GET VISITOR COUNT FOR PERIOD
================================================ */

async function dbGetVisitorCount(startDate, endDate) {
  if (!DB) return 0;
  try {
    const snap = await DB
      .collection('visitors')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    return snap.size;
  } catch (e) {
    console.warn('dbGetVisitorCount failed:', e.message);
    return 0;
  }
}

/* ================================================
   ADMIN — GET TODAY'S STATS SUMMARY
================================================ */

async function dbGetTodayStats() {
  if (!DB) return null;
  try {
    const today = todayStr();
    const doc   = await DB.collection('daily_stats').doc(today).get();
    return doc.exists ? doc.data() : {
      visitors: 0,
      sessions: 0,
      totalTime: 0,
      avgWpm: 0,
    };
  } catch (e) {
    console.warn('dbGetTodayStats failed:', e.message);
    return null;
  }
}

/* ================================================
   ADMIN — GET ALL-TIME STATS
================================================ */

async function dbGetAllTimeStats() {
  if (!DB) return null;
  try {
    const snap = await DB.collection('daily_stats').get();
    let total = { visitors: 0, sessions: 0, totalTime: 0 };

    snap.docs.forEach(doc => {
      const d = doc.data();
      total.visitors  += d.visitors  || 0;
      total.sessions  += d.sessions  || 0;
      total.totalTime += d.totalTime || 0;
    });

    return total;
  } catch (e) {
    console.warn('dbGetAllTimeStats failed:', e.message);
    return null;
  }
}

/* ================================================
   ADMIN — GET RECENT SESSIONS
================================================ */

async function dbGetRecentSessions(limit = 20) {
  if (!DB) return [];
  try {
    const snap = await DB
      .collection('sessions')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn('dbGetRecentSessions failed:', e.message);
    return [];
  }
}

/* ================================================
   ADMIN — GET WEEKLY VISITOR COUNTS  (last 7 days)
================================================ */

async function dbGetWeeklyVisitors() {
  if (!DB) return { labels: [], data: [] };
  try {
    const days   = 7;
    const labels = [];
    const data   = [];

    for (let i = days - 1; i >= 0; i--) {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      labels.push(str.slice(5)); /* MM-DD */

      const doc = await DB.collection('daily_stats').doc(str).get();
      data.push(doc.exists ? (doc.data().visitors || 0) : 0);
    }

    return { labels, data };
  } catch (e) {
    console.warn('dbGetWeeklyVisitors failed:', e.message);
    return { labels: [], data: [] };
  }
}

/* ================================================
   ADMIN — GET YEARLY VISITOR COUNTS  (last 12 months)
================================================ */

async function dbGetYearlyVisitors() {
  if (!DB) return { labels: [], data: [] };
  try {
    const snap = await DB
      .collection('daily_stats')
      .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
      .limit(365)
      .get();

    /* Aggregate by month */
    const months = {};
    snap.docs.forEach(doc => {
      const month = doc.id.slice(0, 7); /* YYYY-MM */
      months[month] = (months[month] || 0) + (doc.data().visitors || 0);
    });

    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: sorted.map(([k]) => k),
      data:   sorted.map(([, v]) => v),
    };
  } catch (e) {
    console.warn('dbGetYearlyVisitors failed:', e.message);
    return { labels: [], data: [] };
  }
}

/* ================================================
   ADMIN — GET UNIQUE USER SESSIONS
================================================ */

async function dbGetUserSessionStats(uid) {
  if (!DB || !uid) return null;
  try {
    const snap = await DB
      .collection('sessions')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    if (snap.empty) return null;

    const sessions = snap.docs.map(d => d.data());
    const totalTime = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const avgWpm    = sessions.reduce((a, s) => a + (s.wpm || 0), 0) / sessions.length;

    return {
      count:     sessions.length,
      totalTime: Math.round(totalTime),
      avgWpm:    Math.round(avgWpm),
      lastSeen:  sessions[0]?.date || '',
    };
  } catch (e) {
    console.warn('dbGetUserSessionStats failed:', e.message);
    return null;
  }
}

/* ================================================
   DATE HELPERS
================================================ */

function todayStr() {
  return new Date().toISOString().split('T')[0]; /* YYYY-MM-DD */
}

function nowMs() {
  return Date.now();
}
