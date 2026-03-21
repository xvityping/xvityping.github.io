/* ================================================
   XVITYPING — TYPING ENGINE  (full rewrite)
   typing.js
================================================ */

/* ── Infinity text queue ── */
let infinityQueue = [];
let infinityFetching = false;

async function fetchText() {
  showState('load');

  if (S.lang==='bn' || S.typeMode==='bn') { initTest(FB_BN[Math.floor(Math.random()*FB_BN.length)]); return; }
  if (S.typeMode==='num') { initTest(FB_NUM[Math.floor(Math.random()*FB_NUM.length)]); return; }
  if (S.typeMode==='sym') { initTest(FB_SYM[Math.floor(Math.random()*FB_SYM.length)]); return; }

  /* Word count by mode */
  let wc = 200;
  if      (S.timerMode===60)       wc = 150;
  else if (S.timerMode===180)      wc = 300;
  else if (S.timerMode===300)      wc = 500;
  else if (S.timerMode==='custom') wc = Math.max(150, Math.round(S.customSec/60*150));
  else if (S.timerMode==='inf')    wc = 250;

  let text = '';
  /* Try random words API */
  try {
    const r = await fetch(`https://random-word-api.vercel.app/api?words=${wc}`, { signal: AbortSignal.timeout(3500) });
    if (r.ok) { const w = await r.json(); if (Array.isArray(w) && w.length > 10) text = w.join(' '); }
  } catch(e){}

  /* Try quotable for longer quote */
  if (!text || text.split(' ').length < 50) {
    try {
      const r = await fetch('https://api.quotable.io/quotes/random?limit=3&minLength=200', { signal: AbortSignal.timeout(4000) });
      if (r.ok) { const d = await r.json(); text = d.map(q=>q.content).join(' '); }
    } catch(e){}
  }

  if (!text) { text = FB_EN[Math.floor(Math.random()*FB_EN.length)]; toast('Offline — built-in text','w'); }
  initTest(text);
}

/* ── Fetch more text for infinity append ── */
async function fetchMoreText() {
  if (infinityFetching) return;
  infinityFetching = true;
  let text = '';
  try {
    const r = await fetch('https://random-word-api.vercel.app/api?words=200', { signal: AbortSignal.timeout(3500) });
    if (r.ok) { const w = await r.json(); if (Array.isArray(w)) text = w.join(' '); }
  } catch(e){}
  if (!text) text = FB_EN[Math.floor(Math.random()*FB_EN.length)];
  if (text) appendInfinityText(text);
  infinityFetching = false;
}

function appendInfinityText(text) {
  const inner = el('text-inner');
  if (!inner) return;
  const words = text.split(' ');
  words.forEach((word, wi) => {
    /* Add space before first word of new chunk */
    if (wi === 0 && S.chars.length > 0) {
      const sp = document.createElement('span');
      sp.className='ch sp'; sp.textContent=' ';
      inner.appendChild(sp); S.chars.push(sp);
    }
    const ws = document.createElement('span');
    ws.className='word-wrap';
    [...word].forEach(ch => {
      const e=document.createElement('span');
      e.className='ch'; e.textContent=ch;
      ws.appendChild(e); S.chars.push(e);
    });
    inner.appendChild(ws);
    if (wi < words.length-1) {
      const sp=document.createElement('span');
      sp.className='ch sp'; sp.textContent=' ';
      inner.appendChild(sp); S.chars.push(sp);
    }
  });
}

const FB_EN = [
  'The universe is under no obligation to make sense to you. We are all connected to each other biologically to the earth chemically and to the rest of the universe atomically. Not only are we in the universe the universe is in us. I do not know of any deeper spiritual feeling than knowing we are made of star stuff. The nitrogen in our DNA the calcium in our teeth the iron in our blood the carbon in our apple pies were made in the interiors of collapsing stars. We are all star stuff. The cosmos is within us. We are made of star stuff. We are a way for the universe to know itself.',
  'In the middle of every difficulty lies opportunity. Imagination is more important than knowledge for knowledge is limited whereas imagination encircles the world. The measure of intelligence is the ability to change. Life is like riding a bicycle to keep your balance you must keep moving. Try not to become a man of success but rather try to become a man of value. The important thing is not to stop questioning. Curiosity has its own reason for existing. One cannot help but be in awe when he contemplates the mysteries of eternity of life of the marvelous structure of reality.',
  'Success is not final failure is not fatal it is the courage to continue that counts. It does not matter how slowly you go as long as you do not stop. Our greatest glory is not in never falling but in rising every time we fall. The secret of getting ahead is getting started. All our dreams can come true if we have the courage to pursue them. The way to get started is to quit talking and begin doing. Innovation distinguishes between a leader and a follower. Your time is limited so do not waste it living someone else life.',
  'Technology is best when it brings people together. The advance of technology is based on making it fit in so that you do not really even notice it so it is part of everyday life. Any sufficiently advanced technology is indistinguishable from magic. The first rule of any technology used in a business is that automation applied to an efficient operation will magnify the efficiency. The second is that automation applied to an inefficient operation will magnify the inefficiency. It has become appallingly obvious that our technology has exceeded our humanity.',
  'Knowledge is power. Education is the most powerful weapon which you can use to change the world. The more that you read the more things you will know. The more that you learn the more places you will go. An investment in knowledge pays the best interest. The beautiful thing about learning is that nobody can take it away from you. Education is not preparation for life education is life itself. The roots of education are bitter but the fruit is sweet. Give a man a fish and you feed him for a day teach a man to fish and you feed him for a lifetime.',
];

const FB_BN = [
  'বাংলাদেশ একটি সুন্দর দেশ। এখানে সবুজ মাঠ নীল আকাশ এবং অসংখ্য নদী আছে। আমাদের মাতৃভাষা বাংলা যা পৃথিবীর অন্যতম মিষ্টি ভাষা। বাংলার প্রকৃতি অপরূপ সুন্দর। পদ্মা মেঘনা যমুনা নদীর কলকল শব্দে মন ভরে যায়। সোনালি ধানের মাঠে কৃষকের পরিশ্রমে এ দেশ সোনা হয়ে ওঠে। আমরা এই দেশকে ভালোবাসি এবং এর উন্নয়নে কাজ করতে চাই।',
  'জ্ঞানই শক্তি। শিক্ষাই জাতির মেরুদণ্ড। যে জাতি যত বেশি শিক্ষিত সে জাতি তত বেশি উন্নত। প্রতিদিন নতুন কিছু শিখলে জীবনে এগিয়ে যাওয়া যায়। পরিশ্রম সৌভাগ্যের মূল। যে পরিশ্রম করে সে জীবনে সফল হয়। কাজকে ভালোবাসতে হয় এবং নিষ্ঠার সাথে কাজ করতে হয়। সাফল্য একদিনে আসে না ধৈর্য ধরে এগিয়ে যেতে হয়।',
  'আমাদের দেশের ইতিহাস গৌরবময়। একাত্তরের মুক্তিযুদ্ধে লক্ষ লক্ষ মানুষ জীবন দিয়েছেন। তাদের আত্মত্যাগে আমরা স্বাধীনতা পেয়েছি। এই স্বাধীনতাকে রক্ষা করা আমাদের দায়িত্ব। বাংলাদেশের মানুষ অত্যন্ত পরিশ্রমী এবং সাহসী। তারা প্রতিকূল পরিস্থিতিতেও হাসিমুখে কাজ করে যায়।',
];

const FB_NUM = [
  '1 2 3 4 5 6 7 8 9 0 12 23 34 45 56 67 78 89 90 100 200 300 400 500 1000 2000 5000 10000 99 88 77 66 55 44 33 22 11 42 73 18 65 29 37 84 56 91 2024 2025 2026',
  '365 24 60 3600 12 7 52 30 31 28 29 100 1000 1000000 3.14 2.71 1.41 9.81 6.67 299792458 6.626 1.602 42 73 137 1729',
];

const FB_SYM = [
  "it's can't won't don't I'm we're they're she's he's isn't aren't wasn't",
  "the price was $12.50, not $15.00. call 555-1234 before 9pm. order #42.",
  "note: this is done; wait: go! (if true) then [run] else {stop} now.",
];

function initTest(text) {
  if (S.lesson) {
    S.timerMode = 'inf';
    setTimerValue(0);
    const td=el('timer-disp');
    if (td) { td.className='timer-big infinity'; td.textContent='0:00'; }
  }
  S.text = text;
  resetTestState();
  buildDisplay(text);
  /* Prefetch more text for infinity */
  if (S.timerMode === 'inf' && !S.lesson) {
    infinityQueue = [];
    fetchMoreText();
  }
  showState('hint');
  updateLessonInfoBar();
}

function buildDisplay(text) {
  const disp  = el('text-display');
  const inner = el('text-inner');
  if (!disp||!inner) return;
  inner.innerHTML=''; S.chars=[];
  const words = text.split(' ');
  words.forEach((word,wi) => {
    const ws=document.createElement('span');
    ws.className='word-wrap'; ws.dataset.wi=wi;
    [...word].forEach(ch => {
      const e=document.createElement('span');
      e.className='ch'; e.textContent=ch;
      ws.appendChild(e); S.chars.push(e);
    });
    inner.appendChild(ws);
    if (wi<words.length-1) {
      const sp=document.createElement('span');
      sp.className='ch sp'; sp.textContent=' ';
      inner.appendChild(sp); S.chars.push(sp);
    }
  });
  if (S.chars.length>0) S.chars[0].classList.add('current');
  requestAnimationFrame(()=>{
    const style=getComputedStyle(disp);
    S.lineHeight=parseFloat(style.lineHeight)||38;
    S.currentLine=0;
    inner.style.transform='translateY(0)';
  });
}

function showState(which) {
  const card=el('text-card'), hint=el('hint-state'), load=el('load-state'), disp=el('text-display');
  if (!card) return;
  hint.style.display='none'; load.style.display='none'; disp.style.display='none';
  card.classList.remove('centered','running');
  if (which==='hint') { hint.style.display='flex'; card.classList.add('centered'); }
  else if (which==='load') { load.style.display='flex'; card.classList.add('centered'); }
  else if (which==='text') { disp.style.display='block'; card.classList.add('running'); }
}

function resetTestState() {
  S.idx=0; S.mistakes=0; S.totalKS=0; S.correctKS=0;
  S.wpmHistory=[]; S.t0=null; S.running=false; S.paused=false; S.currentLine=0;
  clearInterval(S.tInterval); clearInterval(S.wInterval);
  el('s-wpm').textContent='0'; el('s-acc').textContent='100'; el('s-err').textContent='0';
  const td=el('timer-disp');
  if (td) {
    td.className=(S.lesson||S.timerMode==='inf')?'timer-big infinity':'timer-big';
    td.textContent=(S.lesson||S.timerMode==='inf')?'0:00':String(S.timerSec);
  }
  el('stop-btn').style.display='none';
  setBtnState('idle'); setTimerDisplay(); setProg(1); clearKbHl();
  const inner=el('text-inner');
  if (inner) inner.style.transform='translateY(0)';
}

/* ── KEY HANDLER ── */
function onKey(e) {
  if (handleLangShortcut(e)) return;
  detectLockKeys(e);
  if (S.screen !== 'test') return;
  /* Refocus ghost input on any click in test screen (mobile fix) */
  el('ghost-input')?.focus();

  /* Part complete overlay */
  if (S.waitingForNext) {
    if (e.key==='Enter') { e.preventDefault(); goToNextPart(); return; }
    if (e.key===' ')     { e.preventDefault(); hidePartComplete(); S.waitingForNext=false; doRestart(); return; }
    return;
  }

  /* Auto-start on ANY letter/number/symbol key or Enter */
  if (!S.running && !S.paused && S.chars.length>0) {
    const isTypingKey = e.key.length===1 || e.key==='Backspace' || e.key==='Enter';
    if (isTypingKey) {
      if (e.key!=='Backspace') e.preventDefault();
      startTest();
      if (e.key==='Backspace') return;
      if (e.key==='Enter') return; /* just start, don't type Enter */
    } else { return; }
  }

  if (!S.running) return;
  if (e.key.length===1 || ['Backspace','Tab'].includes(e.key)) e.preventDefault();

  const k=e.key;
  if (k==='Escape')    { pauseTest(); return; }
  if (k==='Backspace') { doBackspace(); return; }
  if (k.length!==1) return;

  const typed = S.lang==='bn' ? (BIJOY[k]!==undefined?BIJOY[k]:k) : k;
  typeChar(typed,k);
}

function typeChar(typed, raw) {
  if (S.idx>=S.chars.length) return;
  S.totalKS++;
  const expected=S.chars[S.idx].textContent;
  S.chars[S.idx].classList.remove('current');
  if (typed===expected) {
    S.chars[S.idx].classList.add('correct');
    S.correctKS++; beep('ok'); flashKey(raw,true);
  } else {
    S.chars[S.idx].classList.add('wrong');
    S.mistakes++; el('s-err').textContent=S.mistakes;
    beep('bad'); flashKey(raw,false);
    const w=S.chars[S.idx].closest('.word-wrap');
    if (w){ w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); setTimeout(()=>w.classList.remove('shake'),300); }
    S.totalKS++;
  }
  S.idx++;

  /* Infinity mode — fetch more when near end (NOT in lesson mode) */
  if (S.timerMode==='inf' && !S.lesson && S.idx > S.chars.length - 100) fetchMoreText();

  if (S.idx<S.chars.length) {
    S.chars[S.idx].classList.add('current');
    hlNextKey(); scrollToCurrentLine();
  } else {
    /* Text finished */
    if (S.lesson) {
      finishTest();
    } else if (S.timerMode === 'inf') {
      fetchMoreText();
    } else {
      finishTest();
    }
  }
}

function doBackspace() {
  if (S.idx===0) return;
  if (S.idx<S.chars.length) S.chars[S.idx].classList.remove('current');
  S.idx--;
  const wasSp=S.chars[S.idx].classList.contains('sp');
  const wasOk=S.chars[S.idx].classList.contains('correct');
  S.chars[S.idx].className='ch'+(wasSp?' sp':'')+' current';
  if (wasOk&&S.correctKS>0) S.correctKS--;
  hlNextKey(); scrollToCurrentLine();
}

function scrollToCurrentLine() {
  if (S.idx>=S.chars.length) return;
  const inner=el('text-inner');
  if (!inner||S.lineHeight<=0) return;
  const charEl=S.chars[S.idx];
  if (!charEl) return;
  const lineNum=Math.floor(charEl.offsetTop/S.lineHeight);
  if (lineNum>S.currentLine&&lineNum>1) {
    S.currentLine=lineNum;
    inner.style.transform=`translateY(-${(lineNum-1)*S.lineHeight}px)`;
  }
}

function setBtnState(st) {
  const btn=el('main-btn'),ico=el('main-icon'),txt=el('main-txt');
  if (!btn||!ico||!txt) return;
  const bn=S.lang==='bn';
  if (st==='idle')  { btn.className='btn btn-primary btn-lg'; ico.innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>'; txt.textContent=bn?'শুরু':'Start'; }
  else if (st==='run') { btn.className='btn btn-secondary btn-lg'; ico.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; txt.textContent=bn?'বিরতি':'Pause'; }
  else if (st==='pause') { btn.className='btn btn-primary btn-lg'; ico.innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>'; txt.textContent=bn?'আবার শুরু':'Resume'; }
}

function updateLessonInfoBar() {
  const bar=el('lesson-info-bar');
  if (!bar) return;
  if (!S.lesson) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  const title=bar.querySelector('.lib-title'),part=bar.querySelector('.lib-part'),dots=bar.querySelector('.lib-part-dots');
  if (title) title.textContent=S.lesson.title;
  if (part)  part.textContent=`Part ${S.partIdx+1} / ${S.lesson.parts.length}`;
  if (dots) {
    dots.innerHTML='';
    S.lesson.parts.forEach((_,i)=>{
      const d=document.createElement('div');
      const done=storageIsPartDone(S.lesson.id,i+1);
      d.className='lib-dot'+(done?' done':'')+(i===S.partIdx?' current':'');
      d.title=`Part ${i+1}`;
      d.onclick=()=>{ if(i!==S.partIdx) startPart(S.lesson,i); };
      dots.appendChild(d);
    });
  }
}

function hidePartComplete() {
  const ov=el('part-complete-overlay');
  if (ov) ov.classList.remove('show');
  S.waitingForNext=false;
}

function el(id){ return document.getElementById(id); }
function setProg(r){ const f=el('prog'); if(f) f.style.width=(Math.max(0,Math.min(1,r))*100)+'%'; }
