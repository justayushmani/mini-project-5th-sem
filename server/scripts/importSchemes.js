/**
 * Import generated MyScheme records into the database.
 *
 * Idempotent: matches schemes by unique slug, skips existing ones.
 * Preserves existing detailed scheme records.
 *
 * Usage:
 *   node scripts/importSchemes.js
 *   node scripts/importSchemes.js --dry-run    # Preview without writing
 *
 * This script uses the same Prisma client and conventions as the existing seed.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('📦 Loading generated schemes...');

  // Dynamic import of the generated ES module
  const schemesModule = await import('../src/data/schemes.generated.js');
  const schemes = schemesModule.schemes || schemesModule.default;

  if (!Array.isArray(schemes) || schemes.length === 0) {
    console.error('❌ No schemes found in the generated file.');
    process.exit(1);
  }

  console.log(`📋 Found ${schemes.length} schemes to import.`);
  if (isDryRun) console.log('🔍 DRY RUN — no database writes will be made.\n');

  // Get all existing slugs to skip duplicates efficiently
  const existingSlugs = new Set(
    (await prisma.scheme.findMany({ select: { slug: true } })).map(s => s.slug)
  );
  console.log(`📊 ${existingSlugs.size} schemes already exist in the database.\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const failedRecords = [];

  for (let i = 0; i < schemes.length; i++) {
    const schemeData = schemes[i];
    const { slug, name } = schemeData;

    // Skip if already exists
    if (existingSlugs.has(slug)) {
      skipped++;
      if (isDryRun) console.log(`  ⏭️  [${i + 1}/${schemes.length}] SKIP (exists): ${name}`);
      continue;
    }

    if (isDryRun) {
      console.log(`  ✅ [${i + 1}/${schemes.length}] WOULD INSERT: ${name}`);
      inserted++;
      continue;
    }

    try {
      await prisma.scheme.create({
        data: schemeData,
      });
      inserted++;
      if (inserted % 50 === 0 || i === schemes.length - 1) {
        console.log(`  ✅ [${i + 1}/${schemes.length}] Inserted ${inserted} so far... (latest: ${name})`);
      }
    } catch (error) {
      failed++;
      failedRecords.push({ slug, name, error: error.message });
      console.error(`  ❌ [${i + 1}/${schemes.length}] FAILED: ${name} — ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total in file:  ${schemes.length}`);
  console.log(`  Inserted:       ${inserted}`);
  console.log(`  Skipped:        ${skipped} (already exist)`);
  console.log(`  Failed:         ${failed}`);
  if (isDryRun) console.log('  Mode:           DRY RUN (no actual writes)');
  console.log('═'.repeat(60));

  if (failedRecords.length > 0) {
    console.log('\n❌ Failed records:');
    for (const rec of failedRecords) {
      console.log(`  - ${rec.name} (${rec.slug}): ${rec.error}`);
    }
  }

  // Verify final count
  if (!isDryRun) {
    const totalSchemes = await prisma.scheme.count();
    console.log(`\n📈 Total schemes now in database: ${totalSchemes}`);
  }

  if (failed > 0) {
    console.error(`\n⚠️  ${failed} record(s) failed. Review errors above.`);
    process.exit(1);
  }

  console.log('\n✅ Import completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Import script failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
