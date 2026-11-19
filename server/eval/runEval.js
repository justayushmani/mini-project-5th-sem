#!/usr/bin/env node
/**
 * Yojana Saathi pilot evaluation - PHASE 1 (run the system, collect outputs).
 *
 * Run from the server/ folder:
 *   node eval/runEval.js                 # all 60 profiles
 *   node eval/runEval.js --limit 5       # quick smoke test
 *   node eval/runEval.js --delay 3000    # slower, if Groq returns rate-limit errors
 *
 * Needs server/.env with DATABASE_URL, GROQ_API_KEY and GROQ_MODEL=llama-3.3-70b-versatile,
 * and a database that already holds the schemes. Nothing is written to the database.
 * Output goes to eval/out/  (send that whole folder back).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SCORED_FIELDS, scoreProfile, aggregateExtraction, buildBm25,
  mulberry32, shuffle, median, percentile, toCsv,
} from './lib.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATUS_ORDER = { ELIGIBLE: 0, POSSIBLY_ELIGIBLE: 1, NOT_ELIGIBLE: 2 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sortEvaluated(list) {
  return [...list].sort((a, b) => {
    const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return d !== 0 ? d : b.relevanceScore - a.relevanceScore;
  });
}

async function defaultDeps() {
  const { extractProfileWithGroq } = await import('../src/services/ai/groq.service.js');
  const rec = await import('../src/services/recommendation/recommendation.service.js');
  const prismaMod = await import('../src/lib/prisma.js');
  const prisma = prismaMod.default;
  const envMod = await import('../src/config/env.js');
  return {
    extract: extractProfileWithGroq,
    normalize: rec.normalizeProfileSnapshot,
    evaluate: rec.evaluateScheme,
    prisma,
    env: envMod.default,
  };
}

async function extractWithRetry(extract, text, language, log) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return { profile: await extract({ text, language }), error: null };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const retryable = /429|rate|timeout|ECONN|503|502/i.test(msg);
      log(`    extraction error (attempt ${attempt + 1}): ${msg.slice(0, 120)}`);
      if (!retryable) break;
      await sleep(2000 * 2 ** attempt);
    }
  }
  return { profile: null, error: String(lastErr?.message || lastErr) };
}

export async function runEval({ testset, deps, outDir, delayMs = 1500, limit = null, log = console.log }) {
  const { extract, normalize, evaluate, prisma, env } = deps;
  fs.mkdirSync(outDir, { recursive: true });

  // ---- data environment (answers: how many schemes, which status, which translations)
  const statusGroups = await prisma.scheme.groupBy({ by: ['status'], _count: { _all: true } });
  const translationGroups = await prisma.schemeTranslation.groupBy({ by: ['language'], _count: { _all: true } });
  const schemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    include: { eligibility: true, benefits: { take: 2 }, source: { select: { sourceName: true, sourceUrl: true } } },
  });
  let commit = null;
  try { commit = execSync('git rev-parse --short HEAD', { cwd: HERE }).toString().trim(); } catch { /* not a git checkout */ }
  const envInfo = {
    date: new Date().toISOString(),
    node: process.version,
    os: `${os.platform()} ${os.release()}`,
    gitCommit: commit,
    groqModel: env?.groqModel ?? null,
    embeddingModel: env?.embeddingModel ?? null,
    schemesByStatus: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
    translationsByLanguage: Object.fromEntries(translationGroups.map((g) => [g.language, g._count._all])),
    activeSchemesUsed: schemes.length,
    activeSchemesWithEligibilityRules: schemes.filter((s) => s.eligibility.length > 0).length,
    activeSchemesWithSource: schemes.filter((s) => s.source?.sourceUrl || s.officialUrl).length,
  };
  log(`Active schemes: ${schemes.length}. Model: ${envInfo.groqModel}`);
  if (schemes.length === 0) throw new Error('No Active schemes in the database - nothing to evaluate against.');

  const byId = new Map(schemes.map((s) => [s.id, s]));
  const bm25 = buildBm25(schemes.map((s) => ({
    id: s.id,
    text: `${s.name} ${s.name} ${s.name} ${s.description || ''} ${s.category || ''}`,
  })));
  const brief = (ev) => ({ schemeId: ev.schemeId, slug: byId.get(ev.schemeId)?.slug, name: byId.get(ev.schemeId)?.name, status: ev.status, score: ev.relevanceScore });

  const profiles = limit ? testset.profiles.slice(0, limit) : testset.profiles;
  const results = [];

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    log(`[${i + 1}/${profiles.length}] ${p.id}`);
    const t0 = process.hrtime.bigint();
    const { profile: extracted, error } = await extractWithRetry(extract, p.text, p.lang, log);
    const latencyMs = Number(process.hrtime.bigint() - t0) / 1e6;

    const outcomes = scoreProfile(p.gold, extracted || {});

    // engine run with the EXTRACTED profile, and with the GOLD profile (isolates extraction errors)
    const run = (profile) => sortEvaluated(schemes.map((s) => evaluate(s, normalize(profile))));
    const sysAll = extracted ? run(extracted) : [];
    const goldAll = run(p.gold);
    const statusOf = (all) => new Map(all.map((e) => [e.schemeId, e.status]));
    const sm = statusOf(sysAll);
    const gm = statusOf(goldAll);
    let same = 0;
    for (const s of schemes) if (sm.get(s.id) === gm.get(s.id)) same++;
    const eligSys = new Set(sysAll.filter((e) => e.status === 'ELIGIBLE').map((e) => e.schemeId));
    const eligGold = new Set(goldAll.filter((e) => e.status === 'ELIGIBLE').map((e) => e.schemeId));
    const inter = [...eligSys].filter((x) => eligGold.has(x)).length;
    const union = new Set([...eligSys, ...eligGold]).size;
    const count = (all, st) => all.filter((e) => e.status === st).length;

    const base = bm25(p.textEn, 5).map((x) => ({ schemeId: x.id, slug: byId.get(x.id)?.slug, name: byId.get(x.id)?.name, score: Number(x.score.toFixed(3)) }));

    results.push({
      id: p.id, lang: p.lang, tags: p.tags, rec: p.rec,
      text: p.text, textEn: p.textEn, gold: p.gold,
      extracted, error, latencyMs: Math.round(latencyMs), outcomes,
      engine: {
        statusCounts: { ELIGIBLE: count(sysAll, 'ELIGIBLE'), POSSIBLY_ELIGIBLE: count(sysAll, 'POSSIBLY_ELIGIBLE'), NOT_ELIGIBLE: count(sysAll, 'NOT_ELIGIBLE') },
        goldStatusCounts: { ELIGIBLE: count(goldAll, 'ELIGIBLE'), POSSIBLY_ELIGIBLE: count(goldAll, 'POSSIBLY_ELIGIBLE'), NOT_ELIGIBLE: count(goldAll, 'NOT_ELIGIBLE') },
        statusAgreementWithGold: extracted ? Number((same / schemes.length).toFixed(4)) : null,
        eligibleJaccardWithGold: extracted ? (union === 0 ? 1 : Number((inter / union).toFixed(4))) : null,
      },
      systemTop5: sysAll.slice(0, 5).map(brief),
      systemGoldTop5: goldAll.slice(0, 5).map(brief),
      baselineTop5: base,
    });
    if (i < profiles.length - 1) await sleep(delayMs);
  }

  // ---------------------------------------------------------------- summary
  const ok = results.filter((r) => r.extracted);
  const agg = aggregateExtraction(ok);
  const langAgg = Object.fromEntries(['en', 'hi', 'bn'].map((l) => [l, aggregateExtraction(ok.filter((r) => r.lang === l))]));
  const allTags = [...new Set(results.flatMap((r) => r.tags))].sort();
  const tagAgg = Object.fromEntries(allTags.map((t) => [t, aggregateExtraction(ok.filter((r) => r.tags.includes(t)))]));
  const lat = results.map((r) => r.latencyMs);
  const engineRows = ok.filter((r) => r.engine.statusAgreementWithGold !== null);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

  const summary = {
    envInfo,
    profilesRun: results.length,
    extractionFailures: results.filter((r) => !r.extracted).length,
    extraction: { overall: agg, byLanguage: langAgg, byTag: tagAgg },
    latencyMs: { median: median(lat), p95: percentile(lat, 95), max: Math.max(...lat) },
    engineVsGoldProfile: {
      meanStatusAgreement: mean(engineRows.map((r) => r.engine.statusAgreementWithGold)),
      meanEligibleJaccard: mean(engineRows.map((r) => r.engine.eligibleJaccardWithGold)),
    },
  };

  const fmt = (x) => (x === null || x === undefined ? '  -  ' : String(x).padEnd(5));
  const lines = [];
  lines.push('YOJANA SAATHI PILOT EVALUATION - PHASE 1 SUMMARY', '='.repeat(52), '');
  lines.push('DATA / ENVIRONMENT', JSON.stringify(envInfo, null, 2), '');
  lines.push(`Profiles run: ${results.length}   extraction failures: ${summary.extractionFailures}`, '');
  const table = (title, a) => {
    lines.push(title, 'field             tp  missed wrong spurious  P     R     F1');
    for (const f of SCORED_FIELDS) {
      const c = a.perField[f];
      lines.push(`${f.padEnd(16)} ${String(c.tp).padStart(3)} ${String(c.missed).padStart(6)} ${String(c.wrong).padStart(5)} ${String(c.spurious).padStart(8)}  ${fmt(c.precision)} ${fmt(c.recall)} ${fmt(c.f1)}`);
    }
    lines.push(`MICRO-AVERAGE     P=${a.micro.precision} R=${a.micro.recall} F1=${a.micro.f1}   exact profile match=${a.exactProfileMatch} (n=${a.n})`, '');
  };
  table('EXTRACTION - ALL PROFILES', agg);
  for (const l of ['en', 'hi', 'bn']) table(`EXTRACTION - ${l.toUpperCase()}`, langAgg[l]);
  lines.push('EXTRACTION BY TAG (micro F1 / exact-match / n)');
  for (const t of allTags) lines.push(`  ${t.padEnd(10)} F1=${tagAgg[t].micro.f1}  exact=${tagAgg[t].exactProfileMatch}  n=${tagAgg[t].n}  spurious=${tagAgg[t].spuriousValues}`);
  lines.push('', `LATENCY (extraction call): median ${summary.latencyMs.median} ms, p95 ${summary.latencyMs.p95} ms, max ${summary.latencyMs.max} ms`);
  lines.push(`ENGINE: extracted-vs-gold profile - mean status agreement ${summary.engineVsGoldProfile.meanStatusAgreement?.toFixed(3)}, mean Jaccard of ELIGIBLE sets ${summary.engineVsGoldProfile.meanEligibleJaccard?.toFixed(3)}`);

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 1));
  fs.writeFileSync(path.join(outDir, 'summary.txt'), `${lines.join('\n')}\n`);
  fs.writeFileSync(path.join(outDir, 'env_info.json'), JSON.stringify(envInfo, null, 1));

  // ---------------------------------------------------------------- blind review sheet (recommendation subset)
  const rnd = mulberry32(20261119);
  const pool = [];
  for (const r of results.filter((x) => x.rec)) {
    const seen = new Map();
    r.systemTop5.forEach((x, i) => seen.set(x.schemeId, { sys: i + 1, sysStatus: x.status, base: null }));
    r.baselineTop5.forEach((x, i) => {
      const cur = seen.get(x.schemeId) || { sys: null, sysStatus: null, base: null };
      cur.base = i + 1;
      seen.set(x.schemeId, cur);
    });
    for (const [schemeId, info] of seen) pool.push({ profile: r, schemeId, info });
  }
  const shuffled = shuffle(pool, rnd);
  const sheet = [];
  const key = {};
  shuffled.forEach((item, idx) => {
    const s = byId.get(item.schemeId);
    const pairId = `P${String(idx + 1).padStart(4, '0')}`;
    const both = rnd() < 0.3; // ~30% labelled by both people -> inter-annotator agreement
    const assigned = both ? 'BOTH' : idx % 2 === 0 ? 'A' : 'B';
    const facts = Object.entries(item.profile.gold).map(([k, v]) => `${k}=${v}`).join('; ');
    sheet.push({
      pair_id: pairId,
      profile_id: item.profile.id,
      profile_text: item.profile.text,
      profile_text_english: item.profile.textEn,
      profile_facts: facts,
      scheme_name: s.name,
      scheme_category: s.category,
      scheme_state: s.state || 'Central / all states',
      scheme_description: (s.description || '').replace(/\s+/g, ' ').slice(0, 400),
      eligibility_rules: s.eligibility.map((e) => `${e.isRequired ? 'REQUIRED' : 'optional'}: ${e.description}`).join(' | '),
      official_url: s.officialUrl || s.source?.sourceUrl || '',
      assigned_to: assigned,
      label_A: '', label_B: '', final: '', notes: '',
    });
    key[pairId] = { profile_id: item.profile.id, schemeId: item.schemeId, slug: s.slug, systemRank: item.info.sys, systemStatus: item.info.sysStatus, baselineRank: item.info.base };
  });
  const cols = ['pair_id', 'profile_id', 'profile_text', 'profile_text_english', 'profile_facts', 'scheme_name', 'scheme_category', 'scheme_state', 'scheme_description', 'eligibility_rules', 'official_url', 'assigned_to', 'label_A', 'label_B', 'final', 'notes'];
  fs.writeFileSync(path.join(outDir, 'review_sheet.csv'), toCsv(sheet, cols));
  fs.writeFileSync(path.join(outDir, 'review_key.json'), JSON.stringify(key, null, 1));
  log(`Review sheet: ${sheet.length} profile-scheme pairs (${sheet.filter((r) => r.assigned_to === 'BOTH').length} labelled by both).`);

  return { results, summary, sheet, key };
}

async function main() {
  const args = process.argv.slice(2);
  const get = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
  const limit = get('--limit', null) ? Number(get('--limit')) : null;
  const delayMs = Number(get('--delay', 1500));
  const outDir = path.resolve(get('--out', path.join(HERE, 'out')));
  const testset = JSON.parse(fs.readFileSync(path.join(HERE, 'testset.json'), 'utf8'));
  const deps = await defaultDeps();
  try {
    await runEval({ testset, deps, outDir, delayMs, limit });
    console.log(`\nDone. Send the folder: ${outDir}`);
  } finally {
    await deps.prisma.$disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
}
