import { PrismaClient } from '@prisma/client';
import { schemes } from './schemeData.js';

const prisma = new PrismaClient();

/**
 * Prisma Seed Script
 *
 * Seeds verified, publicly known government scheme data for development.
 * Source: myScheme portal (https://www.myscheme.gov.in/) and official ministry pages.
 *
 * HOW TO RUN:
 *   npm run db:seed
 *
 * NOTE: All scheme data here is based on publicly available information.
 * Always verify against the official source before using in production.
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // ── Seed Schemes ────────────────────────────────────────────────────────────

  for (const schemeData of schemes) {
    // Use upsert to avoid errors on re-seeding
    await prisma.scheme.upsert({
      where: { slug: schemeData.slug },
      update: {},
      create: schemeData,
    });
    console.log(`✅ Seeded: ${schemeData.name}`);
  }

  console.log('\n🎉 Seed complete! Seeded', schemes.length, 'government schemes.');
  console.log('💡 All data sourced from official government portals.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
