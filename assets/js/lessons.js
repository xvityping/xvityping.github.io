/* ================================================
   XVITYPING — LESSONS ENGINE
   lessons.js  — All parts unlocked by default
================================================ */

async function loadLessons() {
  try {
    const [enRes,bnRes] = await Promise.all([
      fetch('./data/lessons-en.json'),
      fetch('./data/lessons-bn.json'),
    ]);
    S.lessonsEN = enRes.ok ? await enRes.json() : LESSONS_EN_FALLBACK;
    S.lessonsBN = bnRes.ok ? await bnRes.json() : LESSONS_BN_FALLBACK;
  } catch(e) {
    S.lessonsEN = LESSONS_EN_FALLBACK;
    S.lessonsBN = LESSONS_BN_FALLBACK;
  }
}

function buildLessonsGrid(tab) {
  S.lessonTab = tab||'en';
  const grid=el('lessons-grid');
  if (!grid) return;
  const list=S.lessonTab==='bn'?S.lessonsBN:S.lessonsEN;
  if (!list||list.length===0){ grid.innerHTML='<p style="color:var(--text-muted)">No lessons found</p>'; return; }
  grid.innerHTML=list.map(l=>buildLessonCard(l)).join('');
  syncLessonTabs(S.lessonTab);
  updateLessonsProgress();
}

function buildLessonCard(lesson) {
  const progress   = storageGetLessonProgress(lesson.id);
  const total      = lesson.parts?lesson.parts.length:10;
  const isFullDone = storageIsLessonDone(lesson.id,total);
  const isBn       = lesson.lang==='bn';
  const num        = lesson.id>100?lesson.id-100:lesson.id;
  const lbl        = isBn?'পাঠ':'Lesson';

  const dots = Array.from({length:total},(_,i)=>{
    const done=storageIsPartDone(lesson.id,i+1);
    return `<div class="part-dot ${done?'done':''}" title="Part ${i+1}"></div>`;
  }).join('');

  return `
    <div class="ls-card ${isFullDone?'completed':''}" onclick="openLesson(${lesson.id})">
      <div class="ls-num">${lbl} ${num}</div>
      <h4 class="${isBn?'bn-text':''}">${lesson.title}</h4>
      <p  class="${isBn?'bn-text':''}">${lesson.desc}</p>
      <div class="ls-card-footer">
        <span class="diff-badge ${lesson.diff}">${lesson.diff}</span>
        <span class="ls-parts-count">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${progress}/${total}
        </span>
      </div>
      <div class="ls-parts-dots">${dots}</div>
      ${isFullDone?`<div class="ls-done"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>`:''}
    </div>`;
}

function openLesson(lessonId) {
  const list=[...(S.lessonsEN||[]),...(S.lessonsBN||[])];
  const lesson=list.find(l=>l.id===lessonId);
  if (!lesson) return;
  if (lesson.lang&&lesson.lang!==S.lang) setLang(lesson.lang);
  nav('lesson-detail',{lesson});
}

function buildPartsGrid(lesson) {
  const grid=el('parts-grid');
  if (!grid||!lesson) return;
  const isBn=lesson.lang==='bn';
  const dt=el('lesson-detail-title'),dd=el('lesson-detail-desc'),ddf=el('lesson-detail-diff');
  if (dt){ dt.textContent=lesson.title; dt.className=isBn?'bn-text':''; }
  if (dd){ dd.textContent=lesson.desc;  dd.className=isBn?'bn-text':''; }
  if (ddf){ ddf.className=`diff-badge ${lesson.diff}`; ddf.textContent=lesson.diff; }
  if (!lesson.parts||lesson.parts.length===0){ grid.innerHTML='<p>No parts</p>'; return; }
  grid.innerHTML=lesson.parts.map((part,i)=>buildPartCard(lesson,part,i)).join('');
}

function buildPartCard(lesson,part,idx) {
  const isDone = storageIsPartDone(lesson.id,idx+1);
  const isBn   = lesson.lang==='bn';
  /* ALL parts are unlocked — no lock */
  let preview = part.text||'';
  if (preview.startsWith('__FETCH')) preview=isBn?'অনলাইন থেকে লোড হবে…':'Loaded online…';
  else preview=preview.length>44?preview.slice(0,44)+'…':preview;

  const bestKey=`best_${lesson.id}_${idx+1}`;
  const bestWpm=localStorage.getItem(bestKey);

  return `
    <div class="part-card ${isDone?'done':''}" onclick="startPart(${lesson.id},${idx})">
      <div class="part-num">Part ${idx+1}</div>
      <h5 class="${isBn?'bn-text':''}">${part.title}</h5>
      <div class="part-preview ${isBn?'bn-text':''}">${preview}</div>
      ${bestWpm?`<div class="part-best"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${bestWpm} WPM</div>`:''}
      ${isDone?`<div class="part-done-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>`:''}
    </div>`;
}

function startPart(lessonId, partIdx) {
  const list=[...(S.lessonsEN||[]),...(S.lessonsBN||[])];
  const lesson=list.find(l=>l.id===lessonId);
  if (!lesson) return;
  S.lesson=lesson; S.partIdx=partIdx;
  S.timerMode='inf'; /* Always infinity for lessons */
  let text=lesson.parts[partIdx].text;
  if (text.startsWith('__FETCH')) {
    S.lang=text.includes('BN')?'bn':'en';
    nav('test',{lesson,partIdx}); fetchText(); return;
  }
  nav('test',{lesson,partIdx});
}

function filterLessons(tab,btn) {
  S.lessonTab=tab;
  document.querySelectorAll('.ltab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (tab!==S.lang) setLang(tab);
  buildLessonsGrid(tab);
}

function savePartBest(lessonId,partIdx,wpm) {
  const key=`best_${lessonId}_${partIdx+1}`;
  const cur=parseInt(localStorage.getItem(key)||'0');
  if (wpm>cur) localStorage.setItem(key,wpm);
}

const LESSONS_EN_FALLBACK=[{id:1,title:'Home Row Keys',desc:'Master asdf jkl',diff:'beginner',lang:'en',parts:Array.from({length:10},(_,i)=>({part:i+1,title:`Part ${i+1}`,text:'aaa sss ddd fff jjj kkk lll asdf jkl fdsa lkj add ask fall glad'}))}];
const LESSONS_BN_FALLBACK=[{id:101,title:'হোম রো',desc:'আসদফ গহজকল',diff:'beginner',lang:'bn',parts:Array.from({length:10},(_,i)=>({part:i+1,title:`অংশ ${i+1}`,text:'আসদ ফগহ জকল সদফ গহজ কলআ'}))}];
