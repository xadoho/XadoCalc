'use strict';
(function () {
  const F = window.Frac;
  const $ = s => document.querySelector(s);
  const html = document.documentElement;
  const TG_URL = 'https://t.me/xadohot';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {  } },
  };

  const DEF = { theme: 'auto', accent: 'indigo', paper: 'grid', font: 'm', anim: true, vibro: true, mulSign: '·', divSign: ':', notes: true, after: true, mixed: true, extra: true, viz: true, check: true, strict: false, autoNext: false };
  let S = Object.assign({}, DEF, store.get('xc_settings', {}));
  const ACCENTS = { indigo: ['#4F52F0', '#9EA2FF'], blue: ['#1F6FE0', '#7DB3FF'], violet: ['#7A3FE0', '#C3A2FF'], green: ['#12936A', '#55D6A3'], orange: ['#D9621A', '#FFAA6B'], pink: ['#D63A7A', '#FF8DB8'] };
  const sysDark = () => location.hash === '#dark' || (location.hash !== '#light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  function applyS() {
    const dark = S.theme === 'dark' || (S.theme === 'auto' && sysDark());
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    const ac = (ACCENTS[S.accent] || ACCENTS.indigo)[dark ? 1 : 0];
    html.style.setProperty('--accent', ac);
    html.style.setProperty('--accent-soft', rgba(ac, dark ? .16 : .11));
    html.style.setProperty('--key-op', rgba(ac, dark ? .14 : .10));
    html.style.setProperty('--key-press', rgba(ac, dark ? .28 : .22));
    html.style.setProperty('--accent-ink', dark ? '#10122A' : '#fff');
    html.setAttribute('data-paper', S.paper);
    html.setAttribute('data-font', S.font);
    html.setAttribute('data-anim', S.anim ? 'on' : 'off');
    const tb = $('#themeBtn'); if (tb) tb.innerHTML = TICON[S.theme];
  }
  function saveS() { store.set('xc_settings', S); applyS(); }

  const buzz = p => { if (!S.vibro) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) {  } };
  const sym = h => { if (S.mulSign === '×') h = h.replace(/·/g, '×'); if (S.divSign === '÷') h = h.replace(/ : /g, ' ÷ ').replace(/>:</g, '>÷<'); return h; };
  const eqJoin = l => l.join('<span class="eq">=</span>');
  const math = (h, cls = '') => `<div class="math ${cls}">${sym(h)}</div>`;
  function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  let toastT;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1800); }
  function copyText(t) {
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {  }
      ta.remove(); toast(ok ? 'Скопировано' : 'Не удалось скопировать');
    };
    try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(t).then(() => toast('Скопировано'), fallback); return; } } catch (e) {  }
    fallback();
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) { copyText(b.dataset.copy); buzz(8); } });

  const THEMES = ['auto', 'light', 'dark'];
  const TICON = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  };
  const TNAME = { auto: 'как в системе', light: 'светлая', dark: 'тёмная' };
  $('#themeBtn').addEventListener('click', () => { S.theme = THEMES[(THEMES.indexOf(S.theme) + 1) % 3]; saveS(); toast('Тема: ' + TNAME[S.theme]); buzz(6); if (setOpen) drawSettings(); });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyS); } catch (e) {  }
  applyS();

  const navStack = []; let ignorePop = 0;
  function navPush(kind) { navStack.push(kind); try { history.pushState({ k: kind, n: navStack.length }, ''); } catch (e) {  } }
  function navPopUI(kind) { if (navStack[navStack.length - 1] === kind) { navStack.pop(); ignorePop++; try { history.back(); } catch (e) { ignorePop--; } } }
  window.addEventListener('popstate', () => {
    if (ignorePop) { ignorePop--; return; }
    const k = navStack.pop();
    if (k === 'sheet') closeSheet(true);
    else if (k === 'settings') closeSettings(true);
    else if (k === 'tab') switchTab('solve', true);
  });

  const TABS = ['solve', 'train', 'tools'];
  const SUB = { solve: 'решение по шагам', train: 'тренажёр и варианты', tools: 'полезные инструменты' };
  let curTab = 'solve';
  function switchTab(t, fromBack) {
    if (t === curTab) return;
    const dir = TABS.indexOf(t) > TABS.indexOf(curTab) ? 1 : -1;
    document.querySelectorAll('.tab').forEach(s => s.style.setProperty('--dir', dir));
    $('#tab-' + curTab).style.setProperty('--dir', -dir);
    $('#tab-' + curTab).classList.remove('active');
    $('#tab-' + t).classList.add('active');
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#subtitle').textContent = SUB[t];
    if (!fromBack) {
      if (curTab === 'solve' && t !== 'solve') navPush('tab');
      else if (t === 'solve') navPopUI('tab');
    }
    curTab = t; buzz(5);
    if (t === 'train' && !cur) newTask();
  }
  $('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) switchTab(b.dataset.t); });

  const expr = $('#expr'), preview = $('#preview'), keypad = $('#keypad'), solEl = $('#solution');
  const BACK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>';
  const KEYS = [
    ['C', 'fn red', 'clear'], ['(', 'op', '('], [')', 'op', ')'], ['x<sup>n</sup>', 'op', '^'], [BACK_IC, 'fn', 'back'],
    ['7'], ['8'], ['9'], ['<span class="fr"><span class="fn">a</span><span class="fd">b</span></span>', 'op', '/'], [null, 'op', '÷'],
    ['4'], ['5'], ['6'], ['a<span class="fr"><span class="fn">b</span><span class="fd">c</span></span>', 'op', ' '], [null, 'op', '×'],
    ['1'], ['2'], ['3'], ['√', 'op', '√('], ['−', 'op', '−'],
    ['0'], [',', '', ','], ['<i>x</i>', 'op vk', 'x'], ['=', 'op', '='], ['+', 'op', '+'],
  ];
  function drawKeys() {
    $('#keys').innerHTML = KEYS.map(([l, c = '', v = l]) => {
      if (l === null) l = v === '÷' ? (S.divSign === '÷' ? '÷' : ':') : (S.mulSign === '×' ? '×' : '·');
      return `<button class="k ${c}" data-v="${v}"><span>${l}</span></button>`;
    }).join('') + '<button class="solve" id="solveBtn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>Решить</button>';
  }
  drawKeys();
  function setKH() { const h = keypad.offsetHeight; if (h) keypad.style.setProperty('--kh', h + 'px'); }
  setKH(); window.addEventListener('resize', setKH);
  function openKeypad() { keypad.classList.remove('closed'); $('#editFab').classList.add('off'); }
  function closeKeypad() { setKH(); keypad.classList.add('closed'); $('#editFab').classList.remove('off'); }
  $('#grab').addEventListener('click', () => (keypad.classList.contains('closed') ? openKeypad() : closeKeypad()));
  document.querySelectorAll('.kb').forEach(b => { b.addEventListener('pointerdown', e => e.preventDefault()); b.addEventListener('click', () => { buzz(5); keyAction(b.dataset.v); expr.focus({ preventScroll: true }); }); });
  expr.addEventListener('focus', openKeypad);
  expr.addEventListener('click', openKeypad);
  $('#editFab').addEventListener('click', () => { openKeypad(); $('#solveScroll').scrollTo({ top: 0, behavior: 'smooth' }); expr.focus(); });

  function insert(txt) {
    const s = expr.value, a = expr.selectionStart ?? s.length, b = expr.selectionEnd ?? s.length;
    expr.value = s.slice(0, a) + txt + s.slice(b);
    const p = a + txt.length; expr.setSelectionRange(p, p);
    onExpr();
  }
  function keyAction(v) {
    const s = expr.value; let a = expr.selectionStart ?? s.length; const b = expr.selectionEnd ?? s.length;
    switch (v) {
      case 'clear': expr.value = ''; onExpr(); break;
      case 'back':
        if (a !== b) { expr.value = s.slice(0, a) + s.slice(b); expr.setSelectionRange(a, a); }
        else if (a > 0) { const cut = s.slice(a - 2, a) === '√(' ? 2 : 1; expr.value = s.slice(0, a - cut) + s.slice(a); expr.setSelectionRange(a - cut, a - cut); }
        onExpr(); break;
      case 'left': a = Math.max(0, a - 1); expr.setSelectionRange(a, a); break;
      case 'right': a = Math.min(s.length, b + 1); expr.setSelectionRange(a, a); break;
      default: insert(v);
    }
  }
  const keysEl = $('#keys');
  keysEl.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });
  keysEl.addEventListener('click', e => {
    const k = e.target.closest('button'); if (!k) return;
    buzz(6);
    if (k.id === 'solveBtn') { doSolve(); return; }
    keyAction(k.dataset.v);
    expr.focus({ preventScroll: true });
  });
  let holdT;
  keysEl.addEventListener('pointerdown', e => { if (e.target.closest('[data-v="back"]')) holdT = setTimeout(() => { expr.value = ''; onExpr(); buzz(20); }, 600); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => keysEl.addEventListener(ev, () => clearTimeout(holdT)));
  expr.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSolve(); } });
  expr.addEventListener('input', () => onExpr());
  $('#clearX').addEventListener('click', () => { expr.value = ''; onExpr(); expr.focus(); });

  let raf = 0;
  function onExpr() {
    $('#clearX').classList.toggle('off', !expr.value);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const s = expr.value;
      if (!s.trim()) { preview.innerHTML = '<span class="ph">Здесь пример появится в «тетрадном» виде</span>'; return; }
      try { preview.innerHTML = math(F.R(F.parse(s))); }
      catch (e) { preview.innerHTML = `<span class="ph">${e instanceof F.MathErr ? e.message : 'Проверьте запись примера.'}</span>`; }
    });
  }

  function toText(h) {
    const box = document.createElement('div'); box.innerHTML = sym(h);
    [...box.querySelectorAll('.fr')].reverse().forEach(f => {
      const n = f.children[0].textContent.trim(), d = f.children[1].textContent.trim();
      const w = x => (/^[−-]?[\d ]+$/.test(x) ? x : `(${x})`);
      f.replaceWith(`${w(n)}/${w(d)}`);
    });
    box.querySelectorAll('.mw').forEach(m => m.replaceWith(m.textContent + ' '));
    box.querySelectorAll('sup').forEach(s => { const t = s.textContent.trim(); s.replaceWith('^' + (t.length > 1 ? `(${t})` : t)); });
    box.querySelectorAll('.sq').forEach(q => q.replaceWith('√(' + q.querySelector('.sqr').textContent + ')'));
    box.querySelectorAll('.eq').forEach(q => q.replaceWith(' = '));
    box.querySelectorAll('.op').forEach(q => q.replaceWith(' ' + q.textContent + ' '));
    return box.textContent.replace(/ /g, '').replace(/\s+/g, ' ').trim();
  }
  function solutionText(r) {
    const i = r.info;
    let t = `Пример: ${toText(r.inputH)}\n`;
    r.steps.forEach((s, k) => {
      t += `\n${k + 1}. ${s.title}\n` + s.lines.map(l => '   ' + toText(eqJoin(l))).join('\n') + '\n';
      if (S.notes && s.notes.length) t += s.notes.map(n => '   ' + toText(n)).join('\n') + '\n';
    });
    if (r.isEq && !i) t += `\nОтвет: ${r.kind === 'none' ? 'корней нет' : 'x — любое число'}`;
    else t += `\nОтвет: ${r.isEq ? 'x = ' : ''}${toText(i.frac)}${i.mixed && S.mixed ? ' = ' + toText(i.mixed) : ''}`;
    t += `\n\nРешено в XadoCalc · ${TG_URL}`;
    return t;
  }

  function pie(k, d) {
    if (d === 1) return `<svg viewBox="0 0 44 44" class="pie"><circle cx="22" cy="22" r="20" class="pf"/></svg>`;
    let paths = '';
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const f = v => v.toFixed(2);
      paths += `<path d="M22 22L${f(22 + 20 * Math.cos(a0))} ${f(22 + 20 * Math.sin(a0))}A20 20 0 0 1 ${f(22 + 20 * Math.cos(a1))} ${f(22 + 20 * Math.sin(a1))}Z" class="${i < k ? 'pf' : 'pe'}" style="--d:${i}"/>`;
    }
    return `<svg viewBox="0 0 44 44" class="pie">${paths}</svg>`;
  }
  function pieH(q) {
    if (!S.viz || q.n <= 0n || q.d === 1n || q.d > 24n) return '';
    const whole = Number(q.n / q.d), rem = Number(q.n % q.d), cnt = whole + (rem ? 1 : 0);
    if (cnt < 1 || cnt > 6) return '';
    let out = '';
    for (let i = 0; i < cnt; i++) out += pie(i < whole ? Number(q.d) : rem, Number(q.d));
    return `<div class="viz"><span class="vl">Наглядно</span><div class="pies">${out}</div></div>`;
  }
  let lastSol = null;
  const VX = '<i class="vx">x</i>';
  function solutionHTML(r, id) {
    const i = r.info;
    if (r.isEq && !i) {
      const msg = r.kind === 'none' ? 'Корней нет' : 'x — любое число';
      return `<div class="card answer"><div class="lab"><span>Ответ</span></div>${math(r.inputH)}<div class="eqres">${msg}</div></div>` + stepsHTML(r);
    }
    const form = (lab, h) => `<div class="form">${lab}${math(h)}</div>`;
    let forms = '';
        if (S.extra) {
      if (!i.isInt || i.mixed) forms += form(i.dec.finite ? 'Десятичная дробь' : (i.dec.exact ? 'Периодическая дробь' : 'Приближённо'), i.dec.s);
      if (!i.isInt) forms += form('В процентах', i.pct.s + ' %');
    }
    let res = i.frac; if (S.mixed && i.mixed) res += '<span class="eq">=</span>' + i.mixed;
    const head = r.isEq ? r.inputH : (r.inputH === i.frac ? i.frac : r.inputH + '<span class="eq">=</span>' + res);
    const ansText = (r.isEq ? 'x = ' : '') + (S.mixed && i.mixed ? i.textMixed : i.text);
    let h = `<div class="card answer"><div class="lab"><span>Ответ</span><span><button class="copy" data-copy="${ansText}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>Ответ</button><button class="copy" data-copysol="${id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>Решение</button></span></div>${math(head)}${r.isEq ? math(VX + '<span class="eq">=</span>' + res, 'xres') : ''}${forms ? `<div class="forms">${forms}</div>` : ''}${pieH(r.q)}</div>`;
    return h + stepsHTML(r);
  }
  function stepsHTML(r) {
    let h = '';
    const st = r.steps.filter(x => S.check || !x.check);
    if (!st.length) return h + '<p class="hint" style="color:var(--muted);margin:14px 4px">Дробь уже несократима — упрощать нечего.</p>';
    const n = st.length;
    h += `<div class="section-label">Решение · ${n} ${plural(n, 'шаг', 'шага', 'шагов')}</div><ol class="steps">`;
    st.forEach((s, k) => {
      h += `<li class="step${s.check ? ' chk' : ''}" style="--i:${Math.min(k, 12)}"><div class="n">${s.check ? '✓' : k + 1}</div><div class="card body"><h3>${s.title}</h3>` +
        s.lines.map(l => math(eqJoin(l))).join('') +
        (S.notes ? s.notes.map(t => `<p class="note">${sym(t)}</p>`).join('') : '') +
        (S.after && s.expr ? `<div class="after"><span class="tag">Получаем</span>${math(s.expr)}</div>` : '') + '</div></li>';
    });
    return h + '</ol>';
  }
  const solStore = {};
  document.addEventListener('click', e => { const b = e.target.closest('[data-copysol]'); if (b && solStore[b.dataset.copysol]) { copyText(solutionText(solStore[b.dataset.copysol])); buzz(8); } });
  function renderSol(r, id) { solStore[id] = r; return solutionHTML(r, id); }

  function doSolve() {
    const s = expr.value;
    if (!s.trim()) { const c = $('.input-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); buzz([20, 30, 20]); return; }
    try {
      const r = F.solve(s);
      lastSol = r;
      solEl.innerHTML = renderSol(r, 'main');
      $('#emptyState').classList.add('hidden');
      pushRecent(s);
      closeKeypad();
      requestAnimationFrame(() => $('#solveScroll').scrollTo({ top: Math.max(0, solEl.offsetTop - 12), behavior: 'smooth' }));
      buzz(12);
    } catch (e) {
      const msg = e instanceof F.MathErr ? e.message : 'Не получилось разобрать пример. Проверьте запись.';
      solEl.innerHTML = `<div class="card errcard"><b>Не получается решить.</b> ${msg}</div>`;
      buzz([20, 40, 20]);
    }
  }
  function rerenderSolution() { if (lastSol && solEl.querySelector('.answer')) solEl.innerHTML = renderSol(lastSol, 'main'); onExpr(); }

  const EXAMPLES = ['3/4 + 5/6', '2 1/3 × 3 3/7', '2/3(x − 1/4) = 5/6', '(2/3)^−2 − 1/4', '(1/2 + 1/3)^2 ÷ 5/6', '0,(3) + 1/6', '1/2x + 1/3 = 1/4x − 1/6', '√(9/16) − (8/27)^(1/3)'];
  function chipsHTML(list) { return list.map(s => { let h; try { h = F.R(F.parse(s)); } catch (e) { h = s; } return `<button class="chip" data-ex="${s.replace(/"/g, '&quot;')}"><div class="math" style="font-size:1rem;padding:0">${sym(h)}</div></button>`; }).join(''); }
  let recent = store.get('xc_recent', []);
  function drawChips() { $('#examples').innerHTML = chipsHTML(EXAMPLES); $('#recentWrap').classList.toggle('hidden', !recent.length); $('#recent').innerHTML = chipsHTML(recent); }
  function pushRecent(s) { recent = [s, ...recent.filter(x => x !== s)].slice(0, 12); store.set('xc_recent', recent); drawChips(); }
  drawChips();
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-ex]'); if (!c) return;
    expr.value = c.dataset.ex; onExpr(); buzz(6); doSolve();
  });

  const TOPICS = [['all', 'Все темы'], ['add', 'Сложение и вычитание'], ['mul', 'Умножение и деление'], ['mixed', 'Смешанные числа'], ['pow', 'Степени'], ['order', 'Порядок действий'], ['eq', 'Уравнения']];
  const LEVELS = [[1, 'Лёгкий · 5–6 кл.'], [2, 'Средний · 6–8 кл.'], [3, 'Сложный · 8–11 кл.']];
  let topic = store.get('xc_topic', 'all'), level = store.get('xc_level', 1), mode = 'practice', count = store.get('xc_count', 10);
  let seriesStart = Date.now(), cur = null, sign = 1, stats = store.get('xc_stats', { ok: 0, all: 0, best: 0 }), streak = 0, series = [];
  function seg(el, items, val, on) {
    el.innerHTML = items.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('');
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); buzz(5); on(b.dataset.v); };
  }
  seg($('#topicSeg'), TOPICS, topic, v => { topic = v; store.set('xc_topic', v); refreshTrain(); });
  seg($('#levelSeg'), LEVELS, level, v => { level = +v; store.set('xc_level', level); refreshTrain(); });
  seg($('#countSeg'), [[5, '5'], [10, '10'], [15, '15'], [20, '20']], count, v => { count = +v; store.set('xc_count', count); genVariant(); });
  function refreshTrain() { if (mode === 'practice') { series = []; newTask(); } else genVariant(); }
  $('#trainMode').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m; buzz(5);
    $('#trainMode').classList.toggle('right', mode === 'variant');
    $('#trainMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    $('#practice').classList.toggle('hidden', mode !== 'practice');
    $('#variant').classList.toggle('hidden', mode !== 'variant');
    if (mode === 'variant' && !variants.length) genVariant();
  });
  const aW = $('#aW'), aN = $('#aN'), aD = $('#aD'), fb = $('#fb');
  function setSign(s) { sign = s; $('#signBtn').textContent = s > 0 ? '+' : '−'; $('#signBtn').classList.toggle('neg', s < 0); }
  $('#signBtn').addEventListener('click', () => { setSign(-sign); buzz(5); });
  function drawScore() {
    $('#scOk').textContent = stats.ok; $('#scAll').textContent = stats.all; $('#streak').textContent = 'серия ' + streak;
    $('#sbar').innerHTML = Array.from({ length: 10 }, (_, i) => `<i class="${i < series.length ? (series[i] ? 'ok' : 'bad') : (i === series.length ? 'cur' : '')}"></i>`).join('');
    $('#sLabel').textContent = `${series.length} / 10`;
  }
  function newTask() {
    if (series.length >= 10) series = [];
    cur = F.genTask(topic, level); cur.checked = false; cur.solved = false;
    const t = $('#task'); t.classList.remove('swap'); void t.offsetWidth; t.innerHTML = sym(cur.r.inputH); t.classList.add('swap');
    $('#ansbox .eqs').innerHTML = cur.r.isEq ? '<i>x</i> =' : '=';
    aW.value = aN.value = aD.value = ''; setSign(1); fb.className = 'fb';
    drawScore();
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function feedback(cls, h) { fb.className = 'fb ' + cls; void fb.offsetWidth; fb.classList.add('show'); fb.innerHTML = h; }
  const PRAISE = ['Верно! Отлично.', 'Правильно!', 'Верно, так держать!', 'Точно в цель!', 'Молодец, верно!'];
  function record(ok) {
    if (cur.checked) return; cur.checked = true;
    if (!series.length) seriesStart = Date.now();
    stats.all++; if (ok) stats.ok++;
    series.push(ok); store.set('xc_stats', stats);
    if (series.length === 10) { const res = series.slice(), ms = Date.now() - seriesStart; setTimeout(() => showGrade(res, ms), 900); }
  }
  function showGrade(res, ms) {
    const sec = Math.round(ms / 1000), tm = sec >= 60 ? `${Math.floor(sec / 60)} мин ${sec % 60} с` : `${sec} с`;
    const ok = res.filter(Boolean).length, g = ok >= 9 ? 5 : ok >= 7 ? 4 : ok >= 5 ? 3 : 2;
    const col = { 5: 'var(--green)', 4: 'var(--accent)', 3: 'var(--amber)', 2: 'var(--red)' }[g];
    openSheet(`<div class="grade"><div class="g" style="color:${col}">${g}</div><p>Верно ${ok} из 10 · время ${tm}</p><button class="btn pri" id="againBtn" style="width:100%">Новая серия</button></div>`, 'Итог серии');
    $('#againBtn').onclick = () => { closeSheet(); series = []; newTask(); };
  }
  function check() {
    if (!cur) return;
    const w = aW.value.trim(), n = aN.value.trim(), d = aD.value.trim();
    const num = /^\d+$/;
    if ((!w && !n && !d) || (w && !num.test(w)) || (n && !num.test(n)) || (d && !num.test(d)) || (!!n !== !!d)) { shake($('#ansbox')); buzz([20, 30, 20]); if (!!n !== !!d) feedback('mid', 'Заполните и числитель, и знаменатель (или только целую часть).'); return; }
    if (d && BigInt(d) === 0n) { feedback('bad', 'Знаменатель не может быть равен нулю.'); shake($('#ansbox')); return; }
    const W = w ? BigInt(w) : 0n, N = n ? BigInt(n) : 0n, D = d ? BigInt(d) : 1n;
    const q = F.red(F.Q(BigInt(sign) * (W * D + N), D)), exp = cur.r.q;
    if (q.n === exp.n && q.d === exp.d) {
      const reducible = n && F.gcd(N, D) > 1n;
      const improper = n && N >= D;
      if (S.strict && (reducible || improper)) {
        record(false); streak = 0;
        feedback('mid', `<div class="math" style="font-size:1rem;padding:0;white-space:normal">Значение верное, но ответ нужно записать до конца: ${sym(F.qH(exp, { mixed: true }))}</div>`);
        shake($('#ansbox')); buzz([20, 30, 20]); drawScore(); return;
      }
      record(true);
      if (!cur.solved) { streak++; cur.solved = true; stats.best = Math.max(stats.best || 0, streak); store.set('xc_stats', stats); }
      let msg = reducible ? `Верно, но дробь можно сократить: ${F.qH(exp, { mixed: !!w })}` : PRAISE[Math.floor(Math.random() * PRAISE.length)];
      if (!reducible && improper && !w) msg += ` Можно выделить целую часть: ${F.qH(exp, { mixed: true })}`;
      feedback(reducible ? 'mid' : 'ok', `<div class="math" style="font-size:1rem;padding:0;white-space:normal">${sym(msg)}</div>`);
      buzz(15);
      const st = $('#streak'); st.classList.remove('bump'); void st.offsetWidth; st.classList.add('bump');
      if (S.autoNext && series.length < 10) setTimeout(() => { if (cur && cur.solved) newTask(); }, 1100);
    } else {
      record(false); streak = 0;
      feedback('bad', 'Пока неверно. Попробуйте ещё раз или откройте решение.');
      shake($('#ansbox')); buzz([25, 40, 25]);
    }
    drawScore();
  }
  $('#checkBtn').addEventListener('click', check);
  $('#nextBtn').addEventListener('click', () => { newTask(); buzz(6); });
  [aW, aN, aD].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }));
  $('#solBtn').addEventListener('click', () => { if (!cur) return; if (!cur.checked) { record(false); streak = 0; drawScore(); } openSheet(renderSol(cur.r, 'train')); });

  let variants = [], showAns = true, nVar = store.get('xc_nvar', 1);
  const ansOf = g => (g.r.isEq ? '<i class="vx">x</i> = ' : '') + (g.r.info.mixed || g.r.info.frac);
  const liOf = (g, v, i, anim) => `<li style="--i:${anim ? i : 0}" data-v="${v}" data-i="${i}">${math(g.r.inputH + (g.r.isEq ? '' : '<span class="eq">=</span>'))}<span class="ans math">${sym(ansOf(g))}</span></li>`;
  function drawVariants(anim) {
    $('#varList').innerHTML = variants.map((list, v) => (variants.length > 1 ? `<div class="vhead">Вариант ${v + 1}</div>` : '') + `<ol class="var-list">${list.map((g, i) => liOf(g, v, i, anim)).join('')}</ol>`).join('');
    $('#varList').classList.toggle('noans', !showAns);
  }
  function genVariant() {
    const seen = new Set(); variants = [];
    for (let v = 0; v < nVar; v++) {
      const list = [];
      for (let t = 0; list.length < count && t < count * 8; t++) { const g = F.genTask(topic, level); if (!seen.has(g.s)) { seen.add(g.s); list.push(g); } }
      variants.push(list);
    }
    drawVariants(true);
  }
  seg($('#nvarSeg'), [[1, 'Один вариант'], [2, 'Два варианта']], nVar, v => { nVar = +v; store.set('xc_nvar', nVar); genVariant(); });
  $('#ansToggle').addEventListener('click', () => { showAns = !showAns; $('#ansToggle').classList.toggle('on', showAns); $('#varList').classList.toggle('noans', !showAns); buzz(5); });
  $('#genVar').addEventListener('click', () => { genVariant(); buzz(8); });
  $('#varList').addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return; const g = variants[+li.dataset.v][+li.dataset.i]; openSheet(renderSol(g.r, 'var' + li.dataset.v + '_' + li.dataset.i)); });
  $('#copyVar').addEventListener('click', () => {
    const tn = TOPICS.find(t => t[0] === topic)[1], ln = LEVELS.find(l => l[0] === level)[1];
    const p = x => { let s = F.plain(x); if (S.mulSign === '×') s = s.replace(/·/g, '×'); if (S.divSign === '÷') s = s.replace(/:/g, '÷'); return s; };
    let t = `Дроби — ${tn.toLowerCase()} (${ln})\n`;
    variants.forEach((list, v) => {
      t += (variants.length > 1 ? `\nВариант ${v + 1}\n` : '\n') + list.map((g, i) => `${i + 1}) ${p(g.s)}${g.r.isEq ? '' : ' ='}`).join('\n') + '\n';
    });
    variants.forEach((list, v) => {
      t += `\nОтветы${variants.length > 1 ? ' (вариант ' + (v + 1) + ')' : ''}:\n` + list.map((g, i) => `${i + 1}) ${g.r.isEq ? 'x = ' : ''}${g.r.info.mixed ? g.r.info.textMixed : g.r.info.text}`).join('\n') + '\n';
    });
    t += `\n\nСоставлено в XadoCalc · ${TG_URL}`;
    copyText(t);
  });

  let sheetOpen = false, setOpen = false;
  function openSheet(h, title) {
    $('#sheet .sh-head span').textContent = title || 'Решение';
    $('#sheetBody').innerHTML = h; $('#sheetBody').scrollTop = 0;
    $('#scrim').classList.add('on'); $('#sheet').classList.add('on');
    if (!sheetOpen) { sheetOpen = true; navPush('sheet'); }
  }
  function closeSheet(fromBack) {
    if (!sheetOpen) return; sheetOpen = false;
    if (!fromBack) navPopUI('sheet');
    $('#sheet').classList.remove('on'); if (!setOpen) $('#scrim').classList.remove('on');
  }
  $('#sheetClose').addEventListener('click', () => closeSheet());
  $('#scrim').addEventListener('click', () => { if (sheetOpen) closeSheet(); else if (setOpen) closeSettings(); });
  [['#sheet', '#sheetBody', () => closeSheet()], ['#settings', '#setBody', () => closeSettings()]].forEach(([sh, body, close]) => {
    let sy = null;
    $(sh).addEventListener('touchstart', e => { sy = $(body).scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    $(sh).addEventListener('touchmove', e => { if (sy !== null && e.touches[0].clientY - sy > 90) { sy = null; close(); } }, { passive: true });
  });

  const LOGO = document.querySelector('.top .mark').outerHTML;
  const TG_IC = document.querySelector('.tg-ic').innerHTML;
  const SET = [
    { sec: 'Оформление' },
    { k: 'theme', t: 'Тема', type: 'seg', opts: [['auto', 'Системная'], ['light', 'Светлая'], ['dark', 'Тёмная']] },
    { k: 'accent', t: 'Цвет акцента', type: 'color' },
    { k: 'paper', t: 'Фон страницы', type: 'seg', opts: [['grid', 'Клетка'], ['lines', 'Линейка'], ['plain', 'Чистый']] },
    { k: 'font', t: 'Размер текста', type: 'seg', opts: [['s', 'Мелкий'], ['m', 'Обычный'], ['l', 'Крупный'], ['xl', 'Огромный']] },
    { k: 'anim', t: 'Анимации', d: 'Плавные переходы и появление шагов', type: 'sw' },
    { k: 'vibro', t: 'Вибрация', d: 'Отклик при нажатии на кнопки', type: 'sw' },
    { sec: 'Запись' },
    { k: 'mulSign', t: 'Знак умножения', type: 'seg', opts: [['·', 'a · b'], ['×', 'a × b']] },
    { k: 'divSign', t: 'Знак деления', type: 'seg', opts: [[':', 'a : b'], ['÷', 'a ÷ b']] },
    { sec: 'Решение' },
    { k: 'notes', t: 'Пояснения к шагам', d: 'НОК, доп. множители, правила', type: 'sw' },
    { k: 'after', t: 'Выражение после каждого шага', type: 'sw' },
    { k: 'mixed', t: 'Выделять целую часть в ответе', type: 'sw' },
    { k: 'extra', t: 'Десятичная запись и проценты', type: 'sw' },
    { k: 'viz', t: 'Наглядные круги-доли', d: 'Показывать ответ в виде закрашенных долей', type: 'sw' },
    { k: 'check', t: 'Проверка корня уравнения', type: 'sw' },
    { sec: 'Тренажёр' },
    { k: 'strict', t: 'Строгая проверка', d: 'Засчитывать только несократимую дробь с выделенной целой частью', type: 'sw' },
    { k: 'autoNext', t: 'Автопереход после верного ответа', type: 'sw' },
    { sec: 'Данные' },
    { act: 'hist', t: 'Очистить историю примеров' },
    { act: 'stats', t: 'Сбросить статистику тренажёра' },
    { act: 'reset', t: 'Сбросить все настройки' },
  ];
  function drawSettings() {
    let h = '', open = false;
    const close = () => { if (open) { h += '</div>'; open = false; } };
    SET.forEach(it => {
      if (it.sec) { close(); h += `<div class="set-sec">${it.sec}</div><div class="set-card">`; open = true; return; }
      if (it.act) { h += `<button class="set-row danger" data-act="${it.act}">${it.t}</button>`; return; }
      const lbl = `<span class="lbl">${it.t}${it.d ? `<span class="desc">${it.d}</span>` : ''}</span>`;
      if (it.type === 'sw') h += `<button class="set-row" data-sw="${it.k}">${lbl}<span class="toggle ${S[it.k] ? 'on' : ''}"><span class="sw"></span></span></button>`;
      else if (it.type === 'seg') h += `<div class="set-row col">${lbl}<div class="seg sm" data-seg="${it.k}">${it.opts.map(([v, l]) => `<button data-v="${v}" class="${S[it.k] === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
      else if (it.type === 'color') h += `<div class="set-row col">${lbl}<div class="swatches">${Object.entries(ACCENTS).map(([k, c]) => `<button class="swatch ${S.accent === k ? 'on' : ''}" data-acc="${k}" style="background:${c[0]}" aria-label="${k}"></button>`).join('')}</div></div>`;
    });
    close();
    h += `<div class="set-sec">О приложении</div><div class="set-card about">${LOGO}<h2>XadoCalc</h2><p>Версия 1.0 · решатель дробей для школы<br>Дроби, степени, корни, уравнения и порядок действий с подробным решением по шагам.</p><p>Открытый исходный код (лицензия MIT).</p><a class="tg-btn" href="${TG_URL}">${TG_IC}Telegram-канал @xadohot</a></div><div style="height:24px"></div>`;
    $('#setBody').innerHTML = h;
  }
  $('#setBody').addEventListener('click', e => {
    const sw = e.target.closest('[data-sw]'), sg = e.target.closest('[data-seg] button'), ac = e.target.closest('[data-acc]'), act = e.target.closest('[data-act]');
    if (sw) { const k = sw.dataset.sw; S[k] = !S[k]; sw.querySelector('.toggle').classList.toggle('on', S[k]); }
    else if (sg) { const k = sg.parentNode.dataset.seg; S[k] = sg.dataset.v; sg.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sg)); }
    else if (ac) { S.accent = ac.dataset.acc; document.querySelectorAll('[data-acc]').forEach(b => b.classList.toggle('on', b === ac)); }
    else if (act) {
      const a = act.dataset.act;
      if (a === 'hist') { recent = []; store.set('xc_recent', recent); drawChips(); toast('История очищена'); }
      if (a === 'stats') { stats = { ok: 0, all: 0, best: 0 }; series = []; streak = 0; store.set('xc_stats', stats); drawScore(); toast('Статистика сброшена'); }
      if (a === 'reset') { S = Object.assign({}, DEF); saveS(); drawSettings(); afterSettings(); toast('Настройки сброшены'); }
      buzz(10); return;
    } else return;
    buzz(5); saveS(); afterSettings();
  });
  function afterSettings() { drawKeys(); drawChips(); rerenderSolution(); if (cur) $('#task').innerHTML = sym(cur.r.inputH); if (variants.length) drawVariants(false); runTools(); setKH(); }
  function openSettings() { drawSettings(); setOpen = true; navPush('settings'); $('#scrim').classList.add('on'); $('#settings').classList.add('on'); $('#setBody').scrollTop = 0; buzz(6); }
  function closeSettings(fromBack) { if (!setOpen) return; setOpen = false; if (!fromBack) navPopUI('settings'); $('#settings').classList.remove('on'); if (!sheetOpen) $('#scrim').classList.remove('on'); }
  $('#setBtn').addEventListener('click', openSettings);
  $('#setClose').addEventListener('click', () => closeSettings());

  const tools = [];
  const qOf = x => F.valueOf(x);
  function live(ids, fn) { let r = 0; const run = () => { r = 0; try { fn(); } catch (e) {  } }; tools.push(run); ids.forEach(id => $(id).addEventListener('input', () => { if (!r) r = requestAnimationFrame(run); })); run(); }
  function runTools() { tools.forEach(f => f()); }
  const errOut = e => `<span class="muted">${e instanceof F.MathErr ? e.message : 'Проверьте ввод.'}</span>`;
  live(['#rN', '#rD'], () => {
    const out = $('#rOut'), n = $('#rN').value.trim(), d = $('#rD').value.trim();
    if (!/^\d+$/.test(n) || !/^\d+$/.test(d)) { out.innerHTML = '<span class="muted">Введите натуральные числитель и знаменатель.</span>'; return; }
    const N = BigInt(n), D = BigInt(d);
    if (D === 0n) { out.innerHTML = '<span class="muted">Знаменатель не может быть равен нулю.</span>'; return; }
    if (N === 0n) { out.innerHTML = math(`${F.fracH(n, d)}<span class="eq">=</span>0`); return; }
    const eu = F.euclid(N, D), g = eu.g, r = F.red({ n: N, d: D });
    let h = '<div class="muted">Алгоритм Евклида:</div>' + eu.lines.map(l => `<div class="muted" style="font-family:var(--serif)">${sym(l)}</div>`).join('');
    h += `<div style="margin-top:6px">НОД(${F.fmtInt(N)}; ${F.fmtInt(D)}) = <b>${F.fmtInt(g)}</b></div>`;
    h += g > 1n ? math(eqJoin([F.fracH(F.fmtInt(N), F.fmtInt(D)), F.fracH(`${F.fmtInt(N)} : ${F.fmtInt(g)}`, `${F.fmtInt(D)} : ${F.fmtInt(g)}`), F.qH(r)].concat(r.n > r.d && r.d !== 1n ? [F.qH(r, { mixed: true })] : [])))
      : '<div class="muted">Дробь несократима: НОД равен 1.</div>';
    out.innerHTML = h;
  });
  live(['#cA', '#cB'], () => {
    const out = $('#cOut'), sEl = $('#cSign');
    try {
      const c = F.compare($('#cA').value, $('#cB').value);
      if (sEl.textContent !== c.sign) { sEl.textContent = c.sign; if (S.anim && sEl.animate) sEl.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      out.innerHTML = c.lines.map(l => math(l)).join('');
    } catch (e) { sEl.textContent = '?'; out.innerHTML = errOut(e); }
  });
  live(['#gIn'], () => {
    const out = $('#gOut');
    const nums = $('#gIn').value.split(/[\s,;]+/).filter(Boolean);
    if (nums.some(x => !/^\d+$/.test(x))) { out.innerHTML = '<span class="muted">Введите натуральные числа через запятую.</span>'; return; }
    try { const r = F.gcdLcm(nums); out.innerHTML = r.lines.map(l => math(l)).join('') + `<div style="margin-top:6px">${math(r.gH)}${math(r.lH)}</div>`; }
    catch (e) { out.innerHTML = errOut(e); }
  });
  live(['#dIn'], () => {
    const out = $('#dOut');
    try {
      const r = F.solve($('#dIn').value), i = r.info;
      let h = '';
      r.steps.slice(0, 3).forEach(s => { h += s.lines.map(l => math(eqJoin(l))).join(''); });
      h += `<div class="forms" style="margin-top:6px"><div class="form">Обыкновенная${math(i.frac)}</div>${i.mixed ? `<div class="form">Смешанное${math(i.mixed)}</div>` : ''}<div class="form">${i.dec.finite ? 'Десятичная' : 'Периодическая'}${math(i.dec.s)}</div><div class="form">Проценты${math(i.pct.s + ' %')}</div></div>`;
      out.innerHTML = h;
    } catch (e) { out.innerHTML = errOut(e); }
  });
  live(['#pA', '#pB', '#pC', '#pD'], () => {
    const out = $('#pOut'), ids = ['#pA', '#pB', '#pC', '#pD'];
    const v = ids.map(id => $(id).value.trim());
    const empty = v.map((x, i) => (x === '' || x === 'x' || x === 'х') ? i : -1).filter(i => i >= 0);
    if (empty.length !== 1) { out.innerHTML = '<span class="muted">Заполните три поля, а неизвестное оставьте пустым (или впишите x).</span>'; return; }
    try {
      const q = v.map(x => (x === '' || x === 'x' || x === 'х') ? null : F.valueOf(x));
      const k = empty[0];
      const mul = (a, b) => F.red(F.Q(a.n * b.n, a.d * b.d)), div = (a, b) => F.red(F.Q(a.n * b.d, a.d * b.n));
      let r, rule;
      if (k === 0) { r = div(mul(q[1], q[2]), q[3]); rule = 'x = b · c : d'; }
      if (k === 1) { r = div(mul(q[0], q[3]), q[2]); rule = 'x = a · d : c'; }
      if (k === 2) { r = div(mul(q[0], q[3]), q[1]); rule = 'x = a · d : b'; }
      if (k === 3) { r = div(mul(q[1], q[2]), q[0]); rule = 'x = b · c : a'; }
      const names = ['a', 'b', 'c', 'd'];
      out.innerHTML = `<div class="muted">${sym('Основное свойство пропорции: a · d = b · c, отсюда ' + rule.replace('x', names[k]))}</div>` + math(`${names[k]}<span class="eq">=</span>${F.qH(r)}${r.d !== 1n && (r.n < 0n ? -r.n : r.n) > r.d ? '<span class="eq">=</span>' + F.qH(r, { mixed: true }) : ''}`);
    } catch (e) { out.innerHTML = errOut(e); }
  });

  live(['#fA', '#fB'], () => {
    const out = $('#fOut');
    try {
      const a = qOf($('#fA').value), b = qOf($('#fB').value);
      const m = F.opBin('×', b, a), d = F.opBin('÷', b, a);
      out.innerHTML = '<div class="muted">Дробь от числа: умножаем число на дробь.</div>' + math(eqJoin(m.chain)) +
        `<div class="muted" style="margin-top:8px">Число по его дроби: делим на дробь.</div>` + math(eqJoin(d.chain));
    } catch (e) { out.innerHTML = errOut(e); }
  });
  live(['#oIn'], () => {
    const out = $('#oOut');
    try {
      const items = $('#oIn').value.split(/[;\n]+/).map(x => x.trim()).filter(Boolean);
      if (items.length < 2) { out.innerHTML = '<span class="muted">Введите хотя бы две дроби через точку с запятой.</span>'; return; }
      const qs = items.map(qOf);
      const L = qs.reduce((l, q) => F.lcm(l, q.d), 1n);
      let h = `<div class="muted">Общий знаменатель: ${F.fmtInt(L)}</div>` + math(qs.map(q => `${F.qH(q)}<span class="eq">=</span>${F.qH(F.Q(q.n * (L / q.d), L))}`).join('<span class="op">;</span>'));
      const idx = qs.map((q, i) => i).sort((i, j) => { const a = qs[i].n * qs[j].d, b = qs[j].n * qs[i].d; return a < b ? -1 : a > b ? 1 : 0; });
      const chain = order => order.map((k, n) => (n ? `<span class="op">${(qs[order[n - 1]].n * qs[k].d === qs[k].n * qs[order[n - 1]].d) ? '=' : (order === idx ? '&lt;' : '&gt;')}</span>` : '') + F.qH(qs[k])).join('');
      h += '<div class="muted" style="margin-top:6px">По возрастанию:</div>' + math(chain(idx));
      const rev = idx.slice().reverse();
      h += '<div class="muted">По убыванию:</div>' + math(chain(rev).replace(/&lt;/g, '&gt;'));
      out.innerHTML = h;
    } catch (e) { out.innerHTML = errOut(e); }
  });

  ['main', '.tab'].forEach(sel => document.querySelectorAll(sel).forEach(el => el.addEventListener('scroll', () => { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } })));
  drawScore();
  onExpr();
  requestAnimationFrame(setKH);
  setTimeout(() => { const sp = $('#splash'); if (sp) { sp.classList.add('hide'); setTimeout(() => sp.remove(), 600); } }, S.anim ? 750 : 50);
})();
