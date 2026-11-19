/**
 * Activate All Schemes
 *
 * Sets every scheme with status "NeedsVerification" to "Active".
 * This is safe to re-run (idempotent).
 *
 * Usage:
 *   node scripts/activateSchemes.js
 *   node scripts/activateSchemes.js --dry-run
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  const before = await prisma.scheme.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('📊 Current scheme status distribution:');
  for (const row of before) {
    console.log(`   ${row.status}: ${row._count.id}`);
  }

  const needsVerification = before.find(r => r.status === 'NeedsVerification');
  if (!needsVerification || needsVerification._count.id === 0) {
    console.log('\n✅ No schemes with NeedsVerification status. Nothing to do.');
    return;
  }

  if (isDryRun) {
    console.log(`\n🔍 DRY RUN: Would activate ${needsVerification._count.id} schemes.`);
    return;
  }

  const result = await prisma.scheme.updateMany({
    where: { status: 'NeedsVerification' },
    data: { status: 'Active' },
  });

  console.log(`\n✅ Activated ${result.count} schemes (NeedsVerification → Active).`);

  const after = await prisma.scheme.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('\n📊 Updated scheme status distribution:');
  for (const row of after) {
    console.log(`   ${row.status}: ${row._count.id}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Activation script failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
