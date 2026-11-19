/**
 * Generate Hindi & Bengali translations for all schemes.
 *
 * Uses Groq (openai/gpt-oss-120b) with concise prompts to translate scheme
 * names, summaries, and application process into both Hindi and Bengali.
 *
 * Saves progress incrementally to `server/src/data/translations.generated.json`
 * AND writes directly to PostgreSQL via Prisma.
 *
 * Usage:
 *   node scripts/generateTranslations.js              # full run
 *   node scripts/generateTranslations.js --dry-run    # preview counts only
 *   node scripts/generateTranslations.js --limit 10   # translate first 10 only
 *   node scripts/generateTranslations.js --batch 5    # batch size
 */
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRANSLATIONS_CACHE_FILE = path.resolve(__dirname, '..', 'src', 'data', 'translations.generated.json');

const prisma = new PrismaClient();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is required. Set it in server/.env');
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanExcerpt(text, maxLen = 300) {
  if (!text) return '';
  // Normalize whitespace
  let clean = text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
  // If it contains "Eligibility criteria from source:" or "Benefits from source:", cut before that
  const cutIndex = clean.indexOf('Eligibility criteria from source:');
  if (cutIndex > 50) clean = clean.slice(0, cutIndex).trim();

  if (clean.length <= maxLen) return clean;
  const truncated = clean.slice(0, maxLen);
  const lastDot = truncated.lastIndexOf('.');
  if (lastDot > maxLen * 0.4) {
    return truncated.slice(0, lastDot + 1);
  }
  return truncated.trim() + '…';
}

function loadCache() {
  if (fs.existsSync(TRANSLATIONS_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TRANSLATIONS_CACHE_FILE, 'utf8'));
      if (typeof data === 'object' && data !== null) return data;
    } catch {
      // ignore
    }
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(TRANSLATIONS_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function buildPrompt(schemes) {
  const items = schemes.map((s, i) => {
    return `Scheme ${i + 1} [${s.slug}]:
Name: ${s.name}
Description: ${cleanExcerpt(s.description, 280)}
Application: ${cleanExcerpt(s.applicationProcess || '', 150)}`;
  }).join('\n\n');

  return `Translate each of the following ${schemes.length} Indian government schemes into Hindi (hi) and Bengali (bn).

${items}

RULES:
- Keep proper nouns, portal URLs, and abbreviations (e.g. PM-KISAN, PMAY, UGC, DBT, CSC, NEET) in English.
- Keep monetary amounts (e.g. ₹6,000, ₹5 lakh) formatted clearly.
- Translate into natural conversational Hindi and Bengali.
- Output ONLY a JSON array with one object per scheme:
[
  {
    "slug": "scheme-slug",
    "hi": { "name": "...", "description": "...", "applicationProcess": "..." },
    "bn": { "name": "...", "description": "...", "applicationProcess": "..." }
  }
]`;
}

function parseResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const arr = JSON.parse(cleaned);
    if (Array.isArray(arr)) return arr;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
  }
  return null;
}

async function translateBatch(schemes, retries = 3) {
  const prompt = buildPrompt(schemes);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an accurate English to Hindi and Bengali government translator. Always reply in valid JSON array.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      });

      const text = response.choices?.[0]?.message?.content || '';
      const parsed = parseResponse(text);

      if (!parsed || parsed.length === 0) {
        if (attempt < retries) {
          console.warn(`   ⚠️ Unparseable response. Retrying (${attempt + 1}/${retries})...`);
          await sleep(2000);
          continue;
        }
        return null;
      }
      return parsed;
    } catch (error) {
      if (attempt < retries) {
        const isRateLimit = error?.status === 429 || error?.message?.includes('429');
        const waitMs = isRateLimit ? 30000 : 4000;
        console.warn(`   ⚠️ API error: ${error.message}. Waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }
      console.error(`   ❌ Failed after ${retries + 1} attempts: ${error.message}`);
      return null;
    }
  }
  return null;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const limitIdx = process.argv.indexOf('--limit');
  const maxSchemes = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;
  const batchIdx = process.argv.indexOf('--batch');
  const BATCH_SIZE = batchIdx !== -1 ? parseInt(process.argv[batchIdx + 1], 10) : 5;
  const DELAY_MS = 1500;

  console.log('🌐 Generating Hindi & Bengali translations for schemes...');
  console.log(`   Model: ${GROQ_MODEL} | Batch Size: ${BATCH_SIZE}\n`);

  const cache = loadCache();
  const cachedSlugs = Object.keys(cache);
  console.log(`📁 Loaded ${cachedSlugs.length} schemes from local translations file.`);

  // Get all active schemes
  const allSchemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      applicationProcess: true,
      translations: { select: { language: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Sync already cached translations into DB if missing in DB
  let syncedFromCache = 0;
  for (const s of allSchemes) {
    const cached = cache[s.slug];
    if (!cached) continue;

    const dbHasHi = s.translations.some(t => t.language === 'hi');
    const dbHasBn = s.translations.some(t => t.language === 'bn');

    if (!dbHasHi && cached.hi) {
      if (!isDryRun) {
        await prisma.schemeTranslation.upsert({
          where: { schemeId_language: { schemeId: s.id, language: 'hi' } },
          update: { name: cached.hi.name, description: cached.hi.description, applicationProcess: cached.hi.applicationProcess || '' },
          create: { schemeId: s.id, language: 'hi', name: cached.hi.name, description: cached.hi.description, applicationProcess: cached.hi.applicationProcess || '' },
        });
      }
      syncedFromCache++;
    }

    if (!dbHasBn && cached.bn) {
      if (!isDryRun) {
        await prisma.schemeTranslation.upsert({
          where: { schemeId_language: { schemeId: s.id, language: 'bn' } },
          update: { name: cached.bn.name, description: cached.bn.description, applicationProcess: cached.bn.applicationProcess || '' },
          create: { schemeId: s.id, language: 'bn', name: cached.bn.name, description: cached.bn.description, applicationProcess: cached.bn.applicationProcess || '' },
        });
      }
      syncedFromCache++;
    }
  }

  if (syncedFromCache > 0) {
    console.log(`⚡ Synced ${syncedFromCache} cached translations to database.`);
  }

  // Filter schemes that still need LLM generation (not in cache)
  const ungeneratedSchemes = allSchemes.filter(s => !cache[s.slug]?.hi?.name || !cache[s.slug]?.bn?.name);
  console.log(`📊 Total active schemes: ${allSchemes.length}`);
  console.log(`🤖 Schemes requiring Groq generation: ${ungeneratedSchemes.length}`);

  if (ungeneratedSchemes.length === 0) {
    console.log('\n✅ All schemes are already translated and synced!');
    return;
  }

  const toProcess = ungeneratedSchemes.slice(0, maxSchemes);
  console.log(`🔄 Processing ${toProcess.length} schemes...`);

  if (isDryRun) {
    console.log('🔍 DRY RUN — stopping before API calls.');
    return;
  }

  let totalGenerated = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} schemes) [${elapsed}s elapsed]`);

    const results = await translateBatch(batch);
    if (!results || results.length === 0) {
      console.warn(`   ⚠️ Batch ${batchNum} returned no results, skipping.`);
      totalFailed += batch.length;
      await sleep(DELAY_MS);
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const scheme = batch[j];
      const trans = results.find(r => r.slug === scheme.slug) || results[j];

      if (!trans || !trans.hi?.name || !trans.bn?.name) {
        console.warn(`   ⚠️ Missing translation for ${scheme.slug}`);
        totalFailed++;
        continue;
      }

      // Save to cache object
      cache[scheme.slug] = {
        name: scheme.name,
        hi: {
          name: trans.hi.name,
          description: trans.hi.description || '',
          applicationProcess: trans.hi.applicationProcess || '',
        },
        bn: {
          name: trans.bn.name,
          description: trans.bn.description || '',
          applicationProcess: trans.bn.applicationProcess || '',
        },
      };

      // Write to database
      try {
        await prisma.schemeTranslation.upsert({
          where: { schemeId_language: { schemeId: scheme.id, language: 'hi' } },
          update: { name: trans.hi.name, description: trans.hi.description || '', applicationProcess: trans.hi.applicationProcess || '' },
          create: { schemeId: scheme.id, language: 'hi', name: trans.hi.name, description: trans.hi.description || '', applicationProcess: trans.hi.applicationProcess || '' },
        });

        await prisma.schemeTranslation.upsert({
          where: { schemeId_language: { schemeId: scheme.id, language: 'bn' } },
          update: { name: trans.bn.name, description: trans.bn.description || '', applicationProcess: trans.bn.applicationProcess || '' },
          create: { schemeId: scheme.id, language: 'bn', name: trans.bn.name, description: trans.bn.description || '', applicationProcess: trans.bn.applicationProcess || '' },
        });

        totalGenerated += 2;
      } catch (err) {
        console.error(`   ❌ DB write error for ${scheme.slug}: ${err.message}`);
      }
    }

    // Persist cache file after every batch so progress is never lost
    saveCache(cache);
    console.log(`   💾 Saved batch to ${path.basename(TRANSLATIONS_CACHE_FILE)} (Total cached: ${Object.keys(cache).length})`);

    if (i + BATCH_SIZE < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TRANSLATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Translations written to DB: ${totalGenerated}`);
  console.log(`  Failed:                     ${totalFailed}`);
  console.log(`  Time elapsed:               ${totalTime}s`);
  console.log(`  Total cached in JSON:       ${Object.keys(cache).length}`);
  console.log('═'.repeat(60));

  const finalCounts = await prisma.$queryRawUnsafe(
    `SELECT language, COUNT(*)::int as count FROM "scheme_translations" GROUP BY language`
  );
  console.log('\n📊 Final translation counts in database:');
  console.table(finalCounts);
}

main()
  .catch((e) => {
    console.error('❌ Translation generation failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
