/* ================================================
   XVITYPING — TIMER ENGINE
   timer.js
================================================ */

/* ================================================
   SET TIMER MODE
================================================ */

function setTimerMode(mode, btn) {
  /* Stop running test */
  if (S.running || S.paused) doRestart();

  if (mode === 'custom') {
    const v = parseInt(el('custom-sec')?.value) || S.customSec;
    S.customSec  = v;
    S.timerMode  = 'custom';
    setTimerValue(v);
    storageSetCustomSec(v);
  } else if (mode === 'inf') {
    S.timerMode = 'inf';
    setTimerValue(0); /* infinity — no countdown */
  } else {
    S.timerMode = mode;
    setTimerValue(mode);
  }

  storageSetTimerMode(S.timerMode);
  highlightTimerBtn(mode);

  /* Reload text when mode changes (unless lesson) */
  if (S.screen === 'test' && !S.lesson) fetchText();
}

/* ================================================
   SET TIMER VALUE
================================================ */

function setTimerValue(sec) {
  S.timerSec = sec;
  S.timerMax = sec;
  setTimerDisplay();
  setProg(1);
}

/* ================================================
   TIMER DISPLAY
================================================ */

function setTimerDisplay() {
  const td = el('timer-disp');
  if (!td) return;

  if (S.timerMode === 'inf') {
    td.textContent = '∞';
    td.className   = 'timer-big infinity';
    return;
  }

  const t = S.timerSec;
  const m = Math.floor(t / 60);
  const s = t % 60;
  td.textContent = m > 0
    ? `${m}:${String(s).padStart(2, '0')}`
    : String(s);
}

/* ================================================
   HIGHLIGHT TIMER MODE BUTTON
================================================ */

function highlightTimerBtn(mode) {
  document.querySelectorAll('.t-mode').forEach(b => b.classList.remove('active'));

  const map = {
    60:       'tm-60',
    120:      'tm-120',
    300:      'tm-300',
    'custom': 'tm-c',
    'inf':    'tm-inf',
  };

  const target = el(map[mode]);
  if (target) target.classList.add('active');
}

/* ================================================
   CUSTOM TIMER INPUT CHANGED
================================================ */

function customTimerChanged() {
  const v = parseInt(el('custom-sec')?.value) || 90;
  S.customSec = Math.max(10, Math.min(600, v));
  storageSetCustomSec(S.customSec);

  if (S.timerMode === 'custom') {
    setTimerValue(S.customSec);
    if (S.screen === 'test' && !S.running && S.text) {
      initTest(S.text);
    }
  }
}

/* ================================================
   MAIN BUTTON — Start / Pause / Resume
================================================ */

function handleMain() {
  if (!S.running && !S.paused) startTest();
  else if (S.running)           pauseTest();
  else                          resumeTest();
}

/* ================================================
   START TEST
================================================ */

function startTest() {
  if (!S.text || S.chars.length === 0) {
    toast(S.lang === 'bn' ? 'টেক্সট লোড হয়নি' : 'No text loaded', 'e');
    return;
  }

  S.running = true;
  S.paused  = false;
  S.t0      = Date.now();

  showState('text');
  setBtnState('run');
  el('stop-btn').style.display = 'inline-flex';
  el('ghost-input')?.focus();

  hlNextKey();
  startTimers();
  beep('start');

  toast(S.lang === 'bn' ? 'শুরু করুন! শুভকামনা' : 'Go! Good luck', 'i');
}

/* ================================================
   PAUSE TEST
================================================ */

function pauseTest() {
  S.running = false;
  S.paused  = true;
  clearInterval(S.tInterval);
  clearInterval(S.wInterval);
  setBtnState('pause');
  beep('pause');
  toast(S.lang === 'bn' ? 'বিরতি — Resume চাপুন' : 'Paused', 'i');
}

/* ================================================
   RESUME TEST
================================================ */

function resumeTest() {
  S.running = true;
  S.paused  = false;

  /* Recalculate t0 so elapsed time is preserved */
  const elapsed = (S.timerMax - S.timerSec) * 1000;
  S.t0 = Date.now() - elapsed;

  setBtnState('run');
  startTimers();
  el('ghost-input')?.focus();
}

/* ================================================
   STOP TEST (manual)
================================================ */

function doStop() {
  clearInterval(S.tInterval);
  clearInterval(S.wInterval);
  S.running = false;
  S.paused  = false;
  setBtnState('idle');
  el('stop-btn').style.display = 'none';

  /* Show results only if meaningful progress */
  if (S.correctKS > 5) {
    finishTest();
  } else {
    toast(S.lang === 'bn' ? 'বন্ধ করা হয়েছে' : 'Stopped', 'e');
    doRestart();
  }
}

/* ================================================
   RESTART
================================================ */

function doRestart() {
  clearInterval(S.tInterval);
  clearInterval(S.wInterval);
  clearKbHl();
  hidePartComplete();

  /* Restore timer */
  const sec = S.timerMode === 'custom' ? S.customSec
    : S.timerMode === 'inf'    ? 0
    : typeof S.timerMode === 'number' ? S.timerMode : 60;

  setTimerValue(sec);

  const td = el('timer-disp');
  if (td) td.className = S.timerMode === 'inf' ? 'timer-big infinity' : 'timer-big';

  el('stop-btn').style.display = 'none';

  /* Reload text */
  if (S.lesson) {
    initTest(S.lesson.parts[S.partIdx].text);
  } else {
    fetchText();
  }
}

/* ================================================
   COUNTDOWN + WPM UPDATE INTERVALS
================================================ */

function startTimers() {
  /* Countdown — fires every second */
  S.tInterval = setInterval(() => {
    if (!S.running) return;

    /* Infinity mode — count UP instead */
    if (S.timerMode === 'inf') {
      S.timerSec++;
      setTimerDisplay();
      return;
    }

    S.timerSec--;
    setTimerDisplay();
    setProg(S.timerSec / S.timerMax);

    /* Timer state colors */
    const td = el('timer-disp');
    if (td) {
      if (S.timerSec <= 5) {
        td.className = 'timer-big danger';
        beep('danger');
      } else if (S.timerSec <= 15) {
        td.className = 'timer-big warn';
        if (S.timerSec % 5 === 0) beep('warn');
      } else {
        td.className = 'timer-big';
      }
    }

    if (S.timerSec <= 0) finishTest();
  }, 1000);

  /* WPM / accuracy update — every 500ms */
  S.wInterval = setInterval(() => {
    if (!S.running) return;
    const wpm = calcWPM();
    const acc = calcAcc();
    const el_wpm = el('s-wpm');
    const el_acc = el('s-acc');
    if (el_wpm) el_wpm.textContent = wpm;
    if (el_acc) el_acc.textContent = acc;

    /* Store WPM snapshot */
    if (S.t0) {
      S.wpmHistory.push({
        t:   Math.round((Date.now() - S.t0) / 1000),
        wpm: wpm,
      });
    }
  }, 500);
}

/* ================================================
   FINISH TEST
================================================ */

function finishTest() {
  clearInterval(S.tInterval);
  clearInterval(S.wInterval);
  S.running = false;
  S.paused  = false;

  const wpm  = calcWPM();
  const acc  = calcAcc();
  const cpm  = calcCPM();
  const errs = S.mistakes;
  const elapsed = S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0;

  beep('win');

  /* Mark part as done if in lesson */
  if (S.lesson) {
    storageMarkDone(S.lesson.id, S.partIdx + 1);

    /* Check if all parts done */
    if (storageIsLessonDone(S.lesson.id)) {
      beep('best');
      toast(
        S.lang === 'bn'
          ? `পাঠ সম্পন্ন: ${S.lesson.title}`
          : `Lesson complete: ${S.lesson.title}`,
        's'
      );
    }
  }

  /* Increment test count and add time */
  storageIncrTests();
  storageAddTime(elapsed);

  /* Update best score */
  const isNewBest = storageUpdateBest(wpm, acc, cpm);
  if (isNewBest) beep('best');

  /* Save recent score */
  storagePushRecent({
    wpm, acc, errors: errs,
    time: elapsed,
    mode: S.timerMode,
    lang: S.lang,
    date: new Date().toLocaleDateString(),
  });

  /* Show results */
  showResults(wpm, acc, cpm, errs, elapsed, isNewBest);
}
