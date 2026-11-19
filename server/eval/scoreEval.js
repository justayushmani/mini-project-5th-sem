#!/usr/bin/env node
/**
 * Yojana Saathi pilot evaluation - PHASE 2 (score the human labels).
 *
 *   node eval/scoreEval.js --a labelled_A.csv --b labelled_B.csv [--final adjudicated.csv] [--out eval/out]
 *
 *  --a / --b   the review_sheet.csv copies filled in by labeller A and labeller B
 *  --final     optional CSV with columns pair_id,final  (agreed label for rows where A and B disagreed)
 *  --allow-unadjudicated  use the LOWER of the two labels for any disagreement that has no final label
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, toCsv, ndcgAtK, cohenKappa } from './lib.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VALID = new Set([0, 1, 2]);
const r3 = (x) => (x === null || x === undefined ? null : Number(x.toFixed(3)));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function readSheet(file) {
  return new Map(parseCsv(fs.readFileSync(file, 'utf8')).map((r) => [r.pair_id, r]));
}
const parseLabel = (v) => (v === '' || v === undefined ? null : Number(v));

export function scoreLabels({ sheetA, sheetB, finalMap = new Map(), key, results, allowUnadjudicated = false }) {
  const problems = [];
  const labels = new Map(); // pair_id -> {a,b,final}
  const disagreements = [];
  const kappaPairs = [];

  for (const pairId of Object.keys(key)) {
    const rowA = sheetA.get(pairId);
    const rowB = sheetB.get(pairId);
    const assigned = (rowA || rowB)?.assigned_to;
    if (!assigned) { problems.push(`${pairId}: missing from both files`); continue; }
    const a = parseLabel(rowA?.label_A);
    const b = parseLabel(rowB?.label_B);
    const need = { A: ['a'], B: ['b'], BOTH: ['a', 'b'] }[assigned];
    const have = { a, b };
    for (const n of need) {
      if (have[n] === null || !VALID.has(have[n])) problems.push(`${pairId}: label_${n.toUpperCase()} is empty or not 0/1/2 (assigned to ${assigned})`);
    }
    let final = null;
    if (assigned === 'A') final = a;
    else if (assigned === 'B') final = b;
    else if (a !== null && b !== null) {
      kappaPairs.push([a, b]);
      if (a === b) final = a;
      else if (finalMap.has(pairId) && VALID.has(finalMap.get(pairId))) final = finalMap.get(pairId);
      else {
        disagreements.push({ pair_id: pairId, profile_id: key[pairId].profile_id, scheme_name: rowA?.scheme_name, label_A: a, label_B: b, final: '' });
        if (allowUnadjudicated) final = Math.min(a, b);
      }
    }
    labels.set(pairId, { a, b, final, assigned });
  }
  if (problems.length) return { problems, disagreements };
  if (disagreements.length && !allowUnadjudicated) return { problems: [], disagreements, needAdjudication: true };

  // (profile, scheme) -> label
  const labelOf = new Map();
  for (const [pairId, l] of labels) labelOf.set(`${key[pairId].profile_id}|${key[pairId].schemeId}`, l.final);

  const recProfiles = results.filter((r) => r.rec);
  const per = [];
  for (const r of recProfiles) {
    const pooled = Object.entries(key).filter(([, k]) => k.profile_id === r.id).map(([pid]) => labels.get(pid).final);
    const gainsFor = (list) => list.slice(0, 5).map((x) => labelOf.get(`${r.id}|${x.schemeId}`) ?? 0);
    const sysG = gainsFor(r.systemTop5);
    const baseG = gainsFor(r.baselineTop5);
    const p = (g, k, strict) => g.slice(0, k).filter((x) => (strict ? x === 2 : x >= 1)).length / k;
    const row = { id: r.id, lang: r.lang };
    for (const [name, g] of [['system', sysG], ['baseline', baseG]]) {
      row[name] = {
        p1s: p(g, 1, true), p3s: p(g, 3, true), p5s: p(g, 5, true),
        p1l: p(g, 1, false), p3l: p(g, 3, false), p5l: p(g, 5, false),
        ndcg5: ndcgAtK(g, pooled, 5),
      };
    }
    per.push(row);
  }
  const agg = (rows, sys, metric) => r3(mean(rows.map((x) => x[sys][metric]).filter((v) => v !== null)));
  const metrics = ['p1s', 'p3s', 'p5s', 'p1l', 'p3l', 'p5l', 'ndcg5'];
  const table = {};
  for (const group of ['all', 'en', 'hi', 'bn']) {
    const rows = group === 'all' ? per : per.filter((x) => x.lang === group);
    table[group] = { n: rows.length };
    for (const sys of ['system', 'baseline']) {
      table[group][sys] = Object.fromEntries(metrics.map((m) => [m, agg(rows, sys, m)]));
    }
  }

  // Do the ELIGIBLE badges the system shows hold up?
  const statusStats = { ELIGIBLE: [], POSSIBLY_ELIGIBLE: [], NOT_ELIGIBLE: [] };
  for (const r of recProfiles) {
    for (const x of r.systemTop5) {
      const lab = labelOf.get(`${r.id}|${x.schemeId}`);
      if (lab !== undefined && statusStats[x.status]) statusStats[x.status].push(lab);
    }
  }
  const statusSummary = Object.fromEntries(Object.entries(statusStats).map(([st, arr]) => [st, {
    n: arr.length,
    labelledEligible: arr.filter((x) => x === 2).length,
    labelledPossible: arr.filter((x) => x === 1).length,
    labelledNotEligible: arr.filter((x) => x === 0).length,
    falseEligibleRate: st === 'ELIGIBLE' && arr.length ? r3(arr.filter((x) => x === 0).length / arr.length) : undefined,
  }]));

  return {
    problems: [],
    disagreements,
    agreement: cohenKappa(kappaPairs),
    pooledPairs: labels.size,
    profilesScored: recProfiles.length,
    table,
    statusSummary,
  };
}

function main() {
  const args = process.argv.slice(2);
  const get = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const outDir = path.resolve(get('--out', path.join(HERE, 'out')));
  const fa = get('--a');
  const fb = get('--b');
  if (!fa || !fb) { console.error('Usage: node eval/scoreEval.js --a A.csv --b B.csv [--final adjudicated.csv] [--out eval/out]'); process.exit(2); }
  const key = JSON.parse(fs.readFileSync(path.join(outDir, 'review_key.json'), 'utf8'));
  const results = JSON.parse(fs.readFileSync(path.join(outDir, 'results.json'), 'utf8'));
  const finalMap = new Map();
  if (get('--final')) for (const r of parseCsv(fs.readFileSync(get('--final'), 'utf8'))) finalMap.set(r.pair_id, Number(r.final));

  const res = scoreLabels({
    sheetA: readSheet(fa), sheetB: readSheet(fb), finalMap, key, results,
    allowUnadjudicated: args.includes('--allow-unadjudicated'),
  });

  if (res.problems.length) {
    console.error(`Fix these ${res.problems.length} problem(s) first:\n${res.problems.slice(0, 40).join('\n')}${res.problems.length > 40 ? '\n...' : ''}`);
    process.exit(1);
  }
  if (res.needAdjudication) {
    const f = path.join(outDir, 'disagreements.csv');
    fs.writeFileSync(f, toCsv(res.disagreements, ['pair_id', 'profile_id', 'scheme_name', 'label_A', 'label_B', 'final']));
    console.error(`${res.disagreements.length} rows where A and B disagree. Discuss them, fill the 'final' column in ${f}, then re-run with --final ${f}`);
    process.exit(3);
  }
  fs.writeFileSync(path.join(outDir, 'scores.json'), JSON.stringify(res, null, 1));
  const L = [];
  L.push('YOJANA SAATHI PILOT EVALUATION - PHASE 2 SCORES', '='.repeat(52));
  L.push(`Profiles scored: ${res.profilesScored}   labelled pairs: ${res.pooledPairs}`);
  L.push(`Inter-annotator agreement on shared rows: n=${res.agreement.n}, agreement=${res.agreement.agreement}, Cohen's kappa=${res.agreement.kappa}`, '');
  L.push('RANKING (strict = label 2 only; lenient = label 1 or 2)');
  L.push('group  system     P@1s  P@3s  P@5s  P@1l  P@3l  P@5l  nDCG@5');
  for (const g of ['all', 'en', 'hi', 'bn']) {
    for (const s of ['system', 'baseline']) {
      const m = res.table[g][s];
      L.push(`${(g + `(${res.table[g].n})`).padEnd(7)}${s.padEnd(10)} ${[m.p1s, m.p3s, m.p5s, m.p1l, m.p3l, m.p5l, m.ndcg5].map((x) => String(x).padEnd(5)).join(' ')}`);
    }
  }
  L.push('', 'DO THE SYSTEM STATUS BADGES HOLD UP? (top-5 items, human label vs system status)');
  for (const [st, v] of Object.entries(res.statusSummary)) {
    L.push(`  ${st.padEnd(18)} n=${v.n}  label2=${v.labelledEligible}  label1=${v.labelledPossible}  label0=${v.labelledNotEligible}${v.falseEligibleRate !== undefined ? `  false-ELIGIBLE rate=${v.falseEligibleRate}` : ''}`);
  }
  fs.writeFileSync(path.join(outDir, 'scores.txt'), `${L.join('\n')}\n`);
  console.log(L.join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
