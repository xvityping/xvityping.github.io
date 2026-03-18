/* ================================================
   XVITYPING — TYPING ENGINE
   typing.js
================================================ */

/* ================================================
   FETCH TEXT FROM ONLINE APIs
================================================ */

async function fetchText() {
  showState('load');

  /* Bangla — use local fallback pool */
  if (S.lang === 'bn' || S.typeMode === 'bn') {
    const t = FB_BN[Math.floor(Math.random() * FB_BN.length)];
    initTest(t);
    return;
  }

  /* Numbers mode */
  if (S.typeMode === 'num') {
    const t = FB_NUM[Math.floor(Math.random() * FB_NUM.length)];
    initTest(t);
    return;
  }

  /* Symbols mode */
  if (S.typeMode === 'sym') {
    const t = FB_SYM[Math.floor(Math.random() * FB_SYM.length)];
    initTest(t);
    return;
  }

  /* English — try APIs */
  let text = '';

  /* API 1 — random words */
  try {
    const r = await fetch(
      'https://random-word-api.vercel.app/api?words=40',
      { signal: AbortSignal.timeout(3500) }
    );
    if (r.ok) {
      const w = await r.json();
      if (Array.isArray(w) && w.length > 5) {
        text = [...w, ...w.slice(0, 20)].join(' ');
      }
    }
  } catch (e) {}

  /* API 2 — quotable.io */
  if (!text) {
    try {
      const r = await fetch(
        'https://api.quotable.io/random?minLength=80&maxLength=220',
        { signal: AbortSignal.timeout(4000) }
      );
      if (r.ok) {
        const d = await r.json();
        text = d.content || '';
      }
    } catch (e) {}
  }

  /* Fallback */
  if (!text) {
    text = FB_EN[Math.floor(Math.random() * FB_EN.length)];
    toast('Offline — using built-in text', 'w');
  }

  initTest(text);
}

/* ================================================
   FALLBACK TEXT POOLS
================================================ */

const FB_EN = [
  'The quick brown fox jumps over the lazy dog. A smooth sea never made a skilled sailor. Every moment is a fresh beginning.',
  'Success is not final failure is not fatal it is the courage to continue that counts. Act as if what you do makes a difference.',
  'The only way to do great work is to love what you do. Technology is best when it brings people together.',
  'In the middle of every difficulty lies opportunity. Imagination is more important than knowledge for it is the preview of life.',
  'Not only are we in the universe the universe is in us. Every atom in your body came from a star that exploded long ago.',
];

const FB_BN = [
  'আমাদের দেশ বাংলাদেশ। এখানে সুন্দর প্রকৃতি আছে। নদী মাঠ পাখি ফুল সব মিলিয়ে এক অপরূপ দৃশ্য।',
  'বাংলা আমাদের মাতৃভাষা। ভাষার জন্য আমাদের পূর্বপুরুষেরা জীবন দিয়েছেন। আমরা গর্বিত।',
  'জ্ঞানই শক্তি। শিক্ষাই জাতির মেরুদণ্ড। প্রতিদিন নতুন কিছু শিখলে জীবনে এগিয়ে যাওয়া যায়।',
  'পরিশ্রম সৌভাগ্যের মূল। যে পরিশ্রম করে সে জীবনে সফল হয়। কাজকে ভালোবাসতে হয়।',
  'আকাশ নীল গাছ সবুজ নদী맑া মানুষ ভালো দেশ সুন্দর। বাংলাদেশ আমার প্রিয় জন্মভূমি।',
];

const FB_NUM = [
  '1 2 3 4 5 6 7 8 9 0 12 34 56 78 90 123 456 789 1234 5678 9012 1357 2468 0246 13579',
  '100 200 300 400 500 1000 2000 5000 10000 99 88 77 66 55 44 33 22 11 42 73 18 65 29',
  '2024 2025 2026 1971 1952 365 24 60 3600 1000000 3.14 2.71 1.41 9.81 6.67',
  '$12.50 $99.99 $1000 $3.75 $250.00 42 items 15 march 2025 floor 404 room 7b',
  '01234 56789 11111 22222 33333 44444 55555 66666 77777 88888 99999 00000',
];

const FB_SYM = [
  "it's can't won't don't I'm we're they're she's he's isn't aren't wasn't",
  "wait - stop! go? now... (done) [ok] {yes} wait - stop! go? (done) [ok]",
  "the price was $12.50, not $15.00. call 555-1234 before 9pm. order #42.",
  "note: this is done; wait: go! (if true) then [run] else {stop} now.",
  "hello@email.com http://example.com user_name #hashtag @mention +1-800-555",
];

/* ================================================
   INIT TEST  — set text, build display, reset state
================================================ */

function initTest(text) {
  S.text = text;
  resetTestState();
  buildDisplay(text);
  showState('hint');
  updateLessonInfoBar();
}

/* ================================================
   BUILD 4-LINE DISPLAY
================================================ */

function buildDisplay(text) {
  const disp  = document.getElementById('text-display');
  const inner = document.getElementById('text-inner');
  if (!disp || !inner) return;

  inner.innerHTML = '';
  S.chars = [];

  const words = text.split(' ');

  words.forEach((word, wi) => {
    const ws = document.createElement('span');
    ws.className    = 'word-wrap';
    ws.dataset.wi   = wi;

    /* Spread to handle Unicode (Bangla multi-byte chars) */
    [...word].forEach(ch => {
      const el = document.createElement('span');
      el.className  = 'ch';
      el.textContent = ch;
      ws.appendChild(el);
      S.chars.push(el);
    });

    inner.appendChild(ws);

    /* Space between words */
    if (wi < words.length - 1) {
      const sp = document.createElement('span');
      sp.className   = 'ch sp';
      sp.textContent = ' ';
      inner.appendChild(sp);
      S.chars.push(sp);
    }
  });

  /* Mark first char */
  if (S.chars.length > 0) {
    S.chars[0].classList.add('current');
  }

  /* Compute line height for scroll */
  requestAnimationFrame(() => {
    const style    = getComputedStyle(disp);
    S.lineHeight   = parseFloat(style.lineHeight) || 38;
    S.currentLine  = 0;
    inner.style.transform = 'translateY(0)';
  });
}

/* ================================================
   SHOW STATE  — hint | load | text
================================================ */

function showState(which) {
  const card  = document.getElementById('text-card');
  const hint  = document.getElementById('hint-state');
  const load  = document.getElementById('load-state');
  const disp  = document.getElementById('text-display');

  if (!card) return;

  hint.style.display = 'none';
  load.style.display = 'none';
  disp.style.display = 'none';
  card.classList.remove('centered', 'running');

  if (which === 'hint') {
    hint.style.display = 'flex';
    card.classList.add('centered');
  } else if (which === 'load') {
    load.style.display = 'flex';
    card.classList.add('centered');
  } else if (which === 'text') {
    disp.style.display = 'block';
    card.classList.add('running');
  }
}

/* ================================================
   RESET TEST STATE
================================================ */

function resetTestState() {
  S.idx        = 0;
  S.mistakes   = 0;
  S.totalKS    = 0;
  S.correctKS  = 0;
  S.wpmHistory = [];
  S.t0         = null;
  S.running    = false;
  S.paused     = false;
  S.currentLine = 0;

  clearInterval(S.tInterval);
  clearInterval(S.wInterval);

  /* Reset UI */
  el('s-wpm').textContent = '0';
  el('s-acc').textContent = '100';
  el('s-err').textContent = '0';

  const td = el('timer-disp');
  if (td) td.className = 'timer-big';

  el('stop-btn').style.display = 'none';
  setBtnState('idle');
  setTimerDisplay();
  setProg(1);
  clearKbHl();

  /* Reset 4-line scroll */
  const inner = document.getElementById('text-inner');
  if (inner) inner.style.transform = 'translateY(0)';
}

/* ================================================
   KEYDOWN HANDLER  — registered in app.js
================================================ */

function onKey(e) {
  /* Language shortcut always fires */
  if (handleLangShortcut(e)) return;

  /* Detect lock key states */
  detectLockKeys(e);

  /* Only handle typing on test screen */
  if (S.screen !== 'test') return;

  /* Auto-start on first key if not running */
  if (!S.running && !S.paused && S.chars.length > 0) {
    if (e.key.length === 1 || e.key === 'Backspace') {
      startTest();
      if (e.key === 'Backspace') return;
    } else {
      return;
    }
  }

  if (!S.running) return;

  /* Prevent browser default for typing keys */
  if (e.key.length === 1 || ['Backspace', 'Enter', 'Tab'].includes(e.key)) {
    e.preventDefault();
  }

  const k = e.key;

  if (k === 'Escape')    { pauseTest(); return; }
  if (k === 'Backspace') { doBackspace(); return; }
  if (k.length !== 1)    return;

  /* Map key → character */
  let typed;
  if (S.lang === 'bn') {
    typed = BIJOY[k] !== undefined ? BIJOY[k] : k;
  } else {
    typed = k;
  }

  typeChar(typed, k);
}

/* ================================================
   TYPE ONE CHARACTER
================================================ */

function typeChar(typed, raw) {
  if (S.idx >= S.chars.length) return;

  S.totalKS++;
  const expected = S.chars[S.idx].textContent;

  S.chars[S.idx].classList.remove('current');

  if (typed === expected) {
    /* ---- CORRECT ---- */
    S.chars[S.idx].classList.add('correct');
    S.correctKS++;
    beep('ok');
    flashKey(raw, true);
  } else {
    /* ---- WRONG ---- */
    S.chars[S.idx].classList.add('wrong');
    S.mistakes++;
    el('s-err').textContent = S.mistakes;
    beep('bad');
    flashKey(raw, false);

    /* Shake the whole word */
    const wordEl = S.chars[S.idx].closest('.word-wrap');
    if (wordEl) {
      wordEl.classList.remove('shake');
      void wordEl.offsetWidth; /* reflow */
      wordEl.classList.add('shake');
      setTimeout(() => wordEl.classList.remove('shake'), 300);
    }

    /* Extra totalKS penalty for error */
    S.totalKS++;
  }

  S.idx++;

  if (S.idx < S.chars.length) {
    S.chars[S.idx].classList.add('current');
    hlNextKey();
    scrollToCurrentLine();
  } else {
    /* All characters typed — finish */
    finishTest();
  }
}

/* ================================================
   BACKSPACE
================================================ */

function doBackspace() {
  if (S.idx === 0) return;

  /* Remove current marker */
  if (S.idx < S.chars.length) {
    S.chars[S.idx].classList.remove('current');
  }

  S.idx--;

  /* Reset char to neutral + current */
  const wasCorrect = S.chars[S.idx].classList.contains('correct');
  S.chars[S.idx].className = 'ch' +
    (S.chars[S.idx].classList.contains('sp') ? ' sp' : '') +
    ' current';

  if (wasCorrect && S.correctKS > 0) S.correctKS--;

  hlNextKey();
  scrollToCurrentLine();
}

/* ================================================
   4-LINE SCROLL  — translate #text-inner upward
================================================ */

function scrollToCurrentLine() {
  if (S.idx >= S.chars.length) return;

  const inner = document.getElementById('text-inner');
  if (!inner || S.lineHeight <= 0) return;

  const charEl = S.chars[S.idx];
  const disp   = document.getElementById('text-display');
  if (!charEl || !disp) return;

  /* Get char position relative to inner container */
  const charTop  = charEl.offsetTop;
  const lineNum  = Math.floor(charTop / S.lineHeight);

  /* Keep line 1 (index 1) visible — scroll when past line 1 */
  if (lineNum > S.currentLine && lineNum > 1) {
    S.currentLine = lineNum;
    const scrollY = (lineNum - 1) * S.lineHeight;
    inner.style.transform = `translateY(-${scrollY}px)`;
  }
}

/* ================================================
   SET BUTTON STATE  — idle | run | pause
================================================ */

function setBtnState(st) {
  const btn  = el('main-btn');
  const ico  = el('main-icon');
  const txt  = el('main-txt');
  if (!btn || !ico || !txt) return;

  const isBn = S.lang === 'bn';

  if (st === 'idle') {
    btn.className = 'btn btn-primary btn-lg';
    ico.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    txt.textContent = isBn ? 'শুরু' : 'Start';
  } else if (st === 'run') {
    btn.className = 'btn btn-secondary btn-lg';
    ico.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    txt.textContent = isBn ? 'বিরতি' : 'Pause';
  } else if (st === 'pause') {
    btn.className = 'btn btn-primary btn-lg';
    ico.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    txt.textContent = isBn ? 'আবার শুরু' : 'Resume';
  }
}

/* ================================================
   LESSON INFO BAR  (part dots)
================================================ */

function updateLessonInfoBar() {
  const bar = document.getElementById('lesson-info-bar');
  if (!bar) return;

  if (!S.lesson) {
    bar.classList.remove('visible');
    return;
  }

  bar.classList.add('visible');

  const title = bar.querySelector('.lib-title');
  const part  = bar.querySelector('.lib-part');
  const dots  = bar.querySelector('.lib-part-dots');

  if (title) title.textContent = S.lesson.title;
  if (part)  part.textContent  = `Part ${S.partIdx + 1} / ${S.lesson.parts.length}`;

  if (dots) {
    dots.innerHTML = '';
    S.lesson.parts.forEach((_, i) => {
      const d = document.createElement('div');
      const isDone = storageIsPartDone(S.lesson.id, i + 1);
      d.className = 'lib-dot' +
        (isDone ? ' done' : '') +
        (i === S.partIdx ? ' current' : '');
      d.title = `Part ${i + 1}`;
      d.onclick = () => {
        if (i !== S.partIdx) startPart(S.lesson, i);
      };
      dots.appendChild(d);
    });
  }
}

/* ================================================
   PART COMPLETE OVERLAY
================================================ */

function showPartComplete(wpm, acc) {
  const ov = document.getElementById('part-complete-overlay');
  if (!ov) return;

  const wpmEl = ov.querySelector('.pco-wpm');
  const subEl = ov.querySelector('.pco-sub');
  if (wpmEl) wpmEl.textContent = wpm;
  if (subEl) subEl.textContent = `${acc}% accuracy`;

  ov.classList.add('show');
}

function hidePartComplete() {
  const ov = document.getElementById('part-complete-overlay');
  if (ov) ov.classList.remove('show');
}

/* ================================================
   UTILITY — el() shorthand
================================================ */

function el(id) {
  return document.getElementById(id);
}

/* ================================================
   SET PROGRESS BAR
================================================ */

function setProg(ratio) {
  const fill = el('prog');
  if (fill) fill.style.width = (Math.max(0, Math.min(1, ratio)) * 100) + '%';
}
