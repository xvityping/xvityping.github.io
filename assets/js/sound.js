/* ================================================
   XVITYPING — SOUND ENGINE  (fixed volume)
   sound.js
================================================ */

let VOLUME = 0.5;

function getACtx() {
  if (!S.audioCtx) {
    try { S.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; }
  }
  if (S.audioCtx.state === 'suspended') S.audioCtx.resume();
  return S.audioCtx;
}

/* Master gain node — all sounds go through this */
let masterGain = null;
function getMasterGain() {
  const ctx = getACtx();
  if (!ctx) return null;
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = VOLUME;
  }
  return masterGain;
}

function setVolume(v) {
  VOLUME = Math.max(0, Math.min(1, parseFloat(v)));
  lsSet('xvt_volume', VOLUME);
  /* Apply immediately to master gain */
  if (masterGain) masterGain.gain.value = VOLUME;
  /* Update slider display */
  const s = document.getElementById('vol-slider');
  if (s) s.value = Math.round(VOLUME * 100);
}

function loadVolume() {
  VOLUME = lsGet('xvt_volume', 0.5);
  if (masterGain) masterGain.gain.value = VOLUME;
  const s = document.getElementById('vol-slider');
  if (s) s.value = Math.round(VOLUME * 100);
}

function playTone(opts) {
  if (!S.soundOn) return;
  const ctx = getACtx();
  const mg  = getMasterGain();
  if (!ctx || !mg) return;
  try {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g);
    g.connect(mg);   /* route through master gain */
    osc.type            = opts.type    || 'sine';
    osc.frequency.value = opts.freq    || 440;
    osc.detune.value    = opts.detune  || 0;
    const now = ctx.currentTime;
    g.gain.setValueAtTime(opts.gain || 0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (opts.duration || 0.08));
    if (opts.freqSteps) opts.freqSteps.forEach(s => osc.frequency.setValueAtTime(s.f, now + s.t));
    osc.start(now);
    osc.stop(now + (opts.duration || 0.08) + 0.01);
  } catch(e) {}
}

function beepOk()     { playTone({ freq:900,  type:'sine',     gain:.06,  duration:.065 }); }
function beepBad()    { playTone({ freq:160,  type:'sawtooth', gain:.07,  duration:.13  }); }
function beepStart()  { playTone({ freq:440,  type:'sine',     gain:.05,  duration:.08  }); setTimeout(()=>playTone({ freq:660, type:'sine', gain:.05, duration:.10 }), 90); }
function beepPause()  { playTone({ freq:550,  type:'sine',     gain:.05,  duration:.08  }); setTimeout(()=>playTone({ freq:380, type:'sine', gain:.04, duration:.10 }), 90); }
function beepWarn()   { playTone({ freq:620,  type:'triangle', gain:.05,  duration:.10  }); }
function beepDanger() { playTone({ freq:820,  type:'square',   gain:.04,  duration:.07  }); }
function beepWin()    { playTone({ freq:523,  type:'sine',     gain:.08,  duration:.50, freqSteps:[{t:.0,f:523},{t:.1,f:659},{t:.2,f:784},{t:.3,f:1047}] }); }
function beepBest()   { [784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>playTone({ freq:f, type:'sine', gain:.06, duration:.14 }),i*100)); }

function beep(type) {
  switch(type) {
    case 'ok':     beepOk();     break;
    case 'bad':    beepBad();    break;
    case 'start':  beepStart();  break;
    case 'pause':  beepPause();  break;
    case 'warn':   beepWarn();   break;
    case 'danger': beepDanger(); break;
    case 'win':    beepWin();    break;
    case 'best':   beepBest();   break;
  }
}

function toggleSound() {
  S.soundOn = !S.soundOn;
  storageSetSound(S.soundOn);
  updateSoundUI();
  if (S.soundOn) beepOk();
}

function updateSoundUI() {
  const btn    = document.getElementById('snd-btn');
  const iconOn = document.getElementById('snd-icon-on');
  const iconOf = document.getElementById('snd-icon-off');
  if (!btn) return;
  if (S.soundOn) {
    btn.classList.remove('muted'); btn.classList.add('on');
    if (iconOn) iconOn.style.display='block';
    if (iconOf) iconOf.style.display='none';
  } else {
    btn.classList.add('muted'); btn.classList.remove('on');
    if (iconOn) iconOn.style.display='none';
    if (iconOf) iconOf.style.display='block';
  }
}
