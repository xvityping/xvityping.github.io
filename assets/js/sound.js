/* ================================================
   XVITYPING — SOUND ENGINE
   sound.js
   Uses Web Audio API — no external files needed
================================================ */

/* ================================================
   GET / CREATE AUDIO CONTEXT
================================================ */

function getACtx() {
  if (!S.audioCtx) {
    try {
      S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  /* Resume if suspended (browser autoplay policy) */
  if (S.audioCtx.state === 'suspended') {
    S.audioCtx.resume();
  }
  return S.audioCtx;
}

/* ================================================
   LOW-LEVEL TONE PLAYER
================================================ */

function playTone(opts) {
  /*
    opts = {
      freq:      440,          // Hz
      type:     'sine',        // oscillator type
      gain:      0.05,         // start gain
      duration:  0.08,         // seconds
      rampEnd:   0.001,        // final gain (for smooth cutoff)
      detune:    0,            // cents
      freqSteps: null,         // [{ t: sec, f: Hz }] for arpeggios
    }
  */
  if (!S.soundOn) return;
  const ctx = getACtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gn  = ctx.createGain();
    osc.connect(gn);
    gn.connect(ctx.destination);

    osc.type            = opts.type     || 'sine';
    osc.frequency.value = opts.freq     || 440;
    osc.detune.value    = opts.detune   || 0;

    const now = ctx.currentTime;
    gn.gain.setValueAtTime(opts.gain || 0.05, now);
    gn.gain.exponentialRampToValueAtTime(
      opts.rampEnd  || 0.001,
      now + (opts.duration || 0.08)
    );

    /* Frequency steps (for arpeggios / win sound) */
    if (opts.freqSteps) {
      opts.freqSteps.forEach(step => {
        osc.frequency.setValueAtTime(step.f, now + step.t);
      });
    }

    osc.start(now);
    osc.stop(now + (opts.duration || 0.08) + 0.01);
  } catch (e) {
    /* Silently fail — sound is non-critical */
  }
}

/* ================================================
   SOUND PRESETS
================================================ */

/* Correct keypress — soft high tick */
function beepOk() {
  playTone({
    freq:     900,
    type:     'sine',
    gain:     0.035,
    duration: 0.065,
    rampEnd:  0.001,
  });
}

/* Wrong keypress — low sawtooth buzz */
function beepBad() {
  playTone({
    freq:     160,
    type:     'sawtooth',
    gain:     0.055,
    duration: 0.13,
    rampEnd:  0.001,
  });
}

/* Test start — rising two-tone */
function beepStart() {
  playTone({ freq: 440, type: 'sine', gain: 0.04, duration: 0.08 });
  setTimeout(() =>
    playTone({ freq: 660, type: 'sine', gain: 0.04, duration: 0.10 }), 90);
}

/* Pause — descending two-tone */
function beepPause() {
  playTone({ freq: 550, type: 'sine', gain: 0.04, duration: 0.08 });
  setTimeout(() =>
    playTone({ freq: 380, type: 'sine', gain: 0.03, duration: 0.10 }), 90);
}

/* Timer warning (≤20s) — medium ping */
function beepWarn() {
  playTone({
    freq:     620,
    type:     'triangle',
    gain:     0.04,
    duration: 0.10,
    rampEnd:  0.001,
  });
}

/* Timer danger (≤10s) — urgent ping */
function beepDanger() {
  playTone({
    freq:     820,
    type:     'square',
    gain:     0.03,
    duration: 0.07,
    rampEnd:  0.001,
  });
}

/* Part complete — ascending arpeggio */
function beepPartDone() {
  const notes = [523, 659, 784];
  notes.forEach((f, i) => {
    setTimeout(() =>
      playTone({ freq: f, type: 'sine', gain: 0.05, duration: 0.12 }),
      i * 110
    );
  });
}

/* Test complete / WIN — full fanfare */
function beepWin() {
  playTone({
    freq:     523,
    type:     'sine',
    gain:     0.07,
    duration: 0.50,
    rampEnd:  0.001,
    freqSteps: [
      { t: 0.00, f: 523 },
      { t: 0.10, f: 659 },
      { t: 0.20, f: 784 },
      { t: 0.30, f: 1047 },
    ],
  });
}

/* New personal best — special sparkle */
function beepBest() {
  const seq = [784, 1047, 1319, 1568];
  seq.forEach((f, i) => {
    setTimeout(() =>
      playTone({
        freq: f, type: 'sine',
        gain: 0.05, duration: 0.14,
      }),
      i * 100
    );
  });
}

/* ---------- UNIFIED DISPATCHER ---------- */
function beep(type) {
  switch (type) {
    case 'ok':       beepOk();       break;
    case 'bad':      beepBad();      break;
    case 'start':    beepStart();    break;
    case 'pause':    beepPause();    break;
    case 'warn':     beepWarn();     break;
    case 'danger':   beepDanger();   break;
    case 'part':     beepPartDone(); break;
    case 'win':      beepWin();      break;
    case 'best':     beepBest();     break;
  }
}

/* ================================================
   TOGGLE SOUND ON/OFF
================================================ */

function toggleSound() {
  S.soundOn = !S.soundOn;
  storageSetSound(S.soundOn);
  updateSoundUI();
  if (S.soundOn) beepOk(); /* confirmation beep */
}

function updateSoundUI() {
  const btn     = document.getElementById('snd-btn');
  const iconOn  = document.getElementById('snd-icon-on');
  const iconOff = document.getElementById('snd-icon-off');

  if (!btn) return;

  if (S.soundOn) {
    btn.classList.remove('muted');
    btn.classList.add('on');
    btn.title = 'Sound ON — click to mute';
  } else {
    btn.classList.add('muted');
    btn.classList.remove('on');
    btn.title = 'Sound OFF — click to unmute';
  }

  if (iconOn)  iconOn.style.display  = S.soundOn ? 'block' : 'none';
  if (iconOff) iconOff.style.display = S.soundOn ? 'none'  : 'block';
}
