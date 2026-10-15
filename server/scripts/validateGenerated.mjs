/**
 * Validate the generated schemes file before database insertion.
 *
 * Checks:
 * - Exactly 500 records
 * - All slugs unique
 * - Required fields present
 * - Nested relation structures correct
 * - URL formats valid
 * - No duplicate source records
 * - Empty eligibility/benefits/documents arrays allowed
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const FILE = path.resolve(process.argv[2] || './src/data/schemes.generated.js');

async function main() {
  console.log(`Validating: ${FILE}\n`);

  // Dynamic import the generated ES module
  const mod = await import(`file://${FILE.replace(/\\/g, '/')}`);
  const schemes = mod.schemes || mod.default;

  if (!Array.isArray(schemes)) {
    console.error('❌ Export is not an array.');
    process.exit(1);
  }

  let errors = 0;

  // 1. Count check
  if (schemes.length !== 500) {
    console.error(`❌ Expected 500 records, found ${schemes.length}`);
    errors++;
  } else {
    console.log(`✅ Record count: ${schemes.length}`);
  }

  // 2. Slug uniqueness
  const slugs = schemes.map(s => s.slug);
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size !== slugs.length) {
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    console.error(`❌ Duplicate slugs found: ${[...new Set(dupes)].join(', ')}`);
    errors++;
  } else {
    console.log(`✅ All ${uniqueSlugs.size} slugs are unique`);
  }

  // 3. Required fields
  const requiredFields = ['name', 'slug', 'description', 'category', 'level', 'status'];
  let fieldErrors = 0;
  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    for (const field of requiredFields) {
      if (!s[field] || (typeof s[field] === 'string' && !s[field].trim())) {
        console.error(`❌ Record ${i} (${s.slug || 'no-slug'}) missing required field: ${field}`);
        fieldErrors++;
        errors++;
      }
    }
  }
  if (fieldErrors === 0) console.log(`✅ All required fields present in all records`);

  // 4. Nested relation structure
  let structErrors = 0;
  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    // eligibility must have { create: [...] }
    if (!s.eligibility || !Array.isArray(s.eligibility?.create)) {
      console.error(`❌ Record ${i} (${s.slug}) missing eligibility.create array`);
      structErrors++;
    }
    // benefits must have { create: [...] }
    if (!s.benefits || !Array.isArray(s.benefits?.create)) {
      console.error(`❌ Record ${i} (${s.slug}) missing benefits.create array`);
      structErrors++;
    }
    // documents must have { create: [...] }
    if (!s.documents || !Array.isArray(s.documents?.create)) {
      console.error(`❌ Record ${i} (${s.slug}) missing documents.create array`);
      structErrors++;
    }
    // source must have { create: { sourceName, sourceUrl } }
    if (!s.source?.create?.sourceName || !s.source?.create?.sourceUrl) {
      console.error(`❌ Record ${i} (${s.slug}) missing source.create with sourceName/sourceUrl`);
      structErrors++;
    }

    // Validate eligibility items have required fields
    for (const e of s.eligibility?.create || []) {
      if (!e.criteriaType || !e.value || !e.description) {
        console.error(`❌ Record ${i} (${s.slug}) has incomplete eligibility item`);
        structErrors++;
      }
    }

    // Validate benefit items have required fields
    for (const b of s.benefits?.create || []) {
      if (!b.benefitType || !b.description) {
        console.error(`❌ Record ${i} (${s.slug}) has incomplete benefit item`);
        structErrors++;
      }
    }

    // Validate document items have required fields
    for (const d of s.documents?.create || []) {
      if (!d.documentName) {
        console.error(`❌ Record ${i} (${s.slug}) has incomplete document item`);
        structErrors++;
      }
    }
  }
  errors += structErrors;
  if (structErrors === 0) console.log(`✅ All nested relation structures are valid`);

  // 5. URL format validation
  const urlRegex = /^https?:\/\/.+/i;
  let urlErrors = 0;
  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    if (s.officialUrl && !urlRegex.test(s.officialUrl)) {
      console.error(`❌ Record ${i} (${s.slug}) has malformed officialUrl: ${s.officialUrl}`);
      urlErrors++;
    }
    if (s.source?.create?.sourceUrl && !urlRegex.test(s.source.create.sourceUrl)) {
      console.error(`❌ Record ${i} (${s.slug}) has malformed sourceUrl: ${s.source.create.sourceUrl}`);
      urlErrors++;
    }
    // Check for accidental markdown URLs
    if (s.officialUrl?.includes('[') || s.officialUrl?.includes(']')) {
      console.error(`❌ Record ${i} (${s.slug}) officialUrl contains markdown syntax`);
      urlErrors++;
    }
  }
  errors += urlErrors;
  if (urlErrors === 0) console.log(`✅ All URLs are properly formatted`);

  // 6. No duplicate source records (by name+sourceUrl)
  const sourceKeys = schemes.map(s =>
    `${s.source?.create?.sourceName}|${s.source?.create?.sourceUrl}`
  );
  const uniqueSourceKeys = new Set(sourceKeys);
  // Note: it's OK if many schemes share the same source portal but different schemes
  // Duplicate means exact same name mapped twice
  const nameKeys = schemes.map(s => s.name.toLowerCase().trim());
  const uniqueNames = new Set(nameKeys);
  if (uniqueNames.size !== nameKeys.length) {
    const dupeNames = nameKeys.filter((n, i) => nameKeys.indexOf(n) !== i);
    console.warn(`⚠️  ${nameKeys.length - uniqueNames.size} duplicate scheme name(s) found (may be OK if slugs differ): ${[...new Set(dupeNames)].slice(0, 5).join(', ')}...`);
  } else {
    console.log(`✅ No duplicate scheme names`);
  }

  // 7. Status check — should all be NeedsVerification for imported data
  const statusCounts = {};
  for (const s of schemes) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }
  console.log(`\nStatus distribution: ${JSON.stringify(statusCounts)}`);

  // 8. lastVerifiedAt check — should be null for imported data
  const verifiedCount = schemes.filter(s => s.lastVerifiedAt !== null).length;
  if (verifiedCount > 0) {
    console.warn(`⚠️  ${verifiedCount} records have non-null lastVerifiedAt`);
  } else {
    console.log(`✅ All lastVerifiedAt are null (correct for unverified imports)`);
  }

  // 9. Level distribution
  const levelCounts = {};
  for (const s of schemes) {
    levelCounts[s.level] = (levelCounts[s.level] || 0) + 1;
  }
  console.log(`Level distribution: ${JSON.stringify(levelCounts)}`);

  // 10. Category distribution
  const catCounts = {};
  for (const s of schemes) {
    catCounts[s.category] = (catCounts[s.category] || 0) + 1;
  }
  console.log(`Category distribution: ${JSON.stringify(catCounts)}`);

  // 11. Empty arrays stats
  const emptyEligibility = schemes.filter(s => s.eligibility.create.length === 0).length;
  const emptyBenefits = schemes.filter(s => s.benefits.create.length === 0).length;
  const emptyDocs = schemes.filter(s => s.documents.create.length === 0).length;
  console.log(`\nEmpty arrays: eligibility=${emptyEligibility}, benefits=${emptyBenefits}, documents=${emptyDocs}`);

  console.log(`\n${errors === 0 ? '✅ All validations passed!' : `❌ ${errors} validation error(s) found.`}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
