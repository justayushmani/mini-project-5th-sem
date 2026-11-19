// Shared helpers for the Yojana Saathi pilot evaluation (pure functions, no DB / network).

export const SCORED_FIELDS = [
  'age', 'state', 'occupation', 'annualIncome', 'gender', 'category',
  'disability', 'maritalStatus', 'landOwnership',
];

const isMissing = (v) =>
  v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));

export function sameValue(field, a, b) {
  if (field === 'age' || field === 'annualIncome') {
    const x = Number(a);
    const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const tol = field === 'annualIncome' ? Math.max(1, Math.abs(y) * 0.01) : 0;
    return Math.abs(x - y) <= tol;
  }
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/** Compare one extracted profile to its gold profile, field by field. */
export function scoreProfile(gold, extracted, fields = SCORED_FIELDS) {
  const out = {};
  for (const f of fields) {
    const g = isMissing(gold?.[f]) ? null : gold[f];
    const e = isMissing(extracted?.[f]) ? null : extracted[f];
    if (g === null && e === null) out[f] = 'TN';
    else if (g !== null && e === null) out[f] = 'MISSED';
    else if (g !== null && sameValue(f, e, g)) out[f] = 'TP';
    else if (g !== null) out[f] = 'WRONG';
    else out[f] = 'SPURIOUS'; // extracted a value that the text never stated
  }
  return out;
}

const safeDiv = (a, b) => (b === 0 ? null : a / b);
const round = (x, d = 3) => (x === null || x === undefined ? null : Number(x.toFixed(d)));

/** rows: [{ outcomes: {field: 'TP'|...}, ... }] */
export function aggregateExtraction(rows, fields = SCORED_FIELDS) {
  const perField = {};
  let TP = 0, FP = 0, FN = 0, spurious = 0, wrong = 0;
  for (const f of fields) {
    const c = { tp: 0, missed: 0, wrong: 0, spurious: 0, tn: 0 };
    for (const r of rows) {
      const o = r.outcomes?.[f];
      if (o === 'TP') c.tp++;
      else if (o === 'MISSED') c.missed++;
      else if (o === 'WRONG') c.wrong++;
      else if (o === 'SPURIOUS') c.spurious++;
      else if (o === 'TN') c.tn++;
    }
    const fp = c.wrong + c.spurious;
    const fn = c.missed + c.wrong;
    const p = safeDiv(c.tp, c.tp + fp);
    const rc = safeDiv(c.tp, c.tp + fn);
    const f1 = p !== null && rc !== null && p + rc > 0 ? (2 * p * rc) / (p + rc) : null;
    perField[f] = { ...c, precision: round(p), recall: round(rc), f1: round(f1) };
    TP += c.tp; FP += fp; FN += fn; spurious += c.spurious; wrong += c.wrong;
  }
  const p = safeDiv(TP, TP + FP);
  const rc = safeDiv(TP, TP + FN);
  const f1 = p !== null && rc !== null && p + rc > 0 ? (2 * p * rc) / (p + rc) : null;
  const exact = rows.filter((r) =>
    fields.every((f) => r.outcomes?.[f] === 'TP' || r.outcomes?.[f] === 'TN')).length;
  return {
    n: rows.length,
    micro: { precision: round(p), recall: round(rc), f1: round(f1), tp: TP, fp: FP, fn: FN },
    spuriousValues: spurious,
    wrongValues: wrong,
    exactProfileMatch: round(safeDiv(exact, rows.length)),
    perField,
  };
}

// ---------------------------------------------------------------- keyword baseline (BM25)
const STOP = new Set(('the and for with that this from have has are was were you your our their his her its who whom '
  + 'which what when where how any all can need needs want looking scheme schemes please help hello living live '
  + 'old year years per about around income annual rupees lakh thousand month monthly aged age belong category').split(' '));

export function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t));
}

export function buildBm25(docs, { k1 = 1.5, b = 0.75 } = {}) {
  const toks = docs.map((d) => tokenize(d.text));
  const N = docs.length;
  const avgdl = toks.reduce((a, t) => a + t.length, 0) / Math.max(1, N);
  const df = new Map();
  toks.forEach((t) => new Set(t).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const tf = toks.map((t) => {
    const m = new Map();
    t.forEach((w) => m.set(w, (m.get(w) || 0) + 1));
    return m;
  });
  return function rank(query, topK = 5) {
    const q = [...new Set(tokenize(query))];
    const scored = docs.map((d, i) => {
      let s = 0;
      for (const w of q) {
        const f = tf[i].get(w) || 0;
        if (!f) continue;
        const idf = Math.log(1 + (N - (df.get(w) || 0) + 0.5) / ((df.get(w) || 0) + 0.5));
        s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avgdl)));
      }
      return { id: d.id, score: s };
    });
    return scored.filter((x) => x.score > 0).sort((a, b2) => b2.score - a.score).slice(0, topK);
  };
}

// ---------------------------------------------------------------- misc utilities
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function percentile(values, p) {
  if (!values.length) return null;
  const s = [...values].sort((x, y) => x - y);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

export const median = (v) => percentile(v, 50);

// ---------------------------------------------------------------- CSV (UTF-8, RFC 4180)
export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(',')];
  for (const r of rows) lines.push(columns.map((c) => esc(r[c])).join(','));
  return `﻿${lines.join('\r\n')}\r\n`; // BOM so Excel shows Hindi / Bengali text correctly
}

export function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((c) => c !== '')) rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

// ---------------------------------------------------------------- ranking metrics
export function ndcgAtK(gains, idealGains, k) {
  const dcg = (g) => g.slice(0, k).reduce((s, x, i) => s + x / Math.log2(i + 2), 0);
  const ideal = [...idealGains].sort((a, b) => b - a);
  const denom = dcg(ideal);
  return denom === 0 ? null : dcg(gains) / denom;
}

export function cohenKappa(pairs, categories = [0, 1, 2]) {
  const n = pairs.length;
  if (!n) return { n: 0, agreement: null, kappa: null };
  let agree = 0;
  const ca = Object.fromEntries(categories.map((c) => [c, 0]));
  const cb = { ...ca };
  for (const [a, b] of pairs) {
    if (a === b) agree++;
    ca[a]++; cb[b]++;
  }
  const po = agree / n;
  const pe = categories.reduce((s, c) => s + (ca[c] / n) * (cb[c] / n), 0);
  return { n, agreement: round(po), kappa: pe === 1 ? null : round((po - pe) / (1 - pe)) };
}
