/* ================================================
   XVITYPING — TIMER ENGINE
   timer.js
================================================ */

function setTimerMode(mode,btn) {
  if (S.running||S.paused) doRestart();
  if (mode==='custom') {
    const inp=el('custom-min');
    const v=Math.max(1,Math.min(60,parseInt(inp?.value)||2));
    S.customSec=v*60; S.timerMode='custom';
    setTimerValue(S.customSec); storageSetCustomSec(S.customSec);
  } else if (mode==='inf') {
    S.timerMode='inf'; setTimerValue(0);
  } else {
    S.timerMode=mode; setTimerValue(mode);
  }
  storageSetTimerMode(S.timerMode);
  highlightTimerBtn(mode);
  if (S.screen==='test'&&!S.lesson) fetchText();
}

function setTimerValue(sec) {
  S.timerSec=sec; S.timerMax=sec;
  setTimerDisplay(); setProg(1);
}

function setTimerDisplay() {
  const td=el('timer-disp');
  if (!td) return;
  /* Lessons and infinity → show elapsed count-up */
  if (S.lesson||S.timerMode==='inf') {
    const t=S.timerSec;
    const m=Math.floor(t/60), s=t%60;
    td.textContent=`${m}:${String(s).padStart(2,'0')}`;
    td.className='timer-big infinity';
    return;
  }
  const t=S.timerSec, m=Math.floor(t/60), s=t%60;
  td.textContent=m>0?`${m}:${String(s).padStart(2,'0')}`:String(s);
}

function highlightTimerBtn(mode) {
  document.querySelectorAll('.t-mode').forEach(b=>b.classList.remove('active'));
  const map={60:'tm-60',180:'tm-180',300:'tm-300','custom':'tm-c','inf':'tm-inf'};
  const t=el(map[mode]); if(t) t.classList.add('active');
}

function customTimerChanged() {
  const inp=el('custom-min');
  const v=Math.max(1,Math.min(60,parseInt(inp?.value)||2));
  S.customSec=v*60; storageSetCustomSec(S.customSec);
  if (S.timerMode==='custom') { setTimerValue(S.customSec); if(S.screen==='test'&&!S.running&&S.text) initTest(S.text); }
}

function handleMain() {
  if (!S.running&&!S.paused) startTest();
  else if (S.running) pauseTest();
  else resumeTest();
}

function startTest() {
  if (!S.text||S.chars.length===0) { toast('No text loaded','e'); return; }
  S.running=true; S.paused=false; S.t0=Date.now();
  showState('text'); setBtnState('run');
  el('stop-btn').style.display='inline-flex';
  el('ghost-input')?.focus();
  hlNextKey(); startTimers(); beep('start');
}

function pauseTest() {
  S.running=false; S.paused=true;
  clearInterval(S.tInterval); clearInterval(S.wInterval);
  setBtnState('pause'); beep('pause');
  toast(S.lang==='bn'?'বিরতি':'Paused','i');
}

function resumeTest() {
  S.running=true; S.paused=false;
  /* Preserve elapsed */
  if (S.lesson||S.timerMode==='inf') {
    S.t0=Date.now()-(S.timerSec*1000);
  } else {
    const elapsed=(S.timerMax-S.timerSec)*1000;
    S.t0=Date.now()-elapsed;
  }
  setBtnState('run'); startTimers(); el('ghost-input')?.focus();
}

function doStop() {
  clearInterval(S.tInterval); clearInterval(S.wInterval);
  S.running=false; S.paused=false; setBtnState('idle');
  el('stop-btn').style.display='none';
  if (S.correctKS>3) finishTest();
  else { toast('Stopped','e'); doRestart(); }
}

function doRestart() {
  clearInterval(S.tInterval); clearInterval(S.wInterval);
  clearKbHl(); hidePartComplete();
  if (S.lesson) { S.timerMode='inf'; setTimerValue(0); }
  else {
    const sec=S.timerMode==='custom'?S.customSec:S.timerMode==='inf'?0:typeof S.timerMode==='number'?S.timerMode:60;
    setTimerValue(sec);
  }
  const td=el('timer-disp');
  if (td) td.className=(S.lesson||S.timerMode==='inf')?'timer-big infinity':'timer-big';
  el('stop-btn').style.display='none';
  if (S.lesson) initTest(S.lesson.parts[S.partIdx].text);
  else fetchText();
}

function startTimers() {
  S.tInterval=setInterval(()=>{
    if (!S.running) return;
    /* Lessons & infinity — count UP */
    if (S.lesson||S.timerMode==='inf') {
      S.timerSec=Math.round((Date.now()-S.t0)/1000);
      setTimerDisplay(); return;
    }
    S.timerSec--; setTimerDisplay(); setProg(S.timerSec/S.timerMax);
    const td=el('timer-disp');
    if (td) {
      if (S.timerSec<=5) { td.className='timer-big danger'; beep('danger'); }
      else if (S.timerSec<=15) { td.className='timer-big warn'; if(S.timerSec%5===0) beep('warn'); }
      else td.className='timer-big';
    }
    if (S.timerSec<=0) finishTest();
  },1000);

  S.wInterval=setInterval(()=>{
    if (!S.running) return;
    const wpm=calcWPM(),acc=calcAcc();
    const ew=el('s-wpm'),ea=el('s-acc');
    if (ew) ew.textContent=wpm;
    if (ea) ea.textContent=acc;
    if (S.t0) S.wpmHistory.push({t:Math.round((Date.now()-S.t0)/1000),wpm});
  },500);
}

/* ================================================
   FINISH TEST
================================================ */
function finishTest() {
  clearInterval(S.tInterval); clearInterval(S.wInterval);
  S.running=false; S.paused=false;
  const wpm=calcWPM(), acc=calcAcc(), cpm=calcCPM();
  const errs=S.mistakes;
  const elapsed=S.t0?Math.round((Date.now()-S.t0)/1000):0;
  const totalWords=S.text?S.text.split(' ').length:0;

  beep('win');
  storageIncrTests(); storageAddTime(elapsed);
  const isNewBest=storageUpdateBest(wpm,acc,cpm);
  if (isNewBest) beep('best');
  storagePushRecent({wpm,acc,errors:errs,time:elapsed,mode:S.timerMode,lang:S.lang,date:new Date().toLocaleDateString()});

  /* LESSON MODE → show in-card overlay */
  if (S.lesson) {
    storageMarkDone(S.lesson.id,S.partIdx+1);
    savePartBest(S.lesson.id,S.partIdx,wpm);
    /* Update progress bar immediately */
    if(typeof updateLessonsProgress==='function') updateLessonsProgress();
    const totalParts=S.lesson.parts.length;
    const hasNext=S.partIdx+1<totalParts;
    if (storageIsLessonDone(S.lesson.id,totalParts)) { beep('best'); toast(`Lesson complete: ${S.lesson.title}`,'s'); }
    buildPartsGrid(S.lesson); /* refresh part cards */
    updateLessonsProgress();   /* update 0/160 counter */
    showPartCompleteOverlay(wpm,acc,errs,elapsed,totalWords,S.correctKS,hasNext);
    S.waitingForNext=true;
    return;
  }

  /* FREE TEST → results screen */
  showResults(wpm,acc,cpm,errs,elapsed,isNewBest);
}

/* ── Part complete overlay ── */
function showPartCompleteOverlay(wpm,acc,errs,elapsed,totalWords,correct,hasNext) {
  const ov=el('part-complete-overlay');
  if (!ov) return;
  const m=Math.floor(elapsed/60),s=elapsed%60;
  const timeStr=m>0?`${m}:${String(s).padStart(2,'0')}`:`${s}s`;
  ov.innerHTML=`
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;padding:8px 0">
      <div style="font-family:var(--font-head);font-size:.82rem;color:var(--correct);text-transform:uppercase;letter-spacing:.12em;display:flex;align-items:center;gap:7px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Part ${S.partIdx+1} Complete
      </div>
      <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center">
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:3rem;font-weight:800;color:var(--accent);line-height:1">${wpm}</div><div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-top:3px">WPM</div></div>
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:3rem;font-weight:800;color:var(--correct);line-height:1">${acc}%</div><div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-top:3px">Accuracy</div></div>
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:3rem;font-weight:800;color:#a78bfa;line-height:1">${timeStr}</div><div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-top:3px">Time</div></div>
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;font-size:.82rem">
        <span>Words: <b style="color:var(--text)">${totalWords}</b></span>
        <span style="color:var(--correct)">Correct: <b>${correct}</b></span>
        <span style="color:var(--wrong)">Wrong: <b>${errs}</b></span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px">
        <button class="btn btn-ghost btn-sm" onclick="hidePartComplete();doRestart()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          Restart
        </button>
        ${hasNext?`<button class="btn btn-primary" id="next-part-btn" onclick="goToNextPart()">Next Part <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>`:
        `<button class="btn btn-primary" onclick="nav('lessons')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> All Done!</button>`}
      </div>
      <div style="font-size:.68rem;color:var(--text-muted);display:flex;align-items:center;gap:8px">
        <span class="kbd">Enter</span> = Next &nbsp;·&nbsp; <span class="kbd">Space</span> = Restart
      </div>
    </div>`;
  ov.classList.add('show');
  el('ghost-input')?.focus();
}

function goToNextPart() {
  if (!S.lesson) return;
  const nextIdx=S.partIdx+1;
  if (nextIdx>=S.lesson.parts.length) return;
  hidePartComplete(); S.waitingForNext=false;
  S.partIdx=nextIdx;
  const text=S.lesson.parts[nextIdx].text;
  if (text.startsWith('__FETCH')) fetchText();
  else initTest(text);
  updateLessonInfoBar();
  toast(`Part ${nextIdx+1} / ${S.lesson.parts.length}`,'i');
}

function formatTimeSec(sec) {
  if (sec<60) return sec+'s';
  return Math.floor(sec/60)+'m '+(sec%60)+'s';
}
