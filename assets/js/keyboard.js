/* ================================================
   XVITYPING — KEYBOARD ENGINE
   keyboard.js

   Layout: Unijoy (উনিজয়)
   Based on the official Unijoy keyboard chart.
   Normal mode = unshifted, Shift mode = shifted.
================================================ */

/* ================================================
   UNIJOY → UNICODE MAP
   Key: e.key value from keydown event
   Value: Unicode Bangla character produced
================================================ */

const BIJOY = {   /* kept as BIJOY variable name so rest of code still works */

  /* ── NUMBER ROW — Unshifted ─────────────────── */
  '`': '\u200C',  /* ZWNJ */
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  '0': '০',
  '-': '-',
  '=': '=',

  /* ── TOP ROW — Unshifted ────────────────────── */
  'q': 'ঙ',    /* nga */
  'w': 'য',    /* ya (antastha) */
  'e': 'ড',    /* Da (retroflex) */
  'r': 'প',    /* pa */
  't': 'ট',    /* Ta (retroflex) */
  'y': 'চ',    /* cha */
  'u': 'জ',    /* ja */
  'i': 'হ',    /* ha */
  'o': 'গ',    /* ga */
  'p': 'ড়',   /* rha (retroflex flap) */
  '[': '[',
  ']': ']',
  '\\': 'ঃ',   /* visarga */

  /* ── HOME ROW — Unshifted ───────────────────── */
  'a': 'া',    /* aa-kaar (vowel sign) */
  's': '্',    /* hasanta / virama */
  'd': 'ী',    /* ii-kaar (dirgha) */
  'f': 'অ',    /* a (independent short) */
  'g': '।',    /* purna biram (full stop) */
  'h': 'ব',    /* ba */
  'j': 'ক',    /* ka */
  'k': 'ত',    /* ta */
  'l': 'দ',    /* da */
  ';': ';',
  "'": "'",

  /* ── BOTTOM ROW — Unshifted ─────────────────── */
  'z': '্য',   /* ya-phala (hasanta + ya) */
  'x': 'ৌ',    /* ou-kaar */
  'c': 'ে',    /* e-kaar */
  'v': 'ল',    /* la */
  'b': 'ণ',    /* Na (retroflex) */
  'n': 'স',    /* sa */
  'm': 'শ',    /* sha (palatal) */
  ',': ',',
  '.': '.',
  '/': '/',
  ' ': ' ',

  /* ── NUMBER ROW — Shifted ───────────────────── */
  '~': '~',
  '!': '!',
  '@': '@',
  '#': '#',
  '$': '৳',    /* taka sign */
  '%': '%',
  '^': '÷',
  '&': '&',
  '*': '*',
  '(': '(',
  ')': ')',
  '_': '—',    /* em dash */
  '+': '+',

  /* ── TOP ROW — Shifted ──────────────────────── */
  'Q': 'ঙ',    /* nga (same, some variants differ) */
  'W': 'য',    /* ya */
  'E': 'ড',    /* Da */
  'R': 'ফ',    /* pha */
  'T': 'ঠ',    /* Tha (retroflex) */
  'Y': 'ছ',    /* chha */
  'U': 'ঝ',    /* jha */
  'I': 'এ',    /* e (independent) */
  'O': 'ঘ',    /* gha */
  'P': 'ঢ়',   /* rha variant */
  '{': '{',
  '}': '}',
  '|': '|',

  /* ── HOME ROW — Shifted ─────────────────────── */
  'A': 'আ',    /* aa (independent) */
  'S': '্',    /* hasanta (same as unshifted) */
  'D': 'ি',    /* i-kaar (hraswa short) */
  'F': 'আ',    /* aa (independent, alt) */
  'G': '।',    /* purna biram */
  'H': 'ভ',    /* bha */
  'J': 'খ',    /* kha */
  'K': 'থ',    /* tha */
  'L': 'ধ',    /* dha */
  ':': ':',
  '"': '"',

  /* ── BOTTOM ROW — Shifted ───────────────────── */
  'Z': 'য',    /* ya (plain, no ya-phala) */
  'X': 'নো',   /* na + o-kaar combined */
  'C': 'ৈ',    /* oi-kaar */
  'V': 'র',    /* ra */
  'B': 'ন',    /* na */
  'N': 'ষ',    /* Sha (retroflex sibilant) */
  'M': 'ম',    /* ma */
  '<': '<',
  '>': '>',
  '?': '?',
};

/* ================================================
   UNIJOY VISUAL KEYBOARD LAYOUT
   Each key: { e: EN_label, b: normal_char, s: shifted_char, w: width_class }
   b = bottom / normal (unshifted)
   s = top-left / shifted
================================================ */

const KB_BIJOY_ROWS = [
  /* Row 0 — number row */
  [
    { e:'`',   b:'\u200C', s:'~'    },
    { e:'1',   b:'১',      s:'!'    },
    { e:'2',   b:'২',      s:'@'    },
    { e:'3',   b:'৩',      s:'#'    },
    { e:'4',   b:'৪',      s:'৳'   },
    { e:'5',   b:'৫',      s:'%'    },
    { e:'6',   b:'৬',      s:'÷'    },
    { e:'7',   b:'৭',      s:'&'    },
    { e:'8',   b:'৮',      s:'*'    },
    { e:'9',   b:'৯',      s:'('    },
    { e:'0',   b:'০',      s:')'    },
    { e:'-',   b:'-',      s:'—'    },
    { e:'=',   b:'=',      s:'+'    },
    { e:'⌫',   b:'',       s:'',    w:'w110' },
  ],
  /* Row 1 — Q row */
  [
    { e:'Tab',  b:'',  s:'',  w:'w70' },
    { e:'q',   b:'ঙ',  s:''   },
    { e:'w',   b:'য',  s:''   },
    { e:'e',   b:'ড',  s:''   },
    { e:'r',   b:'প',  s:'ফ'  },
    { e:'t',   b:'ট',  s:'ঠ'  },
    { e:'y',   b:'চ',  s:'ছ'  },
    { e:'u',   b:'জ',  s:'ঝ'  },
    { e:'i',   b:'হ',  s:'এ'  },
    { e:'o',   b:'গ',  s:'ঘ'  },
    { e:'p',   b:'ড়', s:'ঢ়' },
    { e:'[',   b:'[',  s:'{'   },
    { e:']',   b:']',  s:'}'   },
    { e:'\\',  b:'ঃ',  s:'|',  w:'w60' },
  ],
  /* Row 2 — A row (home row) */
  [
    { e:'Caps',  b:'',  s:'',  w:'w90' },
    { e:'a',   b:'া',  s:'আ'  },   /* aa-kaar / AA independent */
    { e:'s',   b:'্',  s:'্'  },   /* hasanta (both modes) */
    { e:'d',   b:'ী',  s:'ি'  },   /* ii-kaar / i-kaar */
    { e:'f',   b:'অ',  s:'আ'  },   /* a / aa independent */
    { e:'g',   b:'।',  s:'।'  },   /* purna biram */
    { e:'h',   b:'ব',  s:'ভ'  },   /* ba / bha */
    { e:'j',   b:'ক',  s:'খ'  },   /* ka / kha */
    { e:'k',   b:'ত',  s:'থ'  },   /* ta / tha */
    { e:'l',   b:'দ',  s:'ধ'  },   /* da / dha */
    { e:';',   b:';',  s:':'   },
    { e:"'",   b:"'",  s:'"'   },
    { e:'Enter', b:'', s:'',   w:'w90' },
  ],
  /* Row 3 — Z row */
  [
    { e:'⇧',   b:'',   s:'',   w:'w110' },
    { e:'z',   b:'্য', s:'য'   },   /* ya-phala / ya plain */
    { e:'x',   b:'ৌ',  s:'নো'  },   /* ou-kaar / na+o */
    { e:'c',   b:'ে',  s:'ৈ'   },   /* e-kaar / oi-kaar */
    { e:'v',   b:'ল',  s:'র'   },   /* la / ra */
    { e:'b',   b:'ণ',  s:'ন'   },   /* Na / na */
    { e:'n',   b:'স',  s:'ষ'   },   /* sa / Sha */
    { e:'m',   b:'শ',  s:'ম'   },   /* sha / ma */
    { e:',',   b:',',  s:'<'   },
    { e:'.',   b:'.',  s:'>'   },
    { e:'/',   b:'/',  s:'?'   },
    { e:'⇧',   b:'',   s:'',   w:'w110' },
  ],
  /* Row 4 — space bar */
  [
    { e:'Ctrl',  b:'', s:'', w:'w60' },
    { e:'Alt',   b:'', s:'', w:'w60' },
    { e:'Space', b:' ', s:' ', w:'w290' },
    { e:'Alt',   b:'', s:'', w:'w60' },
    { e:'Ctrl',  b:'', s:'', w:'w60' },
  ],
];

/* ================================================
   ENGLISH QWERTY LAYOUT  (unchanged)
================================================ */

const KB_EN_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['Caps','a','s','d','f','g','h','j','k','l',';',"'",'Enter'],
  ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
  ['Ctrl','Alt','Space','Alt','Ctrl'],
];

const KB_EN_WIDTHS = {
  'Backspace': 'w110', 'Tab': 'w70', 'Caps': 'w90',
  'Enter': 'w90', 'Shift': 'w110', 'Ctrl': 'w60',
  'Alt': 'w60', 'Space': 'w290',
};

/* ================================================
   BUILD VIRTUAL KEYBOARD
================================================ */

function buildKb() {
  const vkb = document.getElementById('vkb');
  if (!vkb) return;

  vkb.innerHTML = '';

  if (S.lang === 'bn') {
    buildUnijoyKb(vkb);
  } else {
    buildEnKb(vkb);
  }

  vkb.classList.toggle('hidden', !S.kbVisible);

  const badge = document.getElementById('kb-layout-badge');
  if (badge) {
    badge.textContent = S.lang === 'bn' ? 'Unijoy Layout' : 'QWERTY';
    badge.classList.toggle('bijoy', S.lang === 'bn');
  }
}

/* ================================================
   BUILD UNIJOY KEYBOARD
================================================ */

function buildUnijoyKb(vkb) {
  KB_BIJOY_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'krow';

    row.forEach(item => {
      const k = document.createElement('div');
      k.className = 'key' + (item.w ? ' ' + item.w : '');
      k.dataset.raw = item.e;

      const isModifier = ['Tab','Caps','Enter','⇧','⌫','Ctrl','Alt'].includes(item.e);

      if (isModifier) {
        k.classList.add('modifier');
        k.innerHTML = `<span class="key-en-lbl" style="color:var(--text-muted)">${item.e}</span>`;
        if (item.e === 'Caps') { k.id = 'key-caps'; k.classList.add('caps-key'); }

      } else if (item.e === 'Space') {
        k.classList.add('spacebar');
        k.dataset.raw = ' ';
        k.innerHTML = `<span class="key-en-lbl" style="color:var(--text-muted);font-size:.55rem">Space</span>`;

      } else {
        const hasBn = item.b && item.b.trim() !== '' && item.b !== '\u200C';
        const hasSh = item.s && item.s.trim() !== '' && item.s !== item.b;

        k.innerHTML = `
          ${hasSh ? `<span class="key-bn-shift">${item.s}</span>` : ''}
          ${hasBn ? `<span class="key-bn-lbl">${item.b}</span>` : ''}
          <span class="key-sub-lbl">${item.e}</span>
        `;

        /* Mark hasanta / ya-phala keys */
        if (item.e === 's' || item.e === 'z') {
          k.classList.add('bijoy-g');
        }
      }

      rowDiv.appendChild(k);
    });

    vkb.appendChild(rowDiv);
  });
}

/* ================================================
   BUILD ENGLISH KEYBOARD
================================================ */

function buildEnKb(vkb) {
  KB_EN_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'krow';

    row.forEach(key => {
      const k = document.createElement('div');
      k.className = 'key';
      const wc = KB_EN_WIDTHS[key];
      if (wc) k.classList.add(wc);
      const isModifier = Object.keys(KB_EN_WIDTHS).includes(key);
      if (isModifier) k.classList.add('modifier');
      const label = key === 'Space' ? 'Space' : key;
      k.innerHTML = `<span class="key-en-lbl">${label}</span>`;
      k.dataset.key = key === 'Space' ? ' ' : key.toLowerCase();
      if (key === 'Caps') { k.id = 'key-caps'; k.classList.add('caps-key'); }
      if (key === 'Enter') k.classList.add('enter-key');
      rowDiv.appendChild(k);
    });

    vkb.appendChild(rowDiv);
  });
}

/* ================================================
   TOGGLE KEYBOARD VISIBILITY
================================================ */

function toggleKb() {
  const chk = document.getElementById('kb-chk');
  S.kbVisible = chk ? chk.checked : !S.kbVisible;
  const vkb = document.getElementById('vkb');
  if (vkb) vkb.classList.toggle('hidden', !S.kbVisible);
  storageSetKbVisible(S.kbVisible);
}

/* ================================================
   HIGHLIGHT NEXT KEY
================================================ */

function hlNextKey() {
  clearKbHl();
  if (S.idx >= S.chars.length) return;
  const ch  = S.chars[S.idx].textContent;
  const el_ = findKeyByChar(ch);
  if (el_) el_.classList.add('hl-next');
}

/* ================================================
   FLASH KEY ON KEYPRESS
================================================ */

function flashKey(raw, ok) {
  const el_ = findKeyByRaw(raw);
  if (!el_) return;
  const cls = ok ? 'hl-ok' : 'hl-err';
  el_.classList.add(cls);
  setTimeout(() => el_.classList.remove(cls), 220);
}

/* ================================================
   FIND KEY BY CHAR  (reverse lookup)
================================================ */

function findKeyByChar(ch) {
  if (S.lang === 'bn') {
    for (const [rawKey, bnChar] of Object.entries(BIJOY)) {
      if (bnChar === ch) {
        const el_ = document.querySelector(`.key[data-raw="${CSS.escape(rawKey)}"]`);
        if (el_) return el_;
      }
    }
    return null;
  } else {
    const dk = ch === ' ' ? ' ' : ch.toLowerCase();
    return document.querySelector(`.key[data-key="${CSS.escape(dk)}"]`);
  }
}

/* ================================================
   FIND KEY BY RAW PHYSICAL KEY
================================================ */

function findKeyByRaw(raw) {
  if (S.lang === 'bn') {
    return document.querySelector(`.key[data-raw="${CSS.escape(raw)}"]`);
  } else {
    const dk = raw === ' ' ? ' ' : raw.toLowerCase();
    return document.querySelector(`.key[data-key="${CSS.escape(dk)}"]`);
  }
}

/* ================================================
   CLEAR ALL HIGHLIGHTS
================================================ */

function clearKbHl() {
  document.querySelectorAll('.key.hl-next, .key.hl-ok, .key.hl-err')
    .forEach(k => k.classList.remove('hl-next', 'hl-ok', 'hl-err'));
}

/* ================================================
   CAPS LOCK VISUAL
================================================ */

function updateCapsLockKey() {
  const capsKey = document.getElementById('key-caps');
  if (!capsKey) return;
  if (S.capsOn) {
    capsKey.style.borderColor = 'var(--warn)';
    capsKey.style.boxShadow   = '0 0 8px rgba(245,158,11,0.35)';
  } else {
    capsKey.style.borderColor = '';
    capsKey.style.boxShadow   = '';
  }
}

/* ================================================
   UNIJOY LEGEND  (reference chart below keyboard)
================================================ */

function toggleBijoyLegend() {
  const legend = document.getElementById('bijoy-legend');
  if (!legend) return;
  legend.classList.toggle('visible');
}

function buildBijoyLegend() {
  const legend = document.getElementById('bijoy-legend');
  if (!legend) return;

  const pairs = [
    /* Vowel signs (kaar) */
    { k:'a',   b:'া',  label:'আ-কার'  },
    { k:'d',   b:'ী',  label:'ঈ-কার'  },
    { k:'D',   b:'ি',  label:'ই-কার'  },
    { k:'x',   b:'ৌ',  label:'ঔ-কার'  },
    { k:'c',   b:'ে',  label:'এ-কার'  },
    { k:'C',   b:'ৈ',  label:'ঐ-কার'  },
    /* Consonants */
    { k:'j',   b:'ক',  label:'ক'      },
    { k:'J',   b:'খ',  label:'খ'      },
    { k:'o',   b:'গ',  label:'গ'      },
    { k:'O',   b:'ঘ',  label:'ঘ'      },
    { k:'q',   b:'ঙ',  label:'ঙ'      },
    { k:'y',   b:'চ',  label:'চ'      },
    { k:'Y',   b:'ছ',  label:'ছ'      },
    { k:'u',   b:'জ',  label:'জ'      },
    { k:'U',   b:'ঝ',  label:'ঝ'      },
    { k:'k',   b:'ত',  label:'ত'      },
    { k:'K',   b:'থ',  label:'থ'      },
    { k:'l',   b:'দ',  label:'দ'      },
    { k:'L',   b:'ধ',  label:'ধ'      },
    { k:'b',   b:'ণ',  label:'ণ'      },
    { k:'B',   b:'ন',  label:'ন'      },
    { k:'h',   b:'ব',  label:'ব'      },
    { k:'H',   b:'ভ',  label:'ভ'      },
    { k:'n',   b:'স',  label:'স'      },
    { k:'N',   b:'ষ',  label:'ষ'      },
    { k:'m',   b:'শ',  label:'শ'      },
    { k:'M',   b:'ম',  label:'ম'      },
    { k:'i',   b:'হ',  label:'হ'      },
    { k:'v',   b:'ল',  label:'ল'      },
    { k:'V',   b:'র',  label:'র'      },
    { k:'w',   b:'য',  label:'য'      },
    { k:'e',   b:'ড',  label:'ড'      },
    { k:'r',   b:'প',  label:'প'      },
    { k:'R',   b:'ফ',  label:'ফ'      },
    { k:'t',   b:'ট',  label:'ট'      },
    { k:'T',   b:'ঠ',  label:'ঠ'      },
    { k:'p',   b:'ড়', label:'ড়'     },
    /* Special */
    { k:'s/S', b:'্',  label:'হসন্ত'  },
    { k:'z',   b:'্য', label:'য-ফলা'  },
    { k:'f',   b:'অ',  label:'অ'      },
    { k:'A',   b:'আ',  label:'আ'      },
    { k:'I',   b:'এ',  label:'এ'      },
    { k:'g',   b:'।',  label:'।'      },
  ];

  legend.innerHTML = `
    <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:8px;
         font-weight:700;text-transform:uppercase;letter-spacing:.08em">
      Unijoy Key Reference &nbsp;·&nbsp;
      <span style="color:var(--accent)">Ctrl+Alt+V</span> = EN↔বাং switch
    </div>
    <div class="bijoy-legend-row">
      ${pairs.map(p => `
        <div class="bl-item">
          <span class="bl-key">${p.k}</span>
          <span class="bl-arrow">→</span>
          <span class="bl-bn">${p.b}</span>
          <span style="font-size:.62rem;color:var(--text-muted)">${p.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}
