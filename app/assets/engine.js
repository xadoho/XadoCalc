'use strict';
(function (G) {
  class MathErr extends Error {}
  const abs = x => (x < 0n ? -x : x);
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { if (!a || !b) return 0n; return abs(a / gcd(a, b) * b); }
  const LIM = 400;
  function big(x) { if (abs(x).toString().length > LIM) throw new MathErr('Получаются слишком большие числа. Попробуйте пример попроще.'); return x; }
  function Q(n, d = 1n) { if (d === 0n) throw new MathErr('На ноль делить нельзя.'); if (d < 0n) { n = -n; d = -d; } return { n: big(n), d: big(d) }; }
  function red(q) { const g = gcd(q.n, q.d); return g > 1n ? { n: q.n / g, d: q.d / g } : q; }
  const qNum = q => Number(q.n) / Number(q.d);
  function approx(v) { if (!isFinite(v)) return '…'; return (Math.round(v * 1e4) / 1e4).toString().replace('.', ',').replace('-', '−'); }

  function fmtInt(n) { n = BigInt(n); const neg = n < 0n; let s = abs(n).toString(); if (s.length > 4) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (neg ? '−' : '') + s; }
  const pInt = n => (n < 0n ? `(${fmtInt(n)})` : fmtInt(n));
  const fracH = (a, b) => `<span class="fr"><span class="fn">${a}</span><span class="fd">${b}</span></span>`;
  const parH = (h, tall) => `<span class="pr${tall ? ' tl' : ''}">(</span>${h}<span class="pr${tall ? ' tl' : ''}">)</span>`;
  const supH = (b, e) => `${b}<sup>${e}</sup>`;
  const sqrtH = h => `<span class="sq"><span class="sqs">√</span><span class="sqr">${h}</span></span>`;
  const rootH = (h, k) => k === 2n ? sqrtH(h) : `<sup class="ri">${fmtInt(k)}</sup>${sqrtH(h)}`;
  function qH(q, o = {}) {
    const neg = q.n < 0n, a = abs(q.n);
    let h;
    if (q.d === 1n) h = fmtInt(q.n);
    else if (o.mixed && a > q.d) h = (neg ? '−' : '') + `<span class="mw">${fmtInt(a / q.d)}</span>` + fracH(fmtInt(a % q.d), fmtInt(q.d));
    else h = (neg ? '−' : '') + fracH(fmtInt(a), fmtInt(q.d));
    if ((o.paren && neg) || (o.pbase && (neg || q.d !== 1n))) h = parH(h, q.d !== 1n);
    return h;
  }
  const powH = (q, k) => supH(qH(q, { pbase: true }), fmtInt(k));
  function qText(q, mixed) {
    const neg = q.n < 0n, a = abs(q.n), s = neg ? '−' : '';
    if (q.d === 1n) return s + a;
    if (mixed && a > q.d) return `${s}${a / q.d} ${a % q.d}/${q.d}`;
    return `${s}${a}/${q.d}`;
  }
  function tokenize(s) {
    s = s.replace(/[*·∙]/g, '×').replace(/[xхXХ]/g, 'x').replace(/:/g, '÷').replace(/[-–—]/g, '−').replace(/\./g, ',');
    const T = []; let i = 0, depth = 0;
    while (i < s.length) {
      const c = s[i];
      if ((c >= '0' && c <= '9') || (c === ',' && /\d|\(/.test(s[i + 1] || ''))) {
        let j = i; while (j < s.length && /\d/.test(s[j])) j++;
        const tok = { k: 'num', int: s.slice(i, j) || '0' };
        if (s[j] === ',') {
          let k = j + 1; while (k < s.length && /\d/.test(s[k])) k++;
          tok.fr = s.slice(j + 1, k);
          const m = /^\((\d+)\)/.exec(s.slice(k));
          if (m) { tok.per = m[1]; k += m[0].length; }
          if (!tok.fr && !tok.per) delete tok.fr;
          j = k;
        }
        T.push(tok); i = j; continue;
      }
      if (c === ' ' || c === ' ') {
        let j = i; while (s[j] === ' ' || s[j] === ' ') j++;
        const prev = T[T.length - 1];
        if (prev && prev.k === 'num' && prev.fr === undefined && /\d/.test(s[j] || '')) T.push({ k: 'sp' });
        i = j; continue;
      }
      if (c === '²' || c === '³') { T.push({ k: 'op', v: '^' }, { k: 'num', int: c === '²' ? '2' : '3' }); i++; continue; }
      if (c === 'x') { T.push({ k: 'var' }); i++; continue; }
      if ('+−×÷/^()√='.includes(c)) { if (c === '(') depth++; if (c === ')') depth--; T.push({ k: 'op', v: c }); i++; continue; }
      throw new MathErr(`Непонятный символ «${c}».`);
    }
    while (depth-- > 0) T.push({ k: 'op', v: ')' });
    return T;
  }

  function numLit(k) {
    if (k.fr === undefined) return { t: 'val', kind: 'int', q: Q(BigInt(k.int)) };
    const fr = k.fr || '', per = k.per;
    const src = fmtInt(BigInt(k.int)) + ',' + fr + (per ? `(${per})` : '');
    if (!per) { const d = 10n ** BigInt(fr.length), n = BigInt(k.int + fr); return { t: 'val', kind: 'dec', q: Q(n, d), src, fn: n, fd: d }; }
    const A = BigInt(k.int + fr + per), B = BigInt(k.int + fr);
    const d = (10n ** BigInt(per.length) - 1n) * 10n ** BigInt(fr.length);
    return { t: 'val', kind: 'dec', q: Q(A - B, d), src, fn: A - B, fd: d, per: { A, B } };
  }
  function parse(str) {
    if (!str || !str.trim()) throw new MathErr('Введите пример.');
    const T = tokenize(str); let p = 0;
    const isOp = v => T[p] && T[p].k === 'op' && T[p].v === v;
    const startsAtom = () => { const k = T[p]; return k && (k.k === 'num' || k.k === 'var' || (k.k === 'op' && (k.v === '(' || k.v === '√'))); };
    function expr() { let a = term(); while (isOp('+') || isOp('−')) { const op = T[p++].v; a = { t: 'bin', op, a, b: term() }; } return a; }
    function term() {
      let a = unary();
      for (;;) {
        if (isOp('×') || isOp('÷')) { const op = T[p++].v; a = { t: 'bin', op, a, b: unary() }; }
        else if (startsAtom()) a = { t: 'bin', op: '×', a, b: unary(), implicit: true };
        else break;
      }
      return a;
    }
    function unary() { if (isOp('−')) { p++; return { t: 'neg', a: unary() }; } if (isOp('+')) { p++; return unary(); } return frac(); }
    function frac() {
      let a = power();
      while (isOp('/')) {
        p++; let b;
        if (isOp('−')) { p++; b = { t: 'neg', a: power() }; } else b = power();
        if (a.t === 'val' && a.kind === 'int' && b.t === 'val' && b.kind === 'int') {
          if (b.q.n === 0n) throw new MathErr('Знаменатель дроби не может быть равен нулю.');
          a = { t: 'val', kind: 'frac', fn: a.q.n, fd: b.q.n, q: Q(a.q.n, b.q.n) };
        } else a = { t: 'bin', op: '/', a, b };
      }
      return a;
    }
    function power() {
      const a = atom();
      if (!isOp('^')) return a;
      p++;
      let neg = false;
      if (isOp('−')) { p++; neg = true; } else if (isOp('+')) p++;
      if (!T[p]) throw new MathErr('Укажите показатель степени.');
      let e = power();
      if (neg) e = { t: 'neg', a: e };
      return { t: 'pow', a, b: e };
    }
    function atom() {
      const k = T[p];
      if (!k) throw new MathErr('Пример не закончен.');
      if (k.k === 'num') {
        p++;
        if (k.fr === undefined && T[p] && T[p].k === 'sp') {
          p++;
          const n1 = T[p++];
          if (!n1 || n1.k !== 'num' || n1.fr !== undefined || !isOp('/')) throw new MathErr('Смешанное число записывается так: 2 3/4');
          p++;
          const d1 = T[p++];
          if (!d1 || d1.k !== 'num' || d1.fr !== undefined) throw new MathErr('Смешанное число записывается так: 2 3/4');
          const w = BigInt(k.int), n = BigInt(n1.int), d = BigInt(d1.int);
          if (d === 0n) throw new MathErr('Знаменатель дроби не может быть равен нулю.');
          return { t: 'val', kind: 'mixed', w, fn: n, fd: d, q: Q(w * d + n, d) };
        }
        return numLit(k);
      }
      if (k.k === 'op' && k.v === '(') {
        p++;
        if (isOp(')')) throw new MathErr('Пустые скобки.');
        const e = expr();
        if (!isOp(')')) throw new MathErr('Не хватает закрывающей скобки.');
        p++;
        return { t: 'grp', a: e };
      }
      if (k.k === 'var') { p++; return { t: 'var' }; }
      if (k.k === 'op' && k.v === '√') { p++; return { t: 'sqrt', a: atom() }; }
      if (k.k === 'sp') throw new MathErr('Смешанное число записывается так: 2 3/4');
      throw new MathErr(k.v === ')' ? 'Лишняя закрывающая скобка.' : `Не хватает числа перед «${k.v === '÷' ? ':' : k.v}».`);
    }
    let r = expr();
    if (isOp('=')) {
      p++;
      if (!T[p]) throw new MathErr('Допишите правую часть уравнения.');
      r = { t: 'eq', a: r, b: expr() };
    }
    if (p < T.length) {
      if (isOp('=')) throw new MathErr('В уравнении должен быть только один знак «=».'); const k = T[p]; throw new MathErr(k.k === 'op' && k.v === ')' ? 'Лишняя закрывающая скобка.' : 'Проверьте запись примера.'); }
    return r;
  }
  const isNegVal = n => n.t === 'val' && n.q.n < 0n;
  function tallN(n) {
    if (n.t === 'val') return n.kind === 'frac' || n.kind === 'mixed' || (n.kind === 'res' && n.q.d !== 1n);
    if (n.t === 'bin' && n.op === '/') return true;
    return !!((n.a && tallN(n.a)) || (n.b && n.t !== 'pow' && tallN(n.b)));
  }
  const strip = n => (n.t === 'grp' ? n.a : n);
  function valH(n) {
    let h;
    switch (n.kind) {
      case 'int': h = fmtInt(abs(n.q.n)); break;
      case 'frac': h = fracH(fmtInt(n.fn), fmtInt(n.fd)); break;
      case 'mixed': h = `<span class="mw">${fmtInt(n.w)}</span>` + fracH(fmtInt(n.fn), fmtInt(n.fd)); break;
      case 'dec': h = n.src; break;
      default: return qH(n.q);
    }
    return (n.sg ? '−' : '') + h;
  }
  function R(n, hid) {
    let h;
    switch (n.t) {
      case 'val': h = valH(n); break;
      case 'var': h = '<i class="vx">x</i>'; break;
      case 'eq': h = `${R(n.a, hid)}<span class="op">=</span>${R(n.b, hid)}`; break;
      case 'grp': h = parH(R(n.a, hid), tallN(n.a)); break;
      case 'neg': {
        const a = n.a, need = (a.t === 'bin' && a.op !== '/') || a.t === 'neg' || isNegVal(a);
        h = '−' + (need ? parH(R(a, hid), tallN(a)) : R(a, hid)); break;
      }
      case 'sqrt': h = sqrtH(R(strip(n.a), hid)); break;
      case 'pow': {
        const a = n.a;
        let bh = R(a, hid);
        const need = (a.t === 'val' && (a.q.n < 0n || (a.kind !== 'int' && !(a.kind === 'res' && a.q.d === 1n)))) || a.t === 'neg' || a.t === 'bin' || a.t === 'pow';
        if (need) bh = parH(bh, tallN(a));
        h = supH(bh, R(strip(n.b), hid)); break;
      }
      case 'bin': {
        if (n.op === '/') { h = fracH(R(strip(n.a), hid), R(strip(n.b), hid)); break; }
        let bh = R(n.b, hid);
        if (isNegVal(n.b) || n.b.t === 'neg') bh = parH(bh, tallN(n.b));
        const sym = { '+': '+', '−': '−', '×': '·', '÷': ':' }[n.op];
        if (n.implicit && (n.b.t === 'var' || n.b.t === 'grp') && n.a.t !== 'var') { h = `${R(n.a, hid)}${bh}`; break; }
        h = `${R(n.a, hid)}<span class="op">${sym}</span>${bh}`; break;
      }
    }
    if (n.t === 'val' && hid !== undefined && n.hid === hid) h = `<span class="hl">${h}</span>`;
    return h;
  }
  function iroot(a, k) {
    if (a < 2n) return a;
    let lo = 1n, hi = 2n;
    while (hi ** k <= a) hi *= 2n;
    while (lo < hi - 1n) { const m = (lo + hi) / 2n; if (m ** k <= a) lo = m; else hi = m; }
    return lo ** k === a ? lo : null;
  }
  function reduceTail(C, N, raw) {
    if (raw.n === 0n) { C.push(raw.d === 1n ? '0' : qH(raw)); if (raw.d !== 1n) C.push('0'); return Q(0n); }
    C.push(qH(raw));
    const r = red(raw);
    if (r.d !== raw.d) { N.push(`Сокращаем дробь на ${fmtInt(gcd(raw.n, raw.d))}.`); C.push(qH(r)); }
    return r;
  }
  function opBin(op, x, y) {
    const C = [], N = [];
    let title = '', r;
    if (op === '+' || op === '−') {
      const s = op === '+' ? 1n : -1n, word = op === '+' ? 'Сложение' : 'Вычитание';
      C.push(`${qH(x)} ${op} ${qH(y, { paren: true })}`);
      if (x.d === 1n && y.d === 1n) { title = word + ' целых чисел'; r = Q(x.n + s * y.n); C.push(qH(r)); }
      else if (x.d === y.d) {
        title = word + ' дробей с одинаковыми знаменателями';
        N.push(`Знаменатель оставляем прежним, числители ${op === '+' ? 'складываем' : 'вычитаем'}.`);
        C.push(fracH(`${fmtInt(x.n)} ${op} ${pInt(y.n)}`, fmtInt(x.d)));
        r = reduceTail(C, N, Q(x.n + s * y.n, x.d));
      } else {
        const L = lcm(x.d, y.d), k1 = L / x.d, k2 = L / y.d;
        title = word + (x.d === 1n || y.d === 1n ? ' целого числа и дроби' : ' дробей с разными знаменателями');
        if (x.d === 1n || y.d === 1n) N.push(`Целое число записываем дробью со знаменателем ${fmtInt(L)}.`);
        else {
          N.push(`Приводим к общему знаменателю: НОК(${fmtInt(x.d)}; ${fmtInt(y.d)}) = ${fmtInt(L)}.`);
          N.push(`Дополнительные множители: ${fmtInt(L)} : ${fmtInt(x.d)} = ${fmtInt(k1)}, ${fmtInt(L)} : ${fmtInt(y.d)} = ${fmtInt(k2)}.`);
        }
        C.push(`${qH(Q(x.n * k1, L))} ${op} ${qH(Q(y.n * k2, L), { paren: true })}`);
        C.push(fracH(`${fmtInt(x.n * k1)} ${op} ${pInt(y.n * k2)}`, fmtInt(L)));
        r = reduceTail(C, N, Q(x.n * k1 + s * y.n * k2, L));
      }
      return { q: r, title, notes: N, chain: C };
    }
    if (op === '/' && x.d === 1n && y.d === 1n) {
      if (y.n === 0n) throw new MathErr('На ноль делить нельзя.');
      title = 'Сокращаем дробь';
      const raw = Q(x.n, y.n), g = gcd(raw.n, raw.d);
      N.push(`Делим числитель и знаменатель на их НОД = ${fmtInt(g)}.`);
      C.push(qH(raw)); r = red(raw); C.push(qH(r));
      return { q: r, title, notes: N, chain: C };
    }
    let a = x, b = y;
    if (op === '×') {
      title = 'Умножение' + (x.d === 1n && y.d === 1n ? ' целых чисел' : (x.d === 1n || y.d === 1n ? ' дроби на число' : ' дробей'));
      C.push(`${qH(a)} · ${qH(b, { paren: true })}`);
    } else {
      if (y.n === 0n) throw new MathErr('На ноль делить нельзя.');
      if (op === '/') { title = 'Дробная черта — это деление'; C.push(fracH(qH(x), qH(y))); }
      C.push(`${qH(x)} : ${qH(y, { paren: true })}`);
      if (x.d === 1n && y.d === 1n) {
        title = title || 'Деление';
        if (x.n % y.n === 0n) { r = Q(x.n / y.n); C.push(qH(r)); return { q: r, title, notes: N, chain: C }; }
        N.push('Частное целых чисел записываем дробью.');
        r = reduceTail(C, N, Q(x.n, y.n));
        return { q: r, title, notes: N, chain: C };
      }
      title = title || (x.d === 1n || y.d === 1n ? 'Деление с дробями' : 'Деление дробей');
      b = Q(y.d, y.n);
      N.push('Деление заменяем умножением на число, обратное делителю (дробь «переворачиваем»).');
      C.push(`${qH(a)} · ${qH(b, { paren: true })}`);
    }
    if (a.d === 1n && b.d === 1n) { r = Q(a.n * b.n); C.push(qH(r)); }
    else {
      N.push('Числитель умножаем на числитель, знаменатель — на знаменатель.');
      const dens = [a.d, b.d].filter(d => d !== 1n).map(fmtInt).join(' · ');
      C.push(fracH(`${fmtInt(a.n)} · ${pInt(b.n)}`, dens));
      r = reduceTail(C, N, Q(a.n * b.n, a.d * b.d));
    }
    return { q: r, title, notes: N, chain: C };
  }
  function opPow(x, e) {
    const C = [], N = [];
    let title = 'Возведение в степень';
    e = red(e);
    C.push(supH(qH(x, { pbase: true }), qH(e)));
    if (e.d !== 1n) {
      const p = e.n, k = e.d;
      if (x.n < 0n && k % 2n === 0n) throw new MathErr('Корень чётной степени из отрицательного числа не существует.');
      const rn = iroot(abs(x.n), k), rd = iroot(x.d, k);
      if (rn === null || rd === null) throw new MathErr(`Результат иррациональный (≈ ${approx(Math.sign(qNum(x)) * Math.pow(Math.abs(qNum(x)), Number(p) / Number(k)))}) — обыкновенной дробью его не записать.`);
      title = 'Степень с дробным показателем';
      N.push(`a<sup>p/q</sup> = (<sup>q</sup>√a)<sup>p</sup>: сначала извлекаем корень ${k === 2n ? 'квадратный' : k === 3n ? 'кубический' : fmtInt(k) + '-й степени'}, затем возводим в степень ${fmtInt(p)}.`);
      if (p === 1n) { C.push(rootH(qH(x), k)); const rr = Q(x.n < 0n ? -rn : rn, rd); C.push(qH(rr)); N[0] = `Показатель 1/${fmtInt(k)} означает корень ${k === 2n ? 'квадратный' : k === 3n ? 'кубический' : fmtInt(k) + '-й степени'}.`; return { q: rr, title, notes: N, chain: C }; }
      C.push(supH(parH(rootH(qH(x), k), true), fmtInt(p)));
      x = Q(x.n < 0n ? -rn : rn, rd);
      C.push(powH(x, p));
      e = Q(p);
    }
    let n = e.n;
    if (n === 0n) {
      if (x.n === 0n) throw new MathErr('Выражение 0⁰ не имеет смысла.');
      N.push('Любое число, кроме нуля, в нулевой степени равно 1.');
      C.push('1'); return { q: Q(1n), title: 'Нулевая степень', notes: N, chain: C };
    }
    if (abs(n) > 1000n) throw new MathErr('Слишком большой показатель степени.');
    if (n < 0n) {
      if (x.n === 0n) throw new MathErr('Ноль нельзя возводить в отрицательную степень.');
      x = Q(x.d, x.n); n = -n; title = 'Степень с отрицательным показателем';
      N.push('Отрицательный показатель: «переворачиваем» дробь, а показатель берём положительным.');
      C.push(powH(x, n));
    }
    if (n === 1n) { if (C.length < 2 || x.d !== 1n) C.push(qH(x)); return { q: x, title, notes: N, chain: C }; }
    const digits = Math.max(abs(x.n).toString().length, x.d.toString().length) * Number(n);
    if (digits > LIM + 40) throw new MathErr('Получаются слишком большие числа. Попробуйте пример попроще.');
    if (x.d === 1n) { if (n <= 4n && abs(x.n) < 1000n) C.push(Array(Number(n)).fill(pInt(x.n)).join(' · ')); }
    else { N.push('Возводим в степень отдельно числитель и знаменатель.'); C.push(fracH(supH(pInt(x.n), fmtInt(n)), supH(fmtInt(x.d), fmtInt(n)))); }
    if (x.n < 0n) N.push(n % 2n === 0n ? 'Отрицательное число в чётной степени — положительное.' : 'Отрицательное число в нечётной степени — отрицательное.');
    const r = Q(x.n ** n, x.d ** n);
    C.push(qH(r));
    return { q: r, title, notes: N, chain: C };
  }
  function opSqrt(x) {
    if (x.n < 0n) throw new MathErr('Квадратный корень из отрицательного числа не определён.');
    const rn = iroot(x.n, 2n), rd = iroot(x.d, 2n);
    if (rn === null || rd === null) throw new MathErr(`Корень не извлекается нацело: число иррациональное (≈ ${approx(Math.sqrt(qNum(x)))}).`);
    const C = [sqrtH(qH(x))], N = [];
    if (x.d !== 1n) { N.push('Корень из дроби: извлекаем корень из числителя и из знаменателя.'); C.push(fracH(sqrtH(fmtInt(x.n)), sqrtH(fmtInt(x.d)))); }
    const r = Q(rn, rd); C.push(qH(r));
    return { q: r, title: 'Квадратный корень', notes: N, chain: C };
  }
  function fold(n) {
    switch (n.t) {
      case 'val': return n;
      case 'grp': { const a = fold(n.a); return a.t === 'val' ? a : { ...n, a }; }
      case 'neg': { const a = fold(n.a); if (a.t !== 'val') return { ...n, a }; return { ...a, q: { n: -a.q.n, d: a.q.d }, sg: !a.sg }; }
      case 'sqrt': return { ...n, a: fold(n.a) };
      case 'pow': return { ...n, a: fold(n.a), b: fold(n.b) };
      default: {
        const a = fold(n.a), b = fold(n.b);
        if (n.op === '/' && a.t === 'val' && b.t === 'val' && a.q.d === 1n && b.q.d === 1n && b.q.n !== 0n && gcd(a.q.n, b.q.n) === 1n)
          return { t: 'val', kind: 'res', q: Q(a.q.n, b.q.n), hid: a.hid !== undefined ? a.hid : b.hid };
        return { ...n, a, b };
      }
    }
  }
  function findNext(root) {
    let best = null, ord = 0;
    const cand = (node, d, p) => { ord++; if (!best || d > best.d || (d === best.d && p > best.p)) best = { node, d, p }; };
    (function walk(n, dp) {
      switch (n.t) {
        case 'val': return;
        case 'grp': walk(n.a, dp + 1); return;
        case 'neg': walk(n.a, dp); return;
        case 'sqrt': walk(n.a, dp + 1); if (n.a.t === 'val') cand(n, dp, 3); return;
        case 'pow': walk(n.a, dp); walk(n.b, dp + 1); if (n.a.t === 'val' && n.b.t === 'val') cand(n, dp, 3); return;
        default: {
          const d2 = n.op === '/' ? dp + 1 : dp;
          walk(n.a, d2); walk(n.b, d2);
          if (n.a.t === 'val' && n.b.t === 'val') cand(n, dp, n.op === '+' || n.op === '−' ? 1 : 2);
        }
      }
    })(root, 0);
    return best && best.node;
  }
  function replace(n, target, rep) {
    if (n === target) return rep;
    if (n.t === 'val') return n;
    const m = { ...n };
    if (n.a) m.a = replace(n.a, target, rep);
    if (n.b) m.b = replace(n.b, target, rep);
    return m;
  }
  function vals(n, out = []) { if (n.t === 'val') out.push(n); else { if (n.a) vals(n.a, out); if (n.b) vals(n.b, out); } return out; }
  function mapVals(n, f) { if (n.t === 'val') return f(n); const m = { ...n }; if (n.a) m.a = mapVals(n.a, f); if (n.b) m.b = mapVals(n.b, f); return m; }
  const uniqLines = ls => { const s = new Set(); return ls.filter(l => { const k = l.join('|'); if (s.has(k)) return false; s.add(k); return true; }); };
  const hasVar = n => n.t === 'var' || (n.a && hasVar(n.a)) || (n.b && hasVar(n.b));
  const qadd = (x, y) => red(Q(x.n * y.d + y.n * x.d, x.d * y.d));
  const qneg = x => ({ n: -x.n, d: x.d });
  const qmul = (x, y) => red(Q(x.n * y.n, x.d * y.d));
  const qdiv = (x, y) => { if (y.n === 0n) throw new MathErr('На ноль делить нельзя.'); return red(Q(x.n * y.d, x.d * y.n)); };
  const Z = () => Q(0n);
  function lin(n) {
    switch (n.t) {
      case 'val': return { a: Z(), b: red(n.q) };
      case 'var': return { a: Q(1n), b: Z() };
      case 'grp': return lin(n.a);
      case 'neg': { const l = lin(n.a); return { a: qneg(l.a), b: qneg(l.b) }; }
      case 'sqrt': { const l = lin(n.a); if (l.a.n) throw new MathErr('x под корнем — уравнение не линейное.'); return { a: Z(), b: opSqrt(l.b).q }; }
      case 'pow': {
        const l = lin(n.a), e = lin(n.b);
        if (e.a.n) throw new MathErr('x в показателе степени — такое уравнение здесь не решается.');
        if (!l.a.n) return { a: Z(), b: opPow(l.b, e.b).q };
        if (e.b.n === e.b.d) return l;
        throw new MathErr('Степень с x — уравнение не линейное.');
      }
      case 'bin': {
        const L = lin(n.a), M = lin(n.b);
        if (n.op === '+') return { a: qadd(L.a, M.a), b: qadd(L.b, M.b) };
        if (n.op === '−') return { a: qadd(L.a, qneg(M.a)), b: qadd(L.b, qneg(M.b)) };
        if (n.op === '×') {
          if (!L.a.n) return { a: qmul(M.a, L.b), b: qmul(M.b, L.b) };
          if (!M.a.n) return { a: qmul(L.a, M.b), b: qmul(L.b, M.b) };
          throw new MathErr('x умножается на x — уравнение не линейное.');
        }
        if (M.a.n) throw new MathErr('x в знаменателе — такое уравнение здесь не решается.');
        return { a: qdiv(L.a, M.b), b: qdiv(L.b, M.b) };
      }
    }
    throw new MathErr('Проверьте запись уравнения.');
  }
  function xTerm(a, first) {
    const neg = a.n < 0n, A = { n: neg ? -a.n : a.n, d: a.d };
    const c = (A.n === 1n && A.d === 1n) ? '' : qH(A);
    return (neg ? (first ? '−' : ' − ') : (first ? '' : ' + ')) + c + '<i class="vx">x</i>';
  }
  function nTerm(b, first) {
    const neg = b.n < 0n;
    return (neg ? (first ? '−' : ' − ') : (first ? '' : ' + ')) + qH({ n: neg ? -b.n : b.n, d: b.d });
  }
  function linH(l) {
    let h = '';
    if (l.a.n) h += xTerm(l.a, true);
    if (l.b.n || !l.a.n) h += nTerm(l.b, !h);
    return h;
  }
  function solveEq(ast) {
    const L = lin(ast.a), Rr = lin(ast.b), steps = [];
    const lh = linH(L), rh = linH(Rr);
    const norm = h => h.replace(/<[^>]+>/g, '').replace(/[\s·]/g, '');
    if (norm(lh) !== norm(R(ast.a)) || norm(rh) !== norm(R(ast.b))) steps.push({ title: 'Упрощаем обе части уравнения', notes: ['Раскрываем скобки, выполняем действия с числами и приводим подобные слагаемые в каждой части.'], lines: [[`${lh} = ${rh}`]], expr: null });
    const A = qadd(L.a, qneg(Rr.a)), B = qadd(Rr.b, qneg(L.b));
    if (Rr.a.n || L.b.n) {
      let left = L.a.n ? xTerm(L.a, true) : '', right = Rr.b.n ? nTerm(Rr.b, true) : '';
      if (Rr.a.n) left += xTerm(qneg(Rr.a), !left);
      if (L.b.n) right += nTerm(qneg(L.b), !right);
      const lines = [[`${left || '0'} = ${right || '0'}`]];
      const notes = ['Слагаемые с x собираем слева, числа — справа. При переносе через знак «=» знак слагаемого меняется на противоположный.'];
      const comb = (u, v) => (v.n < 0n ? opBin('−', u, qneg(v)) : opBin('+', u, v));
      if (L.a.n && Rr.a.n) lines.push(comb(L.a, qneg(Rr.a)).chain);
      if (Rr.b.n && L.b.n) lines.push(comb(Rr.b, qneg(L.b)).chain);
      steps.push({ title: 'Переносим слагаемые', notes, lines, expr: `${A.n ? xTerm(A, true) : '0'} = ${qH(B)}` });
    }
    let kind = 'one', x = null;
    if (!A.n) {
      kind = B.n ? 'none' : 'all';
      steps.push({ title: kind === 'none' ? 'Корней нет' : 'Корень — любое число', notes: [kind === 'none' ? `Получилось 0 · x = ${qText(B)}: ни при каком x равенство не выполняется.` : 'Получилось 0 · x = 0: равенство верно при любом x.'], lines: [[`0 · <i class="vx">x</i> = ${qH(B)}`]], expr: null });
    } else {
      x = qdiv(B, A);
      if (!(A.n === 1n && A.d === 1n)) {
        const c = opBin('÷', B, A);
        c.chain[0] = `<i class="vx">x</i> = ${c.chain[0]}`;
        steps.push({ title: 'Находим x', notes: ['Чтобы найти неизвестный множитель, делим обе части уравнения на коэффициент при x.'].concat(c.notes), lines: [c.chain], expr: null });
      }
      const vl = qadd(qmul(L.a, x), L.b), vr = qadd(qmul(Rr.a, x), Rr.b);
      steps.push({ title: 'Проверка', notes: [`Подставляем x = ${qText(x, true)} в обе части: получилось верное равенство.`], lines: [[`<span class="lp">левая часть</span> ${qH(vl)}`], [`<span class="lp">правая часть</span> ${qH(vr)}`]], expr: null, check: true });
    }
    return { inputH: R(ast), steps, q: x, info: x ? describe(x) : null, isEq: true, kind };
  }

  function solve(str) {
    const ast = parse(str);
    if (ast.t === 'eq') return solveEq(ast);
    if (hasVar(ast)) throw new MathErr('В примере есть x — добавьте «=», чтобы получилось уравнение.');
    const steps = [];
    let root = ast, hid = 0;

    const mixed = vals(root).filter(v => v.kind === 'mixed');
    if (mixed.length) {
      hid++;
      const lines = uniqLines(mixed.map(v => [valH({ ...v, sg: false }), fracH(`${fmtInt(v.w)} · ${fmtInt(v.fd)} + ${fmtInt(v.fn)}`, fmtInt(v.fd)), fracH(fmtInt(v.w * v.fd + v.fn), fmtInt(v.fd))]));
      root = mapVals(root, v => v.kind === 'mixed' ? { ...v, kind: 'frac', fn: v.w * v.fd + v.fn, hid } : v);
      steps.push({ title: 'Переводим смешанные числа в неправильные дроби', notes: ['Целую часть умножаем на знаменатель и прибавляем числитель, знаменатель не меняется.'], lines, expr: R(root, hid) });
    }
    const decs = vals(root).filter(v => v.kind === 'dec');
    if (decs.length) {
      hid++;
      const notes = [];
      if (decs.some(v => !v.per)) notes.push('Десятичная дробь — это дробь со знаменателем 10, 100, 1000…');
      if (decs.some(v => v.per)) notes.push('Периодическая дробь: из числа до конца первого периода вычитаем число до периода; в знаменателе — столько девяток, сколько цифр в периоде, и столько нулей, сколько цифр между запятой и периодом.');
      const lines = uniqLines(decs.map(v => v.per
        ? [v.src, fracH(`${fmtInt(v.per.A)} − ${fmtInt(v.per.B)}`, fmtInt(v.fd)), fracH(fmtInt(v.fn), fmtInt(v.fd))]
        : [v.src, v.fd === 1n ? fmtInt(v.fn) : fracH(fmtInt(v.fn), fmtInt(v.fd))]));
      root = mapVals(root, v => v.kind === 'dec' ? { ...v, kind: v.fd === 1n ? 'int' : 'frac', hid } : v);
      steps.push({ title: 'Переводим десятичные дроби в обыкновенные', notes, lines, expr: R(root, hid) });
    }
    const reducible = vals(root).filter(v => v.kind === 'frac' && gcd(v.fn, v.fd) > 1n);
    if (reducible.length) {
      hid++;
      const lines = uniqLines(reducible.map(v => { const g = gcd(v.fn, v.fd); return [fracH(fmtInt(v.fn), fmtInt(v.fd)), fracH(`${fmtInt(v.fn)} : ${fmtInt(g)}`, `${fmtInt(v.fd)} : ${fmtInt(g)}`), qH(red({ n: v.fn, d: v.fd }))]; }));
      root = mapVals(root, v => (v.kind === 'frac' && gcd(v.fn, v.fd) > 1n) ? { t: 'val', kind: 'res', q: red(v.q), hid } : v);
      steps.push({ title: 'Сокращаем дроби', notes: ['Делим числитель и знаменатель на их наибольший общий делитель.'], lines, expr: R(root, hid) });
    }
    root = mapVals(root, v => ({ t: 'val', kind: 'res', q: red(v.q), hid: v.hid }));
    root = fold(root);
    let guard = 0;
    while (root.t !== 'val') {
      if (++guard > 300) throw new MathErr('Слишком длинный пример.');
      const node = findNext(root);
      if (!node) throw new MathErr('Не удалось разобрать пример.');
      let res;
      if (node.t === 'pow') res = opPow(node.a.q, node.b.q);
      else if (node.t === 'sqrt') res = opSqrt(node.a.q);
      else res = opBin(node.op, node.a.q, node.b.q);
      hid++;
      root = fold(replace(root, node, { t: 'val', kind: 'res', q: res.q, hid }));
      steps.push({ title: res.title, notes: res.notes, lines: [res.chain], expr: root.t === 'val' ? null : R(root, hid) });
    }
    const q = red(root.q);
    return { inputH: R(ast), steps, q, info: describe(q) };
  }

  function toDec(q, max = 48) {
    const neg = q.n < 0n; let n = abs(q.n); const d = q.d, ip = n / d; let r = n % d;
    const s0 = (neg && q.n !== 0n ? '−' : '') + fmtInt(ip);
    if (r === 0n) return { s: s0, exact: true, finite: true };
    const seen = new Map(); let digits = '';
    while (r !== 0n && !seen.has(r) && digits.length < max) { seen.set(r, digits.length); r *= 10n; digits += (r / d).toString(); r %= d; }
    if (r === 0n) return { s: `${s0},${digits}`, exact: true, finite: true };
    if (seen.has(r)) { const i = seen.get(r); return { s: `${s0},${digits.slice(0, i)}(${digits.slice(i)})`, exact: true, finite: false }; }
    return { s: `${s0},${digits}…`, exact: false, finite: false };
  }
  function describe(q) {
    const a = abs(q.n);
    return {
      frac: qH(q),
      mixed: (a > q.d && q.d !== 1n) ? qH(q, { mixed: true }) : null,
      dec: toDec(q),
      pct: toDec(Q(q.n * 100n, q.d), 12),
      text: qText(q, false), textMixed: qText(q, true),
      isInt: q.d === 1n,
    };
  }
  function factor(n) {
    const f = []; let x = abs(n);
    if (x < 2n) return f;
    for (let p = 2n; p * p <= x; p += (p === 2n ? 1n : 2n)) { let c = 0; while (x % p === 0n) { x /= p; c++; } if (c) f.push([p, c]); }
    if (x > 1n) f.push([x, 1]);
    return f;
  }
  const factH = f => f.length ? f.map(([p, c]) => c > 1 ? supH(fmtInt(p), c) : fmtInt(p)).join(' · ') : '1';
  function gcdLcm(nums) {
    nums = nums.map(x => abs(BigInt(x))).filter(x => x > 0n);
    if (nums.length < 2) throw new MathErr('Введите хотя бы два натуральных числа.');
    if (nums.some(x => x > 10n ** 12n)) throw new MathErr('Числа должны быть не больше 10¹².');
    const fs = nums.map(factor);
    const g = nums.reduce(gcd), l = nums.reduce(lcm);
    const all = new Map();
    fs.forEach(f => f.forEach(([p, c]) => all.set(p, Math.max(all.get(p) || 0, c))));
    const common = [...all.keys()].sort((a, b) => (a < b ? -1 : 1)).map(p => [p, Math.min(...fs.map(f => (f.find(x => x[0] === p) || [0, 0])[1]))]).filter(x => x[1] > 0);
    const maxF = [...all.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return {
      g, l,
      lines: nums.map((n, i) => `${fmtInt(n)} = ${fs[i].length ? factH(fs[i]) : '1'}`),
      gH: `НОД = ${common.length ? factH(common) + ' = ' : ''}${fmtInt(g)}`,
      lH: `НОК = ${factH(maxF)} = ${fmtInt(l)}`,
    };
  }
  function euclid(a, b) {
    a = abs(a); b = abs(b); if (a < b) [a, b] = [b, a]; const L = [];
    while (b) { const q = a / b, r = a % b; L.push(`${fmtInt(a)} = ${fmtInt(b)} · ${fmtInt(q)} + ${fmtInt(r)}`); a = b; b = r; }
    return { g: a, lines: L };
  }
  function valueOf(str) { return solve(str).q; }
  function compare(s1, s2) {
    const x = valueOf(s1), y = valueOf(s2);
    const L = lcm(x.d, y.d), a = x.n * (L / x.d), b = y.n * (L / y.d);
    const sign = a === b ? '=' : a < b ? '<' : '>';
    const lines = [];
    if (x.d !== y.d) lines.push(`Общий знаменатель: НОК(${fmtInt(x.d)}; ${fmtInt(y.d)}) = ${fmtInt(L)}`);
    lines.push(`${qH(x)} = ${qH(Q(a, L))}`, `${qH(y)} = ${qH(Q(b, L))}`);
    lines.push(`${fmtInt(a)} ${sign} ${fmtInt(b)}, значит ${qH(x)} ${sign} ${qH(y)}`);
    return { sign, x, y, lines, diff: qH(red(Q(a - b, L))) };
  }
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function rfr(maxD, minD = 2) { const d = ri(minD, maxD); let n; do { n = ri(1, d - 1); } while (gcd(BigInt(n), BigInt(d)) !== 1n); return `${n}/${d}`; }
  function rmix(maxD) { return `${ri(1, 4)} ${rfr(maxD)}`; }
  const GEN = {
    add: l => {
      const D = [8, 12, 18][l - 1];
      if (l === 3) return `${rfr(D)} ${pick(['+', '−'])} ${rfr(D)} ${pick(['+', '−'])} ${rfr(D)}`;
      return `${rfr(D)} ${l === 1 ? '+' : pick(['+', '−'])} ${rfr(D)}`;
    },
    mul: l => {
      const D = [9, 15, 25][l - 1];
      if (l === 3) return `${rfr(D)} ${pick(['×', '÷'])} ${rfr(D)} ${pick(['×', '÷'])} ${rfr(D)}`;
      return `${rfr(D)} ${pick(['×', '÷'])} ${l === 2 && Math.random() < .3 ? ri(2, 9) : rfr(D)}`;
    },
    mixed: l => {
      const D = [6, 9, 12][l - 1];
      const ops = l === 1 ? ['+', '−'] : ['+', '−', '×', '÷'];
      return `${rmix(D)} ${pick(ops)} ${rmix(D)}`;
    },
    pow: l => {
      if (l === 1) return `(${rfr(5)})^${ri(2, 3)}`;
      if (l === 2) return `(${rfr(6)})^${pick(['−1', '−2', '0', '2', '3'])}`;
      return pick([
        () => `(${rfr(5)})^−2 × ${rfr(9)}`,
        () => `(${rfr(4)})^2 + (${rfr(4)})^−1`,
        () => `(−${rfr(4)})^3 ÷ ${rfr(8)}`,
        () => `(${pick(['4/9', '9/16', '1/4', '25/36', '16/49'])})^(1/2) − ${rfr(6)}`,
      ])();
    },
    eq: l => {
      const A = () => rfr([6, 9, 12][l - 1]);
      if (l === 1) return pick([() => `x + ${A()} = ${A()}`, () => `x − ${A()} = ${A()}`, () => `${A()}x = ${A()}`])();
      if (l === 2) return pick([() => `${A()}x + ${A()} = ${A()}`, () => `x ÷ ${A()} = ${A()}`, () => `${A()}x − ${A()} = ${ri(1, 3)}`])();
      return pick([() => `${A()}(x − ${A()}) = ${A()}`, () => `${A()}x + ${A()} = ${A()}x − ${A()}`, () => `${rmix(4)} − x = ${A()}x`])();
    },
    order: l => {
      const D = [6, 10, 12][l - 1];
      const A = () => rfr(D);
      return pick(l === 1 ? [
        () => `(${A()} + ${A()}) × ${A()}`,
        () => `${A()} + ${A()} × ${A()}`,
        () => `${A()} − ${A()} ÷ ${A()}`,
      ] : l === 2 ? [
        () => `(${A()} − ${A()}) ÷ ${A()}`,
        () => `(${A()} + ${A()})^2 × ${ri(2, 9)}`,
        () => `${A()} × ${A()} + ${A()} ÷ ${A()}`,
      ] : [
        () => `(${A()} − ${A()})^2 ÷ (${A()} + ${A()})`,
        () => `(${rmix(6)} − ${A()}) × (${A()})^−1`,
        () => `${A()} − (${A()})^2 × (${A()} + ${ri(1, 3)})`,
      ])();
    },
  };
  function genTask(topic, lvl) {
    for (let t = 0; t < 80; t++) {
      const s = GEN[topic === 'all' ? pick(Object.keys(GEN)) : topic](lvl);
      try { const r = solve(s); if (r.q && r.q.n !== 0n && r.q.d <= 400n && abs(r.q.n) <= 20000n) return { s, r }; } catch (e) { }
    }
    return { s: '1/2 + 1/3', r: solve('1/2 + 1/3') };
  }
  const plain = s => s.replace(/×/g, '·').replace(/÷/g, ':').replace(/\^/g, '^');

  G.Frac = { opBin, MathErr, parse, solve, R, qH, qText, fmtInt, toDec, gcd, lcm, red, Q, gcdLcm, euclid, compare, valueOf, factor, factH, genTask, plain, fracH };
})(typeof window !== 'undefined' ? window : globalThis);
