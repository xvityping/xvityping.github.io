/* ================================================
   XVITYPING — LESSONS ENGINE
   lessons.js
================================================ */

/* ================================================
   LOAD LESSON JSON FILES
================================================ */

async function loadLessons() {
  try {
    const [enRes, bnRes] = await Promise.all([
      fetch('./data/lessons-en.json'),
      fetch('./data/lessons-bn.json'),
    ]);
    S.lessonsEN = enRes.ok ? await enRes.json() : [];
    S.lessonsBN = bnRes.ok ? await bnRes.json() : [];
  } catch (e) {
    console.warn('Lesson JSON load failed:', e);
    S.lessonsEN = LESSONS_EN_FALLBACK;
    S.lessonsBN = LESSONS_BN_FALLBACK;
  }
}

/* ================================================
   BUILD LESSONS GRID
================================================ */

function buildLessonsGrid(tab) {
  S.lessonTab = tab || 'en';
  const grid = el('lessons-grid');
  if (!grid) return;

  const list = S.lessonTab === 'bn' ? S.lessonsBN : S.lessonsEN;

  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.3">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>No lessons found</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(lesson => buildLessonCard(lesson)).join('');
  syncLessonTabs(S.lessonTab);
  updateLessonsProgress();
}

/* ================================================
   BUILD SINGLE LESSON CARD HTML
================================================ */

function buildLessonCard(lesson) {
  const done     = storageGetDoneCount();
  const progress = storageGetLessonProgress(lesson.id);
  const total    = lesson.parts ? lesson.parts.length : 10;
  const isFullDone = storageIsLessonDone(lesson.id, total);
  const isBn     = lesson.lang === 'bn';
  const lessonNum = lesson.id > 100 ? lesson.id - 100 : lesson.id;
  const lbl      = isBn ? 'পাঠ' : 'Lesson';

  /* Build 10 progress dots */
  const dots = Array.from({ length: total }, (_, i) => {
    const partDone    = storageIsPartDone(lesson.id, i + 1);
    const isCurrent   = progress === i && !isFullDone;
    const cls = partDone ? 'done' : isCurrent ? 'current' : '';
    return `<div class="part-dot ${cls}" title="Part ${i + 1}"></div>`;
  }).join('');

  return `
    <div class="ls-card ${isFullDone ? 'completed' : ''}"
         onclick="openLesson(${lesson.id})"
         data-lesson-id="${lesson.id}">

      <div class="ls-num">${lbl} ${lessonNum}</div>

      <h4 class="${isBn ? 'bn-text' : ''}">${lesson.title}</h4>
      <p  class="${isBn ? 'bn-text' : ''}">${lesson.desc}</p>

      <div class="ls-card-footer">
        <span class="diff-badge ${lesson.diff}">${lesson.diff}</span>
        <span class="ls-parts-count">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${progress}/${total}
        </span>
      </div>

      <div class="ls-parts-dots">${dots}</div>

      ${isFullDone ? `
        <div class="ls-done" title="Completed!">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>` : ''}
    </div>`;
}

/* ================================================
   OPEN LESSON  → show parts grid
================================================ */

function openLesson(lessonId) {
  const list   = [...(S.lessonsEN || []), ...(S.lessonsBN || [])];
  const lesson = list.find(l => l.id === lessonId);
  if (!lesson) return;

  /* Switch lang if needed */
  if (lesson.lang && lesson.lang !== S.lang) {
    setLang(lesson.lang);
  }

  nav('lesson-detail', { lesson });
}

/* ================================================
   BUILD PARTS GRID
================================================ */

function buildPartsGrid(lesson) {
  const grid = el('parts-grid');
  if (!grid || !lesson) return;

  /* Update header */
  const detailTitle = el('lesson-detail-title');
  const detailDesc  = el('lesson-detail-desc');
  const detailDiff  = el('lesson-detail-diff');
  const isBn        = lesson.lang === 'bn';

  if (detailTitle) {
    detailTitle.textContent  = lesson.title;
    detailTitle.className    = isBn ? 'bn-text' : '';
  }
  if (detailDesc) {
    detailDesc.textContent   = lesson.desc;
    detailDesc.className     = isBn ? 'bn-text' : '';
  }
  if (detailDiff) {
    detailDiff.className     = `diff-badge ${lesson.diff}`;
    detailDiff.textContent   = lesson.diff;
  }

  if (!lesson.parts || lesson.parts.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted)">No parts found.</p>';
    return;
  }

  /* Find first undone part */
  let firstUndone = 0;
  for (let i = 0; i < lesson.parts.length; i++) {
    if (!storageIsPartDone(lesson.id, i + 1)) {
      firstUndone = i;
      break;
    }
  }

  grid.innerHTML = lesson.parts.map((part, i) => {
    return buildPartCard(lesson, part, i, firstUndone);
  }).join('');
}

/* ================================================
   BUILD SINGLE PART CARD HTML
================================================ */

function buildPartCard(lesson, part, idx, firstUndone) {
  const isDone    = storageIsPartDone(lesson.id, idx + 1);
  const isCurrent = idx === firstUndone && !isDone;
  const isLocked  = idx > firstUndone && !isDone;
  const isBn      = lesson.lang === 'bn';

  /* Preview text — truncate */
  let preview = part.text || '';
  if (preview.startsWith('__FETCH')) {
    preview = isBn ? 'অনলাইন থেকে লোড হবে…' : 'Loaded online…';
  } else {
    preview = preview.length > 42 ? preview.slice(0, 42) + '…' : preview;
  }

  /* Best WPM for this part */
  const bestKey = `best_${lesson.id}_${idx + 1}`;
  const bestWpm = localStorage.getItem(bestKey);

  return `
    <div class="part-card ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''}"
         onclick="startPart(${lesson.id}, ${idx})"
         data-part="${idx + 1}">

      <div class="part-num">Part ${idx + 1}</div>
      <h5 class="${isBn ? 'bn-text' : ''}">${part.title}</h5>
      <div class="part-preview ${isBn ? 'bn-text' : ''}">${preview}</div>

      ${bestWpm ? `
        <div class="part-best">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                             12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          ${bestWpm} WPM
        </div>` : ''}

      ${isDone ? `
        <div class="part-done-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>` : ''}

      ${isLocked ? `
        <div class="part-lock">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>` : ''}
    </div>`;
}

/* ================================================
   START PART  (called from part card click)
================================================ */

function startPart(lessonId, partIdx) {
  const list   = [...(S.lessonsEN || []), ...(S.lessonsBN || [])];
  const lesson = list.find(l => l.id === lessonId);
  if (!lesson) return;

  S.lesson  = lesson;
  S.partIdx = partIdx;

  /* Handle online fetch parts */
  let text = lesson.parts[partIdx].text;
  if (text === '__FETCH_WORDS__' || text === '__FETCH_QUOTE__' ||
      text === '__FETCH_BN_WORDS__' || text === '__FETCH_BN_QUOTE__') {
    S.lang = text.includes('BN') ? 'bn' : 'en';
    if (text.includes('BN')) document.documentElement.setAttribute('data-lang','bn');
    nav('test', { lesson, partIdx });
    fetchText();
    return;
  }

  nav('test', { lesson, partIdx });
}

/* ================================================
   FILTER LESSONS  (tab switch)
================================================ */

function filterLessons(tab, btn) {
  S.lessonTab = tab;

  /* Update tab buttons */
  document.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  /* Auto-switch language */
  if (tab !== S.lang) setLang(tab);

  buildLessonsGrid(tab);
}

/* ================================================
   SAVE PART BEST SCORE
================================================ */

function savePartBest(lessonId, partIdx, wpm) {
  const key     = `best_${lessonId}_${partIdx + 1}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  if (wpm > current) {
    localStorage.setItem(key, wpm);
  }
}

/* ================================================
   INLINE FALLBACK DATA  (if JSON fetch fails)
================================================ */

const LESSONS_EN_FALLBACK = [
  {
    id: 1, title: 'Home Row Keys',
    desc: 'Master asdf jkl — the foundation of touch typing',
    diff: 'beginner', lang: 'en',
    parts: Array.from({ length: 10 }, (_, i) => ({
      part: i + 1,
      title: `Home Row Part ${i + 1}`,
      text: 'aaa sss ddd fff jjj kkk lll asdf jkl fdsa lkj asdf jkl add ask fall glad',
    })),
  },
  {
    id: 2, title: 'Common Words',
    desc: 'The most frequent English words',
    diff: 'easy', lang: 'en',
    parts: Array.from({ length: 10 }, (_, i) => ({
      part: i + 1,
      title: `Common Words Part ${i + 1}`,
      text: 'the and for are but not you all can had her was one our out day get has him',
    })),
  },
];

const LESSONS_BN_FALLBACK = [
  {
    id: 101, title: 'হোম রো',
    desc: 'আসদফ গহজকল — Bijoy হোম রো',
    diff: 'beginner', lang: 'bn',
    parts: Array.from({ length: 10 }, (_, i) => ({
      part: i + 1,
      title: `হোম রো অংশ ${i + 1}`,
      text: 'আসদ ফগহ জকল সদফ গহজ কলআ আসদফ জকল',
    })),
  },
  {
    id: 102, title: 'সহজ শব্দ',
    desc: 'ছোট ছোট সহজ বাংলা শব্দ',
    diff: 'beginner', lang: 'bn',
    parts: Array.from({ length: 10 }, (_, i) => ({
      part: i + 1,
      title: `সহজ শব্দ অংশ ${i + 1}`,
      text: 'আম জল মা বাবা দাদা ভাই বোন ঘর গাছ মাছ পাখি নদী আকাশ',
    })),
  },
];
